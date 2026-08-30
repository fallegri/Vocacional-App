# OrientApp Web

Aplicación web de **diagnóstico vocacional determinista** basada en 5 instrumentos
psicométricos. Migrada desde la app Android nativa OrientApp (Kotlin / Jetpack
Compose) a **Next.js 15 (App Router) + TypeScript**, desplegable en **Vercel** con
**Neon** (Postgres serverless).

> **Rediseno de arquitectura:** En la version actual se eliminaron el Tutor IA,
> el Asesor IA, la base de conocimiento (RAG / pgvector) y la autenticacion con
> Google OAuth. El analisis vocacional es completamente determinista (motores
> puros sin LLM) y la autenticacion es email + contrasena con verificacion via
> Resend.

---

## Metodos vocacionales

La app soporta 5 instrumentos. **RIASEC** es el metodo por defecto.

| Metodo | Items | Escala | Interpretacion |
|---|:---:|---|---|
| **RIASEC** (Holland) | 60 | Likert 1-5 | Codigo dominante + radar + 16 carreras |
| **CHASIDE** | 98 | Dicotomica Si/No | 7 areas (C, H, A, S, I, D, E) separando Interes y Aptitud |
| **TIPOV** | 66 | Likert 3 puntos | 13 dimensiones de interes |
| **CIP-R** | 114 | Agrado / Indiferencia / Desagrado | 15 escalas primarias de interes |
| **Test Magdalena Contreras** | 120 | Escala 0-4 (doble cuestionario) | 10 campos de trabajo: Interes y Aptitud por separado |

Todos los resultados se calculan mediante algoritmos deterministas definidos en
`web/lib/methods/`. No se usa ningun LLM ni modelo externo de IA.

---

## Autenticacion y roles

### Flujo de registro / inicio de sesion

1. El usuario se **registra** en `/register` (nombre, correo, contrasena).
2. Recibe un **correo de verificacion** (via Resend) con un enlace a `/verify?token=...`.
3. Tras verificar, puede **iniciar sesion** en `/login`.
4. El **administrador principal (SUPER_ADMIN)** asigna roles a los usuarios
   desde el panel de administracion (pestana "Usuarios").

### Modelo de roles

| Rol | Titulo | Descripcion |
|---|---|---|
| `SUPER_ADMIN` | Admin Principal | Acceso total; asigna roles, crea grupos, audita todo |
| `TEST_ADMIN` | Admin de Test | Crea grupos y coordina evaluaciones |
| `PROFESOR` | Profesor | Puede revisar resultados de los estudiantes de sus grupos |
| `REPORT_REVIEWER` | Revisor de Reportes | Firma dictamenes pedagogicos |
| `STUDENT` | Estudiante | Toma tests y consulta sus propios resultados |

El rol por defecto al registrarse es **STUDENT**. El administrador puede elevar
el rol desde la pestana "Usuarios" del panel.

### Estudiantes de grupo (anonimos)

Los estudiantes que acceden por un **codigo QR de grupo** (`/g/{CODIGO}`) solo
necesitan ingresar su **correo electronico** en el formulario. No crean cuenta, no
tienen contrasena y no necesitan verificacion. El correo se usa unicamente para
enviar los resultados y para identificar la sesion.

- Los **individuos y el personal** se registran con email + contrasena.
- Los **estudiantes de grupo** son anonimos (correo solamente, sin cuenta).

### Administrador inicial

Al ejecutar `npm run db:seed` se crea el administrador inicial en la base de datos:

- **Correo:** `admin@orientapp.local`
- **Contrasena por defecto:** `OrientApp!Admin2026`

> **IMPORTANTE:** Cambia esta contrasena inmediatamente tras el primer inicio de
> sesion. La contrasena se almacena unicamente como hash bcrypt; nunca en texto
> plano.

Puedes sobreescribir los valores por defecto con las variables de entorno
`INITIAL_ADMIN_EMAIL` e `INITIAL_ADMIN_PASSWORD` (ver `.env.example`).

---

## Grupos con QR

El concepto de "grupo" o "cohorte" permite:

1. Crear un grupo con nombre libre (p. ej. "6to A Ciencias", "Evento 1",
   "Colegio San Martin") y asignarle un metodo vocacional.
2. Se genera automaticamente un **codigo unico** (slug desde el nombre si no se
   especifica uno) y un **codigo QR**.
3. El QR apunta a `/g/{CODIGO}`, que redirige a
   `/assessment?cohort=CODIGO&method=METODO`.
4. Los estudiantes escanean el QR, ingresan su correo y toman el test asignado.

El codigo puede dejarse vacio al crear el grupo; en ese caso se genera
automaticamente a partir del nombre (hasta 16 caracteres alfanumericos en
mayusculas + sufijo aleatorio de 4 chars para evitar colisiones).

---

## Correos transaccionales (Resend)

La app envia dos tipos de correos:

| Evento | Destinatario | Contenido |
|---|---|---|
| Registro | Usuario nuevo | Enlace de verificacion de cuenta (expira en 24 h) |
| Fin del test | Estudiante | Codigo dominante, interpretacion y enlace a resultados |

**Degradacion elegante:** Si `RESEND_API_KEY` o `EMAIL_FROM` no estan definidas,
el envio queda silenciado (solo un log en consola). La app sigue funcionando con
normalidad. El correo de resultados es **best-effort**: si falla, la respuesta
HTTP `201` de la sesion no se ve afectada.

---

## Variables de entorno

Copia `web/.env.example` a `web/.env.local` y completa los valores.
**Nunca subas `.env.local` ni claves reales.**

| Variable | Obligatoria | Descripcion |
|---|:---:|---|
| `DATABASE_URL` | Runtime | Conexion Neon Postgres. El build pasa sin ella. |
| `AUTH_SECRET` | Runtime | Secreto JWT para Auth.js (genera con `openssl rand -base64 32`). Sin el, la app corre en "modo demo". |
| `NEXT_PUBLIC_APP_URL` | No | URL publica de la app para construir enlaces de QR, verificacion y resultados. Si no se define se usa el origin de la peticion. |
| `RESEND_API_KEY` | No | Clave de la API de Resend para envio de correos. Sin ella, los correos se omiten (skipped) sin errores. |
| `EMAIL_FROM` | No | Direccion remitente, p. ej. `OrientApp <noreply@tudominio.com>`. Debe coincidir con un dominio verificado en Resend. |
| `INITIAL_ADMIN_EMAIL` | No | Correo del admin inicial sembrado (por defecto `admin@orientapp.local`). |
| `INITIAL_ADMIN_PASSWORD` | No | Contrasena del admin inicial (por defecto `OrientApp!Admin2026`). Siempre se hashea con bcrypt. |
| `STAFF_ACCESS_TOKEN` | No | Fallback heredado para modo demo sin credenciales. Queda inactivo cuando `AUTH_SECRET` esta definido. |

---

## Desarrollo local

```bash
cd web
npm install
npm run dev
```

La app queda disponible en http://localhost:3000.

### Scripts disponibles

| Script | Descripcion |
|---|---|
| `npm run dev` | Servidor de desarrollo Next.js |
| `npm run build` | Build de produccion (`next build`) |
| `npm start` | Sirve el build de produccion |
| `npm run lint` | ESLint |
| `npm run typecheck` | Chequeo de tipos (`tsc --noEmit`) |
| `npm test` | Tests unitarios con Vitest |
| `npm run db:seed` | Aplica el esquema y siembra admin + cohortes en Neon |

> El build y los tests **no** requieren base de datos ni claves de correo: todo
> el acceso a Neon y a Resend es **perezoso**. `next build` funciona sin ninguna
> variable de entorno.

---

## Provisionar Neon

1. Crea un proyecto en [Neon](https://neon.tech) y una base de datos.
2. Copia la **connection string** (`?sslmode=require`) a `DATABASE_URL`.
3. Aplica el esquema y siembra el admin inicial:

```bash
cd web
DATABASE_URL="postgres://...neon.tech/...?sslmode=require" npm run db:seed
```

El script `web/db/schema.sql` es idempotente (`IF NOT EXISTS`). Ejecutarlo varias
veces no duplica datos.

---

## Despliegue en Vercel

1. Importa el repositorio en [Vercel](https://vercel.com/new).
2. **Root Directory:** `web`.
3. Variables de entorno obligatorias en runtime:
   - `DATABASE_URL`
   - `AUTH_SECRET`
   - `NEXT_PUBLIC_APP_URL`
4. Variables opcionales para correos: `RESEND_API_KEY`, `EMAIL_FROM`.
5. Variables opcionales para admin inicial: `INITIAL_ADMIN_EMAIL`,
   `INITIAL_ADMIN_PASSWORD`.

---

## Arquitectura

```
web/
  app/                  # App Router (paginas y rutas de API)
    admin/              # Panel de administracion (requiere staff)
    api/sessions/       # Endpoint principal del test (POST /api/sessions)
    assessment/         # Formulario del test vocacional
    g/[code]/           # Redireccion QR -> assessment con cohort+method
    login/ register/ verify/  # Flujo de autenticacion
    results/[sessionId]/# Resultados del diagnostico
  components/           # Componentes React de cliente
  lib/
    auth/               # Helpers de sesion, roles, usuarios, tokens, passwords
    actions/            # Server actions (auth, cohorts, users)
    email/              # Cliente Resend + constructores de mensajes
    methods/            # Motores deterministas (RIASEC, CHASIDE, TIPOV, CIPR, MAGDALENA)
    riasec/             # Motor RIASEC + tipos del dominio
    db.ts               # Cliente Neon lazy
    sessions.ts         # Persistencia de sesiones de evaluacion
    qr.ts               # Generacion de URLs de QR
  db/schema.sql         # Esquema de la base de datos (idempotente)
  scripts/seed.ts       # Script de siembra (admin + cohortes)
  tests/                # Tests unitarios Vitest
```

---

## Tests

```bash
cd web && npm run test -- --run
```

165 tests en 16 archivos. Los motores deterministas tienen 100% de cobertura de
los casos de interes/aptitud. Los tests de autenticacion, tokens, correos y
acciones de usuario usan mocks de la base de datos y de Resend.
