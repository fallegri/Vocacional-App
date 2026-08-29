import { neon, Pool, type NeonQueryFunction } from "@neondatabase/serverless";

/**
 * Cliente Neon inicializado de forma perezosa (lazy).
 *
 * El driver NUNCA se crea al cargar el módulo ni durante `next build`:
 * `process.env.DATABASE_URL` solo se lee cuando se ejecuta una consulta real.
 * Si no hay DATABASE_URL definida en tiempo de ejecución, se lanza un error
 * claro; de esta forma la compilación de producción funciona sin secretos.
 */
let cachedClient: NeonQueryFunction<false, false> | null = null;

function getClient(): NeonQueryFunction<false, false> {
  if (cachedClient) return cachedClient;

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      "DATABASE_URL no está definida. Configura la cadena de conexión de Neon Postgres en tu entorno (por ejemplo en .env.local) antes de ejecutar consultas."
    );
  }

  cachedClient = neon(connectionString);
  return cachedClient;
}

/**
 * Helper de consultas con tagged template. Uso:
 *   const rows = await sql`SELECT * FROM app_users WHERE id = ${id}`;
 * La conexión se resuelve en el momento de la llamada, no al importar.
 */
export function sql(
  strings: TemplateStringsArray,
  ...values: unknown[]
): Promise<Record<string, unknown>[]> {
  const client = getClient();
  return client(strings, ...values) as Promise<Record<string, unknown>[]>;
}

/**
 * Pool perezoso para consultas parametrizadas con texto SQL explícito.
 *
 * La función HTTP que devuelve `neon()` no expone un método `.query(text,
 * params)`, por lo que las consultas parametrizadas se ejecutan a través de un
 * `Pool` (compatible con node-postgres). El Pool también se crea de forma
 * perezosa: `process.env.DATABASE_URL` solo se lee en la primera consulta.
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
