# OrientApp

Aplicación de diagnóstico vocacional **RIASEC** (modelo de Holland). Este
repositorio contiene dos versiones de la aplicación:

- **`app/`** — Aplicación **Android** nativa original (Kotlin / Jetpack Compose /
  Room). Se conserva intacta como referencia.
- **`web/`** — Aplicación **web** desplegable, migración de la app Android a
  **Next.js 15 (App Router) + TypeScript**, alojable en **Vercel** con **Neon**
  (Postgres serverless + `pgvector`).

## ¿Qué versión usar?

Para desarrollar, ejecutar o desplegar la aplicación web, consulta
[`web/README.md`](web/README.md). Ahí encontrarás:

- Cómo correr la app en local (`npm install`, `npm run dev`).
- La lista completa de variables de entorno.
- Cómo provisionar Neon y habilitar `pgvector`.
- Cómo aplicar el esquema (`web/db/schema.sql`) y sembrar la base
  (`npm run db:seed`).
- Los pasos de despliegue en Vercel (Root Directory = `web`).

## Novedades de la versión web

Además de portar fielmente el motor psicométrico, el test de 60 preguntas, los
resultados con radar, el emparejamiento de carreras y el asesor IA, la versión
web añade:

1. **Base de conocimiento (RAG)**: el personal puede subir libros,
   investigaciones científicas y artículos que se indexan con embeddings en Neon
   `pgvector` para fundamentar las respuestas del Tutor IA con citas.
2. **Códigos QR por grupo de encuesta**: al crear un nuevo grupo/cohorte se
   genera automáticamente un código QR que lleva al formulario del test
   vocacional asignado a ese grupo (`/g/{CODIGO}`), listo para compartir o
   imprimir.

El documento de diseño está en [`SDD_ORIENTAPP_V2.md`](SDD_ORIENTAPP_V2.md).

> Nota: la app no tiene OAuth real todavía; usa usuarios semilla y un selector de
> rol. Consulta la sección de autenticación en [`web/README.md`](web/README.md)
> antes de exponer el panel de administración públicamente.
