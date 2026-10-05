-- =============================================================================
-- OrientApp Web — Setup completo para Neon Postgres
-- =============================================================================
-- Instrucciones:
--   1. Abre tu proyecto en https://neon.tech
--   2. Ve a "SQL Editor"
--   3. Copia TODO este archivo y pégalo en el editor
--   4. Haz clic en "Run"
--
-- Este script es IDEMPOTENTE: puedes ejecutarlo varias veces sin error ni
-- datos duplicados. Usa CREATE TABLE IF NOT EXISTS, ADD COLUMN IF NOT EXISTS
-- y ON CONFLICT DO NOTHING para ser seguro en re-ejecuciones.
-- =============================================================================


-- -----------------------------------------------------------------------------
-- PARTE 1: ESQUEMA DE TABLAS
-- -----------------------------------------------------------------------------

-- Sesiones de evaluación vocacional
CREATE TABLE IF NOT EXISTS assessment_sessions (
    id                  TEXT PRIMARY KEY,
    started_at          BIGINT NOT NULL,
    completed_at        BIGINT,
    is_valid            BOOLEAN NOT NULL,
    reliability_level   TEXT NOT NULL,
    r_score             REAL NOT NULL,
    i_score             REAL NOT NULL,
    a_score             REAL NOT NULL,
    s_score             REAL NOT NULL,
    e_score             REAL NOT NULL,
    c_score             REAL NOT NULL,
    dominant_code       TEXT NOT NULL,
    dominant_summary    TEXT NOT NULL,
    warning_message     TEXT,
    top_career_title    TEXT,
    top_career_affinity REAL,
    cohort_code         TEXT,
    student_name        TEXT,
    student_email       TEXT,
    reviewer_notes      TEXT,
    review_status       TEXT DEFAULT 'PENDING',
    method_id           TEXT NOT NULL DEFAULT 'RIASEC',
    method_scores       JSONB,
    student_phone       TEXT
);

-- Migraciones idempotentes (por si la tabla ya existía antes de este script)
ALTER TABLE assessment_sessions ADD COLUMN IF NOT EXISTS method_id       TEXT    NOT NULL DEFAULT 'RIASEC';
ALTER TABLE assessment_sessions ADD COLUMN IF NOT EXISTS method_scores   JSONB;
ALTER TABLE assessment_sessions ADD COLUMN IF NOT EXISTS student_phone   TEXT;

-- Respuestas individuales por ítem
CREATE TABLE IF NOT EXISTS assessment_responses (
    id             BIGSERIAL PRIMARY KEY,
    session_id     TEXT   NOT NULL REFERENCES assessment_sessions (id) ON DELETE CASCADE,
    question_id    INT    NOT NULL,
    dimension_code TEXT   NOT NULL,
    score          INT    NOT NULL,
    time_spent_ms  BIGINT NOT NULL,
    answered_at    BIGINT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_assessment_responses_session_id
    ON assessment_responses (session_id);
CREATE INDEX IF NOT EXISTS idx_assessment_responses_question_id
    ON assessment_responses (question_id);

-- Grupos / cohortes de encuesta
CREATE TABLE IF NOT EXISTS cohort_groups (
    code         TEXT    PRIMARY KEY,
    title        TEXT    NOT NULL,
    institution  TEXT    NOT NULL,
    creator_name TEXT    NOT NULL,
    created_at   BIGINT  NOT NULL,
    is_active    BOOLEAN DEFAULT TRUE,
    description  TEXT    DEFAULT '',
    method_id    TEXT    NOT NULL DEFAULT 'RIASEC'
);

ALTER TABLE cohort_groups ADD COLUMN IF NOT EXISTS method_id TEXT NOT NULL DEFAULT 'RIASEC';

-- Usuarios del sistema (staff, admin, individuales)
CREATE TABLE IF NOT EXISTS app_users (
    id                TEXT   PRIMARY KEY,
    email             TEXT   NOT NULL,
    display_name      TEXT   NOT NULL,
    role              TEXT   NOT NULL,
    cohort_code       TEXT,
    auth_provider     TEXT   DEFAULT 'EMAIL',
    institution       TEXT,
    password_hash     TEXT,
    email_verified_at BIGINT
);

ALTER TABLE app_users ADD COLUMN IF NOT EXISTS password_hash     TEXT;
ALTER TABLE app_users ADD COLUMN IF NOT EXISTS email_verified_at BIGINT;

-- Índice único en lower(email) para unicidad case-insensitive
CREATE UNIQUE INDEX IF NOT EXISTS uq_app_users_email_lower
    ON app_users (lower(email));

-- Tokens de verificación de correo (reservados, actualmente no se usan)
CREATE TABLE IF NOT EXISTS email_verification_tokens (
    token       TEXT   PRIMARY KEY,
    email       TEXT   NOT NULL,
    purpose     TEXT   NOT NULL DEFAULT 'VERIFY_EMAIL',
    created_at  BIGINT NOT NULL,
    expires_at  BIGINT NOT NULL,
    consumed_at BIGINT
);

CREATE INDEX IF NOT EXISTS idx_email_verification_tokens_email
    ON email_verification_tokens (email);


-- -----------------------------------------------------------------------------
-- PARTE 2: ADMINISTRADOR INICIAL
-- -----------------------------------------------------------------------------
-- Credenciales por defecto:
--   Email    : admin@orientapp.local
--   Contraseña: OrientApp!Admin2026
--
-- ⚠️  CAMBIA LA CONTRASEÑA DESPUÉS DEL PRIMER INICIO DE SESIÓN
--
-- La contraseña está almacenada como hash bcrypt (cost 10).
-- Nunca se guarda en texto plano.
-- -----------------------------------------------------------------------------

INSERT INTO app_users (
    id,
    email,
    display_name,
    role,
    auth_provider,
    email_verified_at,
    password_hash
)
VALUES (
    'email:admin@orientapp.local',
    'admin@orientapp.local',
    'Administrador OrientApp',
    'SUPER_ADMIN',
    'EMAIL',
    EXTRACT(EPOCH FROM NOW()) * 1000,
    '$2b$10$q.uP6gXEYL1fi6MTdvFqN.p8xaTRfq/OPIuPEfvqPo7jRzuVQ0xDG'
)
ON CONFLICT DO NOTHING;


-- -----------------------------------------------------------------------------
-- PARTE 3: GRUPOS DE EJEMPLO (opcionales — puedes borrar esta sección)
-- -----------------------------------------------------------------------------

INSERT INTO cohort_groups (code, title, institution, creator_name, created_at, is_active, description, method_id)
VALUES
    ('ING-2026-A',  '6to A Ingeniería 2026',          'Institución de ejemplo',  'Administrador OrientApp', EXTRACT(EPOCH FROM NOW()) * 1000, TRUE, 'Grupo de ejemplo para ingeniería',         'RIASEC'),
    ('BIO-2026-A',  '6to A Ciencias Biológicas 2026', 'Institución de ejemplo',  'Administrador OrientApp', EXTRACT(EPOCH FROM NOW()) * 1000, TRUE, 'Grupo de ejemplo para ciencias biológicas', 'CHASIDE'),
    ('SOC-2026-A',  '6to A Humanidades 2026',          'Institución de ejemplo',  'Administrador OrientApp', EXTRACT(EPOCH FROM NOW()) * 1000, TRUE, 'Grupo de ejemplo para humanidades',         'TIPOV'),
    ('LIBRE-2026',  'Programa Abierto Preuniversitario','Institución de ejemplo',  'Administrador OrientApp', EXTRACT(EPOCH FROM NOW()) * 1000, TRUE, 'Grupo abierto sin método fijo',             'RIASEC')
ON CONFLICT (code) DO NOTHING;


-- -----------------------------------------------------------------------------
-- VERIFICACIÓN — ejecuta esto aparte para confirmar que todo quedó bien:
-- -----------------------------------------------------------------------------
-- SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;
-- SELECT id, email, role, email_verified_at IS NOT NULL AS verificado FROM app_users;
-- SELECT code, title, method_id FROM cohort_groups;
-- =============================================================================
