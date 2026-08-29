-- ===========================================================================
-- OrientApp - Esquema autoritativo de Neon Postgres
-- ---------------------------------------------------------------------------
-- Espeja las entidades Room de la app Android
-- (app/src/main/java/com/example/data/local/entities/AssessmentEntities.kt)
-- y añade la base de conocimiento (RAG) con pgvector.
--
-- Ejecutar contra la base Neon una sola vez (o mediante migración).
-- ===========================================================================

-- pgvector: requerido para los embeddings de la base de conocimiento (RAG).
CREATE EXTENSION IF NOT EXISTS vector;

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
    ai_analysis         TEXT,
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
-- Configuración de IA (ai_config) - fila única id = 1
-- NOTA DE SEGURIDAD: api_key se guarda EN CLARO (sin cifrado en reposo). Para
-- producción, prefiere configurar la clave con la variable de entorno
-- AI_API_KEY (tiene prioridad y no queda en la base). Si usas esta tabla,
-- restringe el acceso a la base y considera cifrado a nivel de columna o un
-- gestor de secretos. Ver web/README.md > "API key de IA en reposo".
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ai_config (
    id            INT PRIMARY KEY DEFAULT 1,
    provider_type TEXT NOT NULL,
    base_url      TEXT NOT NULL,
    api_key       TEXT NOT NULL,
    model_name    TEXT NOT NULL,
    temperature   REAL DEFAULT 0.7
);

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

-- ===========================================================================
-- Base de conocimiento (RAG) - libros, investigaciones científicas, etc.
-- ===========================================================================

-- Documento fuente subido por el personal (staff).
CREATE TABLE IF NOT EXISTS knowledge_documents (
    id               BIGSERIAL PRIMARY KEY,
    title            TEXT NOT NULL,
    source_type      TEXT NOT NULL,      -- p.ej. 'BOOK', 'RESEARCH', 'ARTICLE'
    source_reference TEXT,               -- cita/URL/ISBN
    created_at       BIGINT NOT NULL,
    created_by       TEXT
);

-- Fragmentos (chunks) con embeddings para búsqueda semántica.
-- La dimensión 1536 corresponde a text-embedding-3-small de OpenAI.
CREATE TABLE IF NOT EXISTS knowledge_chunks (
    id          BIGSERIAL PRIMARY KEY,
    document_id BIGINT NOT NULL REFERENCES knowledge_documents (id) ON DELETE CASCADE,
    chunk_index INT NOT NULL,
    content     TEXT NOT NULL,
    embedding   vector(1536),
    created_at  BIGINT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_knowledge_chunks_document_id
    ON knowledge_chunks (document_id);

-- Índice ANN para similitud coseno sobre los embeddings.
-- HNSW ofrece buen recall/latencia; alternativamente puede usarse ivfflat.
-- (Crear tras cargar datos si se prefiere ivfflat con lists ajustadas.)
CREATE INDEX IF NOT EXISTS idx_knowledge_chunks_embedding_hnsw
    ON knowledge_chunks USING hnsw (embedding vector_cosine_ops);
