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

## Métodos vocacionales seleccionables

La app soporta **varios instrumentos vocacionales** detrás de un **registro de
métodos** común (`web/lib/methods/`). **RIASEC** sigue siendo el método **por
defecto** y su comportamiento, puntajes y vista de resultados no cambian.

| Método     | Ítems | Escala de respuesta                                      | Puntuación                                                                                   | Interpretación                                                                 |
| ---------- | :---: | -------------------------------------------------------- | -------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| **RIASEC** |  60   | Likert-5 (1 = Nada … 5 = Mucho)                          | Puntaje 0–100 por dimensión (R, I, A, S, E, C); calidad por pares espejo/tiempos.            | Código dominante + radar + emparejamiento de 16 carreras + informe IA.         |
| **CHASIDE**|  98   | Dicotómica: **Sí** (1) / **No** (0)                      | Conteo de "Sí" por área (7 áreas C, H, A, S, I, D, E), separando **Interés** (máx. 10) y **Aptitud** (máx. 4). | Dos áreas de mayor interés + alineación **Interés-vs-Aptitud**.                |
| **TIPOV**  |  66   | Likert-3: **Me agrada** (3) / **Me es indiferente** (2) / **Me desagrada** (1) | Suma cruda por dimensión (13 dimensiones de interés) y valor normalizado 0–100.              | Dimensiones de interés dominantes.                                             |
| **CIP-R**  |  114  | Opción única: **Agrado** (2) / **Indiferencia** (1) / **Desagrado** (0)        | Suma cruda por escala (agregación sobre 15 escalas primarias de interés) y valor normalizado 0–100. | Escalas de interés dominantes + barras por dimensión.                          |

> Los bancos de ítems de CHASIDE, TIPOV y CIP-R son **adaptaciones originales y
> fieles** a la estructura y puntuación descritas en la documentación de cada
> método (los documentos aportan la estructura/calificación, no la redacción
> textual).

### Cómo se elige el método

- **Por el usuario**, al iniciar la evaluación: en `/assessment` hay un selector
  de método (RIASEC por defecto). El cuestionario se renderiza dinámicamente con
  los ítems y la **escala de respuesta** del método elegido (Likert-5, Likert-3
  o Sí/No).
- **Por el grupo/cohorte**, cuando el personal **asigna un método** al crear la
  cohorte. El código QR (`/g/{CODIGO}`) redirige a
  `/assessment?cohort=CODIGO&method=METODO`, de modo que el enlace lleva directo
  al test asignado a ese grupo. Cuando la cohorte fija un método, el selector
  aparece **bloqueado** con una nota en español. Si el método asignado es RIASEC
  (por defecto), la URL **omite** el parámetro `method` para mantener los enlaces
  idénticos a los previos.

### Persistencia y resultados por método

- `assessment_sessions` guarda `method_id` (**RIASEC** por defecto para filas
  antiguas) y `method_scores` (**JSONB** con los puntajes por dimensión, los
  códigos dominantes y la interpretación). Para RIASEC se siguen escribiendo las
  columnas `r/i/a/s/e/c`, `dominant_code` y `dominant_summary` como siempre; para
  CHASIDE/TIPOV/CIP-R esas columnas quedan en `0` y los puntajes reales viven en
  `method_scores`.
- `cohort_groups` guarda `method_id` (el método asignado al grupo).
- Ambas columnas se agregan con migraciones **idempotentes**
  (`ADD COLUMN IF NOT EXISTS`), por lo que aplicar el esquema es seguro sobre
  bases existentes.
- La **vista de resultados** (`/results/{id}`) ramifica por `method_id`: RIASEC
  conserva el radar + 6 barras + ranking de carreras + informe IA; CHASIDE y
  TIPOV muestran una vista genérica en español (barras por dimensión, áreas
  dominantes e interpretación; CHASIDE incluye la comparación
  **Interés-vs-Aptitud**). La **autorización de lectura por propiedad de sesión**
  se aplica igual para todos los métodos (un estudiante solo ve sus propias
  sesiones, sea cual sea el método).

### Instrumentos interactivos vs. material de referencia

De los métodos descritos en la documentación subida (`skills/knowledge/`), no
todos se prestan a un **cuestionario autoaplicado de un solo puntaje**. Por eso,
en esta etapa se implementaron como **instrumentos interactivos y
autocalificables** solo aquellos que definen ítems y una regla de puntuación
clara; el resto queda como **material de referencia** para la base de
conocimiento.

**Implementados como instrumentos interactivos** (se pueden tomar en
`/assessment`, con puntaje y resultados en la app):

- **RIASEC / Holland** (ya existente, método por defecto).
- **CHASIDE** (`skills/knowledge/metodo-chaside.md`).
- **TIPOV** (`skills/knowledge/test-tipov.md`).
- **CIP-R** (`skills/knowledge/cuestionario-cip-r.md`).

**De referencia / base de conocimiento** (no implementados como tests
interactivos en esta etapa), con el motivo:

- **Test Magdalena Contreras / Lizarazo**
  (`skills/knowledge/test-magdalena-contreras.md`): es un cuestionario
  autoaplicado **implementable**, pero **no incluido en esta etapa** (posible
  trabajo futuro).
- **Instrumento de Autoorientación**
  (`skills/knowledge/instrumento-autoorientacion.md`): es un **marco compuesto /
  triangular** (CIP II + DAT + IHE), no un cuestionario de un solo puntaje
  autoaplicado.
- **Enfoque adleriano de Jaime Bernstein**
  (`skills/knowledge/jaime-bernstein-adleriano.md`): es un **marco
  teórico/clínico/proyectivo**, no un cuestionario de ítems autocalificable.
- **Otros inventarios clásicos Strong y Kuder**
  (`skills/knowledge/otros-inventarios-kuder-strong.md`): se conservan como
  **contexto histórico / de referencia**.

> **Seguimiento (follow-up):** ingerir estos documentos de referencia en la
> **base de conocimiento (RAG)** con `pgvector` es una tarea **documentada
> aparte** de la experiencia de test por método seleccionable. Así el Tutor IA
> podrá citar estos marcos aunque no existan como tests interactivos.

## Autenticación y autorización (importante)

La app usa **Google OAuth** mediante **Auth.js / NextAuth v5** como inicio de
sesión real y **puerta de autorización principal**. Cuando la autenticación está
configurada, la sesión del usuario y su **rol** son la única barrera para las
mutaciones de personal: crear cohortes, subir documentos a la base de
conocimiento, guardar la configuración de IA y firmar el dictamen del revisor.

> **Seguridad del build:** el build **no necesita ningún secreto**. Las variables
> `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` y `AUTH_SECRET` se leen en tiempo de
> ejecución, por lo que `next build` y `npm run typecheck` funcionan sin ellas.
> Si no están las tres definidas, la app reporta "auth no configurado" (modo
> demo) y sigue funcionando.

### Asignación de roles

Al iniciar sesión con Google, el rol del usuario se resuelve a partir de su
correo, en este orden (gana el rol **más privilegiado**):

1. **Usuario semilla**: si el correo coincide con uno de `web/data/seed.ts`
   (`DEFAULT_USERS`), se usa el rol de ese usuario.
2. **Listas de permitidos por entorno** (correos separados por coma y/o
   espacios, sin distinguir mayúsculas):
   - `ADMIN_EMAILS` → **SUPER_ADMIN** (admin principal)
   - `TEST_ADMIN_EMAILS` → **TEST_ADMIN** (coordinador de evaluaciones)
   - `REPORT_REVIEWER_EMAILS` → **REPORT_REVIEWER** (revisor / orientador)
3. **Por defecto**: **STUDENT** (estudiante).

> **¿Cómo hago administrador a alguien?** Añade su correo de Google a
> `ADMIN_EMAILS` (en `web/.env.local` para local, o en *Vercel → Project
> Settings → Environment Variables* para producción) y pídele que **cierre e
> inicie sesión de nuevo**. El rol se calcula al iniciar sesión.

> **El rol se resuelve una sola vez al iniciar sesión.** Auth.js calcula el rol
> en el callback `jwt` en el primer inicio de sesión y lo guarda en el token JWT.
> Por eso, cualquier cambio de rol o de las listas de permitidos (`ADMIN_EMAILS`,
> `TEST_ADMIN_EMAILS`, `REPORT_REVIEWER_EMAILS`) **no surte efecto** hasta que el
> usuario **cierra sesión y vuelve a iniciar sesión**. Con la estrategia JWT no
> hay sesión en el servidor que revocar, así que no es posible refrescar el rol
> en caliente.

### Configurar Google Cloud (credenciales OAuth 2.0)

1. Entra a [Google Cloud Console](https://console.cloud.google.com/) y crea (o
   selecciona) un proyecto.
2. Configura la **pantalla de consentimiento de OAuth** (*APIs & Services →
   OAuth consent screen*): tipo **External**, nombre de la app, correo de
   soporte y datos de contacto. Mientras esté en modo *Testing*, agrega como
   *Test users* los correos que vayan a iniciar sesión.
3. Crea las credenciales (*APIs & Services → Credentials → Create Credentials →
   OAuth client ID*): tipo de aplicación **Aplicación web** (*Web application*).
4. En **URIs de redirección autorizados** (*Authorized redirect URIs*) agrega:
   - Local: `http://localhost:3000/api/auth/callback/google`
   - Producción: `https://<tu-app>.vercel.app/api/auth/callback/google`
5. Guarda y copia el **Client ID** y el **Client Secret**.

### Variables de entorno para OAuth

En **local** (`web/.env.local`):

```bash
GOOGLE_CLIENT_ID=tu-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=tu-client-secret
AUTH_SECRET=<genera-uno: openssl rand -base64 32>
# ADMIN_EMAILS, TEST_ADMIN_EMAILS, REPORT_REVIEWER_EMAILS son opcionales.
ADMIN_EMAILS=director@tu-institucion.edu
```

En **Vercel** (*Project Settings → Environment Variables*): define las mismas
`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `AUTH_SECRET` y, si las usas, las
listas `*_EMAILS`. Auth.js v5 **infiere la URL automáticamente en Vercel**, así
que no necesitas `AUTH_URL`. En otros hosts (dominios propios o proxys) define
`AUTH_URL` (o el equivalente `NEXTAUTH_URL`) con la URL pública de la app.

### `STAFF_ACCESS_TOKEN` (fallback opcional, superado por OAuth)

El antiguo token de personal se conserva **solo como fallback local/demo** y
únicamente tiene efecto cuando **Google OAuth no está configurado**:

- **Sin OAuth y con `STAFF_ACCESS_TOKEN` definido**: las mutaciones de personal
  exigen presentar ese token (comportamiento heredado). La UI de administración
  muestra un campo para introducirlo (se guarda solo en `sessionStorage`) y lo
  reenvía como argumento en las server actions y en la cabecera `x-staff-token`
  para las rutas. El token se compara **solo en el servidor**.
- **Sin OAuth y sin `STAFF_ACCESS_TOKEN`**: la app corre en **modo demo** y esas
  operaciones quedan abiertas (útil para desarrollo/demostración).
- **Con OAuth configurado**: el token queda **inactivo**; la autorización es
  exclusivamente por sesión + rol de Google.

### Matriz de roles y permisos

La autorización se aplica en el **servidor** tanto para las **lecturas** como
para las **mutaciones**. Con Google OAuth configurado, cada acción exige el rol
adecuado; las lecturas de resultados de un estudiante están además restringidas
por **propiedad de la sesión** (ver más abajo). Los roles de personal (staff)
son **REPORT_REVIEWER**, **TEST_ADMIN** y **SUPER_ADMIN**.

Leyenda: ✅ permitido · ⛔ denegado · 🔒 solo si es el dueño de la sesión.

| Acción / endpoint                                                      | STUDENT | REPORT_REVIEWER | TEST_ADMIN | SUPER_ADMIN |
| ---------------------------------------------------------------------- | :-----: | :-------------: | :--------: | :---------: |
| Tomar el test / entrar por `/g/{codigo}`                               |   ✅    |       ✅        |     ✅     |     ✅      |
| Ver **resultados propios** (`/results/{id}`)                           |   🔒    |       ✅        |     ✅     |     ✅      |
| Ver **resultados de otros** (`/results/{id}`)                          |   ⛔    |       ✅        |     ✅     |     ✅      |
| Informe IA y Tutor IA **sobre una sesión** (`/api/ai/report`, `/api/ai/chat`) | 🔒 |    ✅        |     ✅     |     ✅      |
| Chat general del Tutor IA **sin sesión** (sin `sessionId`)             |   ✅    |       ✅        |     ✅     |     ✅      |
| Listar documentos de conocimiento (`GET /api/knowledge`)              |   ⛔    |       ✅        |     ✅     |     ✅      |
| Subir documentos de conocimiento (`POST /api/knowledge`)             |   ⛔    |       ✅        |     ✅     |     ✅      |
| Panel `/admin` (evaluaciones, cohortes, usuarios)                     |   ⛔    |       ✅        |     ✅     |     ✅      |
| Dictamen del revisor (`PATCH /api/sessions/{id}/review`)             |   ⛔    |       ✅        |     ⛔     |     ✅      |
| Crear cohortes / guardar configuración de IA                          |   ⛔    |       ⛔        |     ✅     |     ✅      |

> El dictamen del revisor lo firman **REPORT_REVIEWER** y **SUPER_ADMIN**; crear
> cohortes y guardar la configuración de IA los hacen **TEST_ADMIN** y
> **SUPER_ADMIN**. Un usuario anónimo (sin iniciar sesión, con OAuth activo)
> solo puede **tomar el test**; cualquier lectura o mutación de personal se
> rechaza con **403** y un mensaje en español.

### Propiedad de la sesión del estudiante

Un **STUDENT** solo puede leer los resultados y usar la IA sobre **sus propias
sesiones**. La propiedad se determina y se aplica así:

- **Al crear la sesión** (`POST /api/sessions`) la **clave de propiedad**
  (`student_email`) se fija según quién crea la sesión:
  - **STUDENT autenticado**: se usa **siempre** su **correo autenticado**,
    **ignorando** el `studentEmail` del cliente. Así un estudiante **no puede
    suplantar** la propiedad de otra persona (no falsificable).
  - **Personal (staff) autenticado**: puede administrar el test **por cuenta de
    un estudiante** (proctoring), por lo que se **respeta** el `studentEmail`
    enviado por el cliente para asignar al **verdadero dueño**. Si no envía
    ninguno, la sesión queda **sin dueño** (`null`) y solo la lee el personal.
  - **Anónimo / demo** (sin OAuth): se usa el `studentEmail` que envía el
    cliente, como antes.
  - El nombre para mostrar (`studentName`) siempre puede venir del cliente.
- **Al leer** (`/results/{id}`, `/api/ai/report`, `/api/ai/chat`): un STUDENT
  puede leer **solo** las sesiones cuyo `student_email` **coincida** con su
  correo autenticado (**sin distinguir mayúsculas/minúsculas**). El personal
  (staff) puede leer **cualquier** sesión.
- Las sesiones con `student_email` **nulo o vacío** son **solo para personal**
  (ningún estudiante las puede leer).
- Cuando un STUDENT que no es dueño intenta abrir `/results/{id}`, la página
  muestra el componente **`AccessRestricted`** con un mensaje **específico de
  propiedad** ("No tienes permisos para ver los resultados de esta evaluación."),
  no el texto genérico del área de administración; las rutas de IA devuelven
  **403**.

### Modo demo / autenticación no configurada

Cuando **Google OAuth no está configurado** (`isAuthConfigured() === false`, es
decir, faltan una o más de `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` o
`AUTH_SECRET`):

- El proveedor de OAuth queda **inactivo** y **las lecturas quedan abiertas**:
  `/results/{id}`, `GET /api/knowledge`, el informe y el tutor IA sobre una
  sesión funcionan sin restricción de propiedad ni de rol. Esto es
  **intencional** para que `next build` sin variables de entorno y las
  demostraciones locales sigan funcionando.
- Las **mutaciones** de personal siguen protegidas por el fallback heredado
  `STAFF_ACCESS_TOKEN` (ver arriba): si está definido se exige el token; si no,
  quedan abiertas (demo).
- Este comportamiento abierto es una **degradación deliberada para
  demo/desarrollo**, **no** la postura de producción. En producción, define las
  tres variables de OAuth para que la matriz de roles y la propiedad de sesión se
  apliquen de verdad.

### Cambio de comportamiento (lecturas ahora protegidas)

A diferencia de versiones anteriores, con OAuth configurado las **lecturas** ya
**no** están abiertas: `GET /api/knowledge` es **solo para personal** y
`/results/{id}` exige ser **dueño de la sesión** o **personal**. Antes ambas
eran de acceso libre. En modo demo (sin OAuth) se conserva el acceso abierto
descrito arriba.

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
| `npm run knowledge:ingest` | Ingiere los documentos `skills/knowledge/*.md` en la base de conocimiento (RAG). |

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
| `GOOGLE_CLIENT_ID`    | No (runtime; recom.) | ID de cliente OAuth 2.0 de Google. Junto con `GOOGLE_CLIENT_SECRET` y `AUTH_SECRET` activa el inicio de sesión con Google. Se lee en runtime; el build no la requiere. |
| `GOOGLE_CLIENT_SECRET`| No (runtime; recom.) | Secreto de cliente OAuth 2.0 de Google. **Solo se usa en el servidor.** |
| `AUTH_SECRET`         | No (runtime; recom.) | Secreto para firmar la sesión JWT de Auth.js (genera uno con `openssl rand -base64 32`). Necesario (con las dos anteriores) para activar OAuth. |
| `AUTH_URL` / `NEXTAUTH_URL` | No  | URL pública de la app para los callbacks de OAuth. En Vercel se infiere automáticamente; defínela solo en otros hosts/dominios propios. |
| `ADMIN_EMAILS`        | No        | Correos (separados por coma/espacios) que reciben el rol **SUPER_ADMIN** al iniciar sesión con Google. |
| `TEST_ADMIN_EMAILS`   | No        | Correos que reciben el rol **TEST_ADMIN**. |
| `REPORT_REVIEWER_EMAILS` | No     | Correos que reciben el rol **REPORT_REVIEWER**. |
| `STAFF_ACCESS_TOKEN`  | No (fallback) | **Fallback local/demo superado por Google OAuth.** Solo tiene efecto cuando OAuth **no** está configurado: si se define, las mutaciones de personal exigen el token; si no, quedan abiertas (modo demo). Con OAuth configurado queda inactivo. Solo se usa en el servidor. |
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

### Ingerir la base de conocimiento (RAG)

El script `web/scripts/ingest-knowledge.ts` ingiere los documentos fuente de
`skills/knowledge/*.md` (un nivel por encima de `web/`) en la base de
conocimiento (`knowledge_documents` / `knowledge_chunks`) reutilizando el
pipeline existente `ingestDocument()`.

```bash
cd web
# Requiere DATABASE_URL en web/.env.local (o en el entorno).
# Para embeddings semánticos, configura además AI_API_KEY / AI_BASE_URL.
npm run knowledge:ingest
```

- **Requiere `DATABASE_URL`.** Se lee **en tiempo de ejecución**; si no está
  definida, muestra un mensaje claro en español y **sale sin tocar la base de
  datos ni la red** (nunca corre durante el build).
- **Embeddings:** si la IA está configurada (`AI_API_KEY` / `AI_BASE_URL`, con un
  modelo de embeddings de dimensión 1536), cada fragmento se guarda con su
  embedding. Si la IA **no** está configurada, los fragmentos se guardan con
  `embedding NULL`: quedan almacenados pero **no** son recuperables por
  similitud hasta configurar la IA y **reindexar** (basta volver a ejecutar
  `npm run knowledge:ingest`).
- **Idempotente:** es seguro reejecutarlo. Cada documento se identifica por un
  `source_key` (slug estable derivado del nombre de archivo); antes de reinsertar
  se borra el documento previo con ese `source_key` (sus fragmentos se eliminan
  en cascada), de modo que reejecutar **no duplica** documentos.
- **Solo `.md`:** únicamente se ingieren los documentos markdown. El PDF de
  `skills/knowledge/` (`Diseño de un instrumento de orientación vocacional.pdf`)
  **no** se ingiere en este paso; el script lo informa por consola.
- Carga automáticamente `web/.env.local` si existe y aplica el esquema
  (idempotente) antes de ingerir, de modo que la columna `source_key` exista.

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
   - `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` y `AUTH_SECRET` para habilitar el
     inicio de sesión con Google (ver *Autenticación y autorización*). En Vercel
     no hace falta `AUTH_URL` (se infiere). Opcionalmente `ADMIN_EMAILS`,
     `TEST_ADMIN_EMAILS` y `REPORT_REVIEWER_EMAILS` para asignar roles por correo.
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
└── tests/        # Tests unitarios (motor psicométrico, IA, RAG, roles/auth)
```

## Verificación

Desde `web/`:

```bash
npm run typecheck
npm run lint
npm run test -- --run
npm run build
```
