import { neon, type NeonQueryFunction } from "@neondatabase/serverless";

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
 * Helper para consultas parametrizadas con texto SQL explícito. Uso:
 *   const rows = await query("SELECT * FROM app_users WHERE id = $1", [id]);
 */
export function query(
  text: string,
  params: unknown[] = []
): Promise<Record<string, unknown>[]> {
  const client = getClient() as unknown as {
    query: (text: string, params?: unknown[]) => Promise<Record<string, unknown>[]>;
  };
  return client.query(text, params);
}
