# Migración de datos a Neon — OrientApp
## Scripts tabla a tabla para copiar data desde una BD anterior

> **Antes de empezar:** Asegúrate de que ya ejecutaste `docs/neon-setup.sql`
> en la base Neon de destino para que las tablas existan.
>
> Los scripts de abajo se ejecutan en el **SQL Editor de Neon** de la base
> de **destino**, usando la sintaxis `INSERT ... VALUES` directa — ideal
> para copiar filas una a una o en lote desde un export CSV/JSON previo.
>
> Si tienes acceso directo a la BD de origen con `psql`, al final de este
> documento hay comandos `pg_dump` / `psql` alternativos.

---

## AUTH_SECRET (para Vercel)

```
ArGx5btgEX6hm0dphdFPPoDLLa1DbVqOzmkV+WDQ+wY=
```

Agrégalo en **Vercel → Project Settings → Environment Variables** como:
- Variable: `AUTH_SECRET`
- Value: el valor de arriba

---

## Tabla 1 — `app_users`

Usuarios del sistema (admin, staff, individuales registrados).

### Ver datos en la BD de origen:
```sql
SELECT
    id,
    email,
    display_name,
    role,
    cohort_code,
    auth_provider,
    institution,
    password_hash,
    email_verified_at
FROM app_users
ORDER BY email;
```

### Plantilla INSERT para la BD de destino:
```sql
-- Reemplaza cada fila con los valores reales obtenidos arriba.
-- ON CONFLICT DO NOTHING evita duplicados en re-ejecuciones.

INSERT INTO app_users (
    id, email, display_name, role,
    cohort_code, auth_provider, institution,
    password_hash, email_verified_at
)
VALUES
-- Fila 1 (copia los valores de la consulta anterior):
(
    'email:admin@orientapp.local',        -- id
    'admin@orientapp.local',              -- email
    'Administrador OrientApp',            -- display_name
    'SUPER_ADMIN',                        -- role
    NULL,                                 -- cohort_code
    'EMAIL',                              -- auth_provider
    NULL,                                 -- institution
    '$2b$10$q.uP6gXEYL1fi6MTdvFqN.p8xaTRfq/OPIuPEfvqPo7jRzuVQ0xDG',  -- password_hash (bcrypt)
    1700000000000                         -- email_verified_at (timestamp ms, pon el valor real)
)
-- , (segunda fila aquí si hay más usuarios)
ON CONFLICT DO NOTHING;
```

### Roles válidos:
| Valor en BD | Descripción |
|---|---|
| `SUPER_ADMIN` | Administrador principal |
| `TEST_ADMIN` | Administrador de tests |
| `PROFESOR` | Profesor / orientador |
| `REPORT_REVIEWER` | Revisor de reportes |
| `STUDENT` | Estudiante (rol por defecto) |

### Verificar:
```sql
SELECT id, email, role, email_verified_at IS NOT NULL AS verificado
FROM app_users
ORDER BY role, email;
```

---

## Tabla 2 — `cohort_groups`

Grupos / cohortes con su código QR y método asignado.

### Ver datos en la BD de origen:
```sql
SELECT
    code,
    title,
    institution,
    creator_name,
    created_at,
    is_active,
    description,
    method_id
FROM cohort_groups
ORDER BY created_at;
```

### Plantilla INSERT para la BD de destino:
```sql
INSERT INTO cohort_groups (
    code, title, institution, creator_name,
    created_at, is_active, description, method_id
)
VALUES
-- Fila 1:
(
    'ING-2026-A',                    -- code (clave primaria, debe ser único)
    '6to A Ingeniería 2026',         -- title
    'Colegio Nacional San Martín',   -- institution
    'admin@orientapp.local',         -- creator_name
    1700000000000,                   -- created_at (timestamp en ms)
    TRUE,                            -- is_active
    '',                              -- description
    'RIASEC'                         -- method_id: RIASEC | CHASIDE | TIPOV | CIPR | MAGDALENA
)
-- , (segunda fila aquí)
ON CONFLICT (code) DO NOTHING;
```

### Métodos válidos para `method_id`:
| Valor | Instrumento |
|---|---|
| `RIASEC` | Holland RIASEC (predeterminado) |
| `CHASIDE` | Test CHASIDE |
| `TIPOV` | TIPOV (Chile) |
| `CIPR` | CIP-R (Argentina) |
| `MAGDALENA` | Test Magdalena Contreras |

### Verificar:
```sql
SELECT code, title, method_id, is_active
FROM cohort_groups
ORDER BY created_at;
```

---

## Tabla 3 — `assessment_sessions`

Evaluaciones completadas por los estudiantes. Es la tabla más grande.

### Ver datos en la BD de origen:
```sql
SELECT
    id,
    started_at,
    completed_at,
    is_valid,
    reliability_level,
    r_score, i_score, a_score, s_score, e_score, c_score,
    dominant_code,
    dominant_summary,
    warning_message,
    top_career_title,
    top_career_affinity,
    cohort_code,
    student_name,
    student_email,
    student_phone,
    reviewer_notes,
    review_status,
    method_id,
    method_scores
FROM assessment_sessions
ORDER BY COALESCE(completed_at, started_at) DESC;
```

### Plantilla INSERT para la BD de destino:
```sql
INSERT INTO assessment_sessions (
    id,
    started_at, completed_at,
    is_valid, reliability_level,
    r_score, i_score, a_score, s_score, e_score, c_score,
    dominant_code, dominant_summary,
    warning_message,
    top_career_title, top_career_affinity,
    cohort_code, student_name, student_email, student_phone,
    reviewer_notes, review_status,
    method_id, method_scores
)
VALUES
-- Fila 1 (una evaluación):
(
    'uuid-de-la-sesion-aqui',        -- id (UUID, copia el original)
    1700000000000,                   -- started_at (timestamp ms)
    1700003600000,                   -- completed_at (timestamp ms, NULL si no terminó)
    TRUE,                            -- is_valid
    'Alta',                          -- reliability_level: Alta | Moderada | Baja
    75.0,                            -- r_score (0-100)
    82.0,                            -- i_score
    45.0,                            -- a_score
    60.0,                            -- s_score
    55.0,                            -- e_score
    50.0,                            -- c_score
    'RIA',                           -- dominant_code (ej. 'RIA', 'CH', 'TEC')
    'Perfil Tecnológico e Investigativo', -- dominant_summary
    NULL,                            -- warning_message (NULL si no hay advertencia)
    'Ingeniería de Software e IA',   -- top_career_title (NULL para métodos no-RIASEC)
    92.5,                            -- top_career_affinity (NULL para métodos no-RIASEC)
    'ING-2026-A',                    -- cohort_code (NULL si no pertenece a un grupo)
    'María García',                  -- student_name
    'maria@ejemplo.com',             -- student_email (NULL si no proporcionó)
    '+506 8888-8888',                -- student_phone (NULL si no proporcionó)
    NULL,                            -- reviewer_notes
    'COMPLETED',                     -- review_status (ver tabla abajo)
    'RIASEC',                        -- method_id
    NULL                             -- method_scores (NULL para RIASEC; JSONB para otros métodos)
)
ON CONFLICT (id) DO NOTHING;
```

### Estados válidos para `review_status`:
| Valor | Descripción |
|---|---|
| `PENDING` | Pendiente de revisión (defecto general) |
| `COMPLETED` | Completado — acceso inmediato (estudiantes de grupo via QR) |
| `PENDING_AUTHORIZATION` | Esperando que el admin autorice (individuales sin grupo) |
| `AUTHORIZED` | Autorizado por el admin |
| `IN_REVIEW` | En proceso de auditoría |
| `APPROVED` | Dictamen aprobado |
| `NEEDS_FOLLOWUP` | Requiere entrevista de seguimiento |

### Para sesiones con método NO-RIASEC (CHASIDE, TIPOV, CIP-R, Magdalena):
- Las columnas `r_score … c_score` van en `0`
- `top_career_title` y `top_career_affinity` van en `NULL`
- `method_scores` lleva el JSON con los puntajes reales. Ejemplo para CHASIDE:
```sql
-- method_scores para CHASIDE (ejemplo):
'{"dimensionScores":[{"code":"S","title":"Salud y Medicina","value":92.9,"raw":13},{"code":"H","title":"Humanístico, Social y Jurídico","value":71.4,"raw":10}],"dominantCodes":["S","H"],"interpretation":"Tus intereses dominantes...","raw":{"interes":{"C":3,"H":7,"A":5,"S":9,"I":4,"D":1,"E":6},"aptitud":{"C":2,"H":3,"A":2,"S":4,"I":2,"D":0,"E":3},"topInteres":["S","H"],"topAptitud":["S","H"]}}'::jsonb
```

### Verificar:
```sql
SELECT
    id,
    student_name,
    student_email,
    cohort_code,
    dominant_code,
    method_id,
    review_status,
    to_timestamp(completed_at / 1000) AS fecha
FROM assessment_sessions
ORDER BY completed_at DESC
LIMIT 20;
```

---

## Tabla 4 — `assessment_responses`

Respuestas individuales por ítem de cada sesión. Tabla más voluminosa.

> ⚠️ **Importante:** Insertar las respuestas DESPUÉS de haber insertado
> la sesión correspondiente en `assessment_sessions`, ya que tienen
> FOREIGN KEY con ON DELETE CASCADE.

### Ver datos en la BD de origen (por sesión):
```sql
SELECT
    id,
    session_id,
    question_id,
    dimension_code,
    score,
    time_spent_ms,
    answered_at
FROM assessment_responses
WHERE session_id = 'uuid-de-la-sesion'  -- reemplaza con el UUID real
ORDER BY question_id;
```

### Ver todas las respuestas de una sola vez (exportar masivamente):
```sql
SELECT
    r.session_id,
    r.question_id,
    r.dimension_code,
    r.score,
    r.time_spent_ms,
    r.answered_at
FROM assessment_responses r
JOIN assessment_sessions s ON s.id = r.session_id
ORDER BY r.session_id, r.question_id;
```

### Plantilla INSERT para la BD de destino:
```sql
-- No copies el campo 'id' (es BIGSERIAL, se genera automáticamente)
INSERT INTO assessment_responses (
    session_id,
    question_id,
    dimension_code,
    score,
    time_spent_ms,
    answered_at
)
VALUES
-- 60 filas para una sesión RIASEC completa (una por pregunta):
('uuid-de-la-sesion', 1,  'R', 4, 3200, 1700003600000),
('uuid-de-la-sesion', 2,  'R', 3, 2800, 1700003603000),
('uuid-de-la-sesion', 3,  'R', 5, 2100, 1700003606000),
-- ... (continúa con las 60 preguntas)
('uuid-de-la-sesion', 60, 'C', 2, 1900, 1700003800000)
ON CONFLICT DO NOTHING;
```

### Verificar:
```sql
SELECT
    session_id,
    COUNT(*) AS total_respuestas,
    MIN(score) AS min_score,
    MAX(score) AS max_score
FROM assessment_responses
GROUP BY session_id
ORDER BY total_respuestas DESC;
```

---

## Tabla 5 — `email_verification_tokens`

Tokens de verificación de correo. En la versión actual **no se usan activamente**
(el registro verifica la cuenta de inmediato). Solo migrar si tienes tokens
pendientes en la BD de origen.

### Ver datos en la BD de origen:
```sql
SELECT token, email, purpose, created_at, expires_at, consumed_at
FROM email_verification_tokens
WHERE consumed_at IS NULL
  AND expires_at > EXTRACT(EPOCH FROM NOW()) * 1000;
```

### Plantilla INSERT para la BD de destino:
```sql
INSERT INTO email_verification_tokens (
    token, email, purpose, created_at, expires_at, consumed_at
)
VALUES
(
    'uuid-del-token',        -- token (UUID)
    'usuario@ejemplo.com',   -- email
    'VERIFY_EMAIL',          -- purpose
    1700000000000,           -- created_at (timestamp ms)
    1700086400000,           -- expires_at (24h después, timestamp ms)
    NULL                     -- consumed_at (NULL = no usado aún)
)
ON CONFLICT (token) DO NOTHING;
```

---

## Alternativa rápida: pg_dump + psql (si tienes acceso por línea de comandos)

Si tienes la cadena de conexión de ambas bases, puedes hacer una migración
directa sin editar SQL manualmente:

```bash
# 1. Exportar SOLO los datos (sin esquema) de la BD de origen
pg_dump \
  "postgres://usuario:pass@host-origen.neon.tech/dbname?sslmode=require" \
  --data-only \
  --no-owner \
  --no-acl \
  --table=app_users \
  --table=cohort_groups \
  --table=assessment_sessions \
  --table=assessment_responses \
  --table=email_verification_tokens \
  -f datos_origen.sql

# 2. Importar en la BD de destino (asegúrate de haber ejecutado neon-setup.sql antes)
psql \
  "postgres://usuario:pass@host-destino.neon.tech/dbname?sslmode=require" \
  -f datos_origen.sql
```

---

## Checklist de migración

- [ ] Ejecutar `docs/neon-setup.sql` en la BD de destino
- [ ] Migrar `app_users` (primero — sin FK dependientes)
- [ ] Migrar `cohort_groups` (sin FK dependientes)
- [ ] Migrar `assessment_sessions` (depende de que las cohortes existan si hay FK checks)
- [ ] Migrar `assessment_responses` (después de las sesiones — tiene FK a `assessment_sessions`)
- [ ] Migrar `email_verification_tokens` (opcional)
- [ ] Verificar conteos: `SELECT COUNT(*) FROM <tabla>` en origen y destino
- [ ] Configurar variables en Vercel: `DATABASE_URL`, `AUTH_SECRET`, `NEXT_PUBLIC_APP_URL`
- [ ] Hacer redeploy en Vercel y probar login con `admin@orientapp.local`
