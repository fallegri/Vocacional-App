# OrientApp

Aplicacion de **diagnostico vocacional determinista**. Este repositorio contiene
dos versiones:

- **`app/`** - Aplicacion **Android** nativa original (Kotlin / Jetpack Compose /
  Room). Se conserva intacta como referencia.
- **`web/`** - Aplicacion **web** desplegable en **Vercel + Neon** (Postgres
  serverless). Esta es la version activa.

## Nota de rediseno de arquitectura

La version web fue rediseniada en 2024-2025 con los siguientes cambios:

- **Se elimino:** el Tutor IA, el Asesor IA, la base de conocimiento RAG,
  pgvector, y la autenticacion con Google OAuth.
- **Se agrego:** 4 nuevos motores de evaluacion vocacional deterministas
  (CHASIDE, TIPOV, CIP-R, Test Magdalena Contreras), autenticacion
  email + contrasena con verificacion via Resend, modelo de roles basado en
  base de datos (Admin / Tester / Profesor / Revisor / Estudiante), y flujo
  anonimo para estudiantes de grupo via codigo QR.
- **El analisis vocacional es 100% determinista:** los resultados se calculan
  mediante algoritmos puros definidos en `web/lib/methods/`. No se usa ningun
  LLM ni servicio externo de IA.

## ?Que version usar?

Para desarrollar, ejecutar o desplegar la aplicacion web, consulta
[`web/README.md`](web/README.md). Ahi encontraras:

- Como correr la app en local.
- La lista completa de variables de entorno.
- Como provisionar Neon y aplicar el esquema.
- Como sembrar el admin inicial (`npm run db:seed`).
- Los pasos de despliegue en Vercel.

## Metodos vocacionales incluidos

| Metodo | Descripcion |
|---|---|
| **RIASEC** (Holland) | Motor original de 6 dimensiones, 60 preguntas, gráfico radar y matching de 16 carreras |
| **CHASIDE** | 7 areas, 98 items dicotomicos, comparacion Interes vs. Aptitud |
| **TIPOV** | 13 dimensiones de interes, 66 items Likert-3 |
| **CIP-R** | 15 escalas primarias, 114 items de agrado/indiferencia/desagrado |
| **Test Magdalena Contreras** | 10 campos de trabajo, 120 items con doble escala (Interes + Aptitud) |

## Documentacion tecnica

El documento de diseno original esta en [`SDD_ORIENTAPP_V2.md`](SDD_ORIENTAPP_V2.md).
Ten en cuenta que refleja el diseno anterior (con Google OAuth y Tutor IA).
La arquitectura actual se describe en [`web/README.md`](web/README.md).

La bibliografia de los metodos vocacionales esta en `skills/knowledge/*.md`.
