-- ===========================================================================
-- OrientApp - Esquema autoritativo de Neon Postgres
-- ---------------------------------------------------------------------------
-- Espeja las entidades Room de la app Android
-- (app/src/main/java/com/example/data/local/entities/AssessmentEntities.kt).
--
-- El análisis vocacional es DETERMINISTA: lo calculan los motores de método
-- (RIASEC/CHASIDE/TIPOV/CIP-R/Magdalena) en web/lib/methods/*. No hay IA,
-- recuperación ni embeddings, por lo que no se requiere pgvector.
--
-- Ejecutar contra la base Neon una sola vez (o mediante migración).
-- ===========================================================================

-- ---------------------------------------------------------------------------
-- Sesiones de evaluación (assessment_sessions)
-- ---------------------------------------------------------------------------
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
    -- Campos de cohorte y estudiante
    cohort_code         TEXT,
    student_name        TEXT,
    student_email       TEXT,
    reviewer_notes      TEXT,
    review_status       TEXT DEFAULT 'PENDING',
    -- Método vocacional usado en la sesión (RIASEC por defecto). Para métodos
    -- distintos de RIASEC, las columnas r/i/a/s/e/c quedan en 0 y los puntajes
    -- reales por dimensión se guardan en method_scores (JSON).
    method_id           TEXT NOT NULL DEFAULT 'RIASEC',
    method_scores       JSONB
);

-- Migraciones idempotentes para bases ya existentes: añaden las columnas de
-- método sin reescribir ni eliminar columnas previas. Las filas antiguas
-- quedan con method_id = 'RIASEC' por el DEFAULT, de modo que siguen siendo
-- válidas y la vista de resultados las trata como RIASEC.
ALTER TABLE assessment_sessions
    ADD COLUMN IF NOT EXISTS method_id TEXT NOT NULL DEFAULT 'RIASEC';
ALTER TABLE assessment_sessions
    ADD COLUMN IF NOT EXISTS method_scores JSONB;

-- ---------------------------------------------------------------------------
-- Respuestas individuales (assessment_responses)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS assessment_responses (
    id             BIGSERIAL PRIMARY KEY,
    session_id     TEXT NOT NULL REFERENCES assessment_sessions (id) ON DELETE CASCADE,
    question_id    INT NOT NULL,
    dimension_code TEXT NOT NULL,
    score          INT NOT NULL,
    time_spent_ms  BIGINT NOT NULL,
    answered_at    BIGINT NOT NULL
);

-- Índices que replican los @Index de Room (sessionId, questionId).
CREATE INDEX IF NOT EXISTS idx_assessment_responses_session_id
    ON assessment_responses (session_id);
CREATE INDEX IF NOT EXISTS idx_assessment_responses_question_id
    ON assessment_responses (question_id);

-- ---------------------------------------------------------------------------
-- Cohortes / grupos de encuesta (cohort_groups)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS cohort_groups (
    code         TEXT PRIMARY KEY,
    title        TEXT NOT NULL,
    institution  TEXT NOT NULL,
    creator_name TEXT NOT NULL,
    created_at   BIGINT NOT NULL,
    is_active    BOOLEAN DEFAULT TRUE,
    description  TEXT DEFAULT '',
    -- Método vocacional asignado al grupo: el QR /g/{code} lleva a este test.
    method_id    TEXT NOT NULL DEFAULT 'RIASEC'
);

-- Migración idempotente para bases existentes.
ALTER TABLE cohort_groups
    ADD COLUMN IF NOT EXISTS method_id TEXT NOT NULL DEFAULT 'RIASEC';

-- ---------------------------------------------------------------------------
-- Usuarios de la aplicación (app_users)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS app_users (
    id            TEXT PRIMARY KEY,
    email         TEXT NOT NULL,
    display_name  TEXT NOT NULL,
    role          TEXT NOT NULL,
    cohort_code   TEXT,
    auth_provider TEXT DEFAULT 'GOOGLE',
    institution   TEXT
);
