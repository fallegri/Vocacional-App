# OrientApp Web

Aplicación web de diagnóstico vocacional **RIASEC** (modelo de Holland), migrada
desde la app Android nativa **OrientApp** (Kotlin / Jetpack Compose / Room) a una
aplicación **Next.js 15 (App Router) + TypeScript**, desplegable en **Vercel** con
**Neon** (Postgres serverless + `pgvector`).

- Los fuentes Android originales se conservan intactos en el directorio `app/`
  del repositorio (no se modifican).
- La aplicación web desplegable vive en `web/` (este directorio).
- Toda la interfaz está en **español**.

## Funcionalidades

- **Test vocacional de 60 preguntas** (10 por dimensión RIASEC, con pares espejo)
  y motor psicométrico portado fielmente (puntajes por dimensión 0–100,
  detección de calidad: trampa de velocidad, patrón recto, consistencia de pares
  espejo, nivel de fiabilidad).
- **Resultados con gráfico radar** y **emparejamiento de carreras** (16 carreras
  con vectores ideales; afinidad por coseno + proximidad euclidiana).
- **Asesor IA** (informe diagnóstico) y **Tutor IA** conversacional, mediante un
  proveedor compatible con la API de OpenAI (con respaldo heurístico si no hay
  IA configurada).
- **Base de conocimiento (RAG)**: el personal sube libros, investigaciones
  científicas y artículos; el contenido se fragmenta y se indexa con embeddings
  en Neon `pgvector` para fundamentar las respuestas del Tutor IA con citas.
- **Códigos QR por grupo/cohorte**: al crear un nuevo grupo de encuesta se genera
  un código QR que lleva al formulario del test vocacional asignado a ese grupo
  (`/g/{CODIGO}`), listo para compartir o imprimir.
- **Panel de administración**: auditoría de evaluaciones (búsqueda y filtro por
  cohorte), gestión de cohortes con su QR, dictamen del revisor y directorio de
  usuarios.

## Autenticación y autorización (importante)

La app Android **no tiene OAuth real**: siembra usuarios y permite cambiar de rol.
La versión web replica ese comportamiento con un **selector de usuario/rol** a
partir de los usuarios semilla (`DEFAULT_USERS`). **No hay OAuth ni inicio de
sesión real todavía** (fuera de alcance de esta migración).

### Barrera de personal (`STAFF_ACCESS_TOKEN`)

Como barrera mínima para las **mutaciones de personal** (crear cohortes, subir
documentos a la base de conocimiento, guardar la configuración de IA y firmar el
dictamen del revisor) la app usa un **token de personal**:

- Si defines la variable de entorno `STAFF_ACCESS_TOKEN` en el servidor, **todas**
  esas operaciones exigen presentar el mismo token. La UI de administración
  muestra un campo para introducirlo (se guarda solo en `sessionStorage` de la
  pestaña) y lo reenvía en cada mutación (como argumento en las server actions y
  en la cabecera `x-staff-token` para las rutas). El token se compara **solo en el
  servidor** y nunca llega al navegador ni se persiste en la base de datos.
- Si **no** defines `STAFF_ACCESS_TOKEN`, la app corre en **modo demo** y esas
  operaciones quedan abiertas (comportamiento de demostración). El build no
  requiere la variable, por lo que `next build` funciona sin ella.

Esto **no** sustituye a una autenticación real. Antes de exponer el panel de
administración públicamente, protégelo con autenticación real (p. ej. Vercel
Authentication, un proveedor OAuth o middleware propio) y define
`STAFF_ACCESS_TOKEN` para cerrar las mutaciones de personal.

### API key de IA en reposo (nota de seguridad)

Cuando la configuración de IA se guarda desde **Ajustes de IA**, la API key se
almacena **en claro** en la tabla `ai_config` de Neon (sin cifrado en reposo).
Para producción, prefiere configurar la clave mediante la variable de entorno
`AI_API_KEY`: tiene prioridad sobre la fila de `ai_config` y evita dejar la clave
persistida en la base de datos. Si usas la tabla `ai_config`, restringe el acceso
a la base y considera cifrado a nivel de columna o un gestor de secretos.

## Requisitos

- **Node.js 22** y **npm**.
- Una base de datos **Neon** (Postgres serverless) con la extensión `pgvector`
  (solo necesaria en tiempo de ejecución; el build no requiere base de datos).
- Opcional: un proveedor de IA compatible con OpenAI con capacidad de
  **embeddings** (dimensión **1536**) para la base de conocimiento (RAG).

## Desarrollo local

```bash
cd web
npm install
npm run dev
```

La app queda disponible en http://localhost:3000.

Scripts disponibles:

| Script              | Descripción                                             |
| ------------------- | ------------------------------------------------------- |
| `npm run dev`       | Servidor de desarrollo Next.js.                         |
| `npm run build`     | Build de producción (`next build`).                     |
| `npm start`         | Sirve el build de producción.                           |
| `npm run lint`      | ESLint (`next lint`).                                    |
| `npm run typecheck` | Chequeo de tipos (`tsc --noEmit`).                       |
| `npm test`          | Tests unitarios del motor psicométrico (Vitest).        |
| `npm run db:seed`   | Aplica el esquema y siembra cohortes/usuarios en Neon.  |

> El build y los tests **no** requieren base de datos ni claves de IA: todo el
> acceso a Neon y a la IA es **perezoso** (las variables solo se leen al ejecutar
> una consulta real). `next build` funciona sin ninguna variable de entorno.

## Variables de entorno

Copia `web/.env.example` a `web/.env.local` y completa los valores. **Nunca
subas `.env.local` ni claves reales.**

| Variable              | Requerida | Descripción                                                                                                                                                            |
| --------------------- | --------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `DATABASE_URL`        | Sí (runtime) | Cadena de conexión de Neon Postgres, p. ej. `postgres://usuario:password@host.neon.tech/orientapp?sslmode=require`. Se lee de forma perezosa; el build funciona sin ella. |
| `NEXT_PUBLIC_APP_URL` | No        | URL base pública para construir los enlaces de los QR de cada cohorte (p. ej. `https://tu-app.vercel.app`). Si no se define, se usa el origin de la petición/navegador.  |
| `STAFF_ACCESS_TOKEN`  | No (recom. en prod) | Token que exige la app para las mutaciones de personal (crear cohortes, subir documentos, guardar ajustes de IA, firmar dictámenes). Si se define, esas operaciones lo requieren; si no, quedan abiertas (modo demo). Solo se usa en el servidor. |
| `AI_PROVIDER_TYPE`    | No        | Proveedor de IA: `NVIDIA_NIM` \| `OPENAI` \| `LOCAL_AI` \| `CUSTOM`. Por defecto `NVIDIA_NIM`.                                                                            |
| `AI_BASE_URL`         | No        | URL base del endpoint compatible con OpenAI (p. ej. `https://api.openai.com/v1`).                                                                                        |
| `AI_API_KEY`          | No        | Clave del proveedor de IA. **Solo se usa en el servidor; nunca llega al navegador.**                                                                                     |
| `AI_MODEL`            | No        | Modelo de chat para el Asesor y el Tutor (p. ej. `gpt-4o-mini`).                                                                                                         |
| `AI_EMBEDDING_MODEL`  | No        | Modelo de embeddings para la base de conocimiento (RAG). **Debe producir vectores de dimensión 1536** para coincidir con `vector(1536)` del esquema (p. ej. `text-embedding-3-small`). |
| `AI_TEMPERATURE`      | No        | Temperatura de generación (por defecto `0.7`).                                                                                                                          |
| `AI_MAX_TOKENS`       | No        | Máximo de tokens de respuesta (por defecto `1024`).                                                                                                                     |

Las variables `AI_*` también pueden configurarse en tiempo de ejecución desde
**Ajustes de IA** (tabla `ai_config`). Sin configuración de IA la app compila y
funciona: el Asesor usa el análisis heurístico de respaldo, el Tutor IA queda
deshabilitado y la base de conocimiento se guarda **sin embeddings** (sin
recuperación semántica).

## Provisionar Neon + habilitar pgvector

1. Crea un proyecto en [Neon](https://neon.tech) y una base de datos.
2. Copia la **connection string** (con `?sslmode=require`) a `DATABASE_URL`.
3. Habilita `pgvector`. El esquema ya incluye
   `CREATE EXTENSION IF NOT EXISTS vector;`, así que se activa al aplicar el
   esquema. También puedes habilitarlo manualmente en el SQL Editor de Neon:

   ```sql
   CREATE EXTENSION IF NOT EXISTS vector;
   ```

### Aplicar el esquema `web/db/schema.sql`

El archivo `web/db/schema.sql` es la **fuente de verdad** del esquema (sesiones y
respuestas de evaluación, `ai_config`, cohortes, usuarios y las tablas de la base
de conocimiento `knowledge_documents` / `knowledge_chunks` con `vector(1536)`).

Tienes dos opciones:

- **Con el script de seed** (recomendado): aplica el esquema y siembra los datos
  base en un solo paso (ver más abajo).
- **Manualmente**: pega el contenido de `web/db/schema.sql` en el **SQL Editor**
  de Neon y ejecútalo, o usa `psql`:

  ```bash
  psql "$DATABASE_URL" -f web/db/schema.sql
  ```

Todas las sentencias usan `IF NOT EXISTS`, por lo que aplicar el esquema es
idempotente.

### Sembrar la base de datos

El script `web/scripts/seed.ts` aplica el esquema (idempotente) e inserta las
cohortes y usuarios por defecto de `web/data/seed.ts`.

```bash
cd web
# Asegúrate de tener DATABASE_URL en web/.env.local (o en el entorno)
npm run db:seed
```

- Lee `DATABASE_URL` **en tiempo de ejecución**. Si no está definida, muestra un
  mensaje claro en español y **sale sin tocar la base de datos** (nunca corre
  durante el build).
- Carga automáticamente `web/.env.local` si existe.
- Las inserciones usan `ON CONFLICT DO NOTHING`, así que ejecutarlo varias veces
  no duplica cohortes ni usuarios.

## Despliegue en Vercel

1. Sube este repositorio a GitHub/GitLab e **importa el proyecto** en
   [Vercel](https://vercel.com/new).
2. En la configuración del proyecto, establece el **Root Directory** en `web`.
   Vercel detecta Next.js automáticamente (el `web/vercel.json` fija el framework
   y los comandos de build/install).
3. Añade las **variables de entorno** en *Project Settings → Environment
   Variables*:
   - `DATABASE_URL` (obligatoria en runtime).
   - `NEXT_PUBLIC_APP_URL` con el dominio de producción (p. ej.
     `https://tu-app.vercel.app`) para que los QR apunten al dominio correcto y
     no a `localhost`.
   - Las variables `AI_*` si vas a usar el Asesor/Tutor IA y la base de
     conocimiento.
4. Haz clic en **Deploy**.
5. Después del primer despliegue, aplica el esquema y siembra la base
   (una sola vez) apuntando `DATABASE_URL` a tu base Neon de producción:

   ```bash
   cd web
   DATABASE_URL="postgres://...neon.tech/...?sslmode=require" npm run db:seed
   ```

### Notas de runtime

- Las rutas que acceden a la base de datos o a la IA (`app/api/ai/*`,
  `app/api/knowledge`, `app/api/sessions/*`, `app/admin/*`,
  `app/results/[sessionId]`) declaran `export const runtime = "nodejs"` y
  `export const dynamic = "force-dynamic"`. Esto garantiza que se ejecuten en el
  runtime de Node.js (necesario para el driver serverless de Neon y las llamadas
  de embeddings) y que **no** se rendericen en el build (sin acceso a la base de
  datos durante `next build`).

## Estructura

```
web/
├── app/          # Rutas del App Router (páginas y route handlers)
├── components/   # Componentes de UI (incluye QrCode)
├── data/         # Contenido semilla (preguntas, carreras, cohortes, usuarios)
├── db/           # schema.sql: esquema autoritativo de Neon (+ pgvector)
├── lib/          # Dominio RIASEC, cliente Neon (lazy), IA y base de conocimiento
├── scripts/      # seed.ts: aplica el esquema y siembra la base
└── tests/        # Tests unitarios del motor psicométrico (Vitest)
```

## Verificación

Desde `web/`:

```bash
npm run typecheck
npm run lint
npm run test -- --run
npm run build
```
