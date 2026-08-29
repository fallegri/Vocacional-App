import { Pool, type PoolClient } from "@neondatabase/serverless";

/**
 * Acceso a Neon Postgres mediante un único `Pool` (compatible con
 * node-postgres), creado de forma perezosa (lazy).
 *
 * El Pool NUNCA se crea al cargar el módulo ni durante `next build`:
 * `process.env.DATABASE_URL` solo se lee en la primera consulta real. Si no hay
 * DATABASE_URL definida en tiempo de ejecución, se lanza un error claro; de
 * esta forma la compilación de producción funciona sin secretos.
 *
 * Toda consulta parametrizada usa `query(text, params)`. Para operaciones que
 * deben ser atómicas (varias escrituras) usa `withTransaction`, que toma una
 * conexión del pool, ejecuta BEGIN/COMMIT (o ROLLBACK ante error) y SIEMPRE
 * libera la conexión.
 */
let cachedPool: Pool | null = null;

function getPool(): Pool {
  if (cachedPool) return cachedPool;

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      "DATABASE_URL no está definida. Configura la cadena de conexión de Neon Postgres en tu entorno (por ejemplo en .env.local) antes de ejecutar consultas."
    );
  }

  cachedPool = new Pool({ connectionString });
  return cachedPool;
}

/**
 * Helper para consultas parametrizadas con texto SQL explícito. Uso:
 *   const rows = await query("SELECT * FROM app_users WHERE id = $1", [id]);
 */
export async function query(
  text: string,
  params: unknown[] = []
): Promise<Record<string, unknown>[]> {
  const pool = getPool();
  const result = await pool.query(text, params);
  return result.rows as Record<string, unknown>[];
}

/**
 * Ejecuta `work` dentro de una transacción sobre una única conexión del pool.
 * Emite BEGIN antes y COMMIT al terminar; si `work` lanza, hace ROLLBACK y
 * re-lanza el error. La conexión se libera SIEMPRE (éxito o error).
 *
 * Uso:
 *   await withTransaction(async (tx) => {
 *     await tx("INSERT ...", [..]);
 *     await tx("INSERT ...", [..]);
 *   });
 */
export async function withTransaction<T>(
  work: (
    tx: (text: string, params?: unknown[]) => Promise<Record<string, unknown>[]>
  ) => Promise<T>
): Promise<T> {
  const pool = getPool();
  const client: PoolClient = await pool.connect();
  const tx = async (
    text: string,
    params: unknown[] = []
  ): Promise<Record<string, unknown>[]> => {
    const result = await client.query(text, params);
    return result.rows as Record<string, unknown>[];
  };

  try {
    await client.query("BEGIN");
    const value = await work(tx);
    await client.query("COMMIT");
    return value;
  } catch (err) {
    try {
      await client.query("ROLLBACK");
    } catch {
      // Ignora errores del rollback (p. ej. conexión ya caída); prevalece el
      // error original de la transacción.
    }
    throw err;
  } finally {
    client.release();
  }
}
