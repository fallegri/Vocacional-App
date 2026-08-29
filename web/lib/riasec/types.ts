// ===========================================================================
// Tipos del dominio RIASEC (Holland) - portados desde
// app/src/main/java/com/example/data/model/PsychometricModels.kt y UserModels.kt
// Los colores hex provienen de app/src/main/java/com/example/ui/theme/Color.kt
// Todo el texto de cara al usuario permanece en español.
// ===========================================================================

export type DimensionCode = "R" | "I" | "A" | "S" | "E" | "C";

export interface DimensionMeta {
  code: DimensionCode;
  title: string;
  adjective: string;
  shortDesc: string;
  traits: string[];
  /** Color semántico de la dimensión (hex), tomado de Color.kt. */
  color: string;
}

/** Metadatos de cada dimensión RIASEC (title, adjective, shortDesc, traits, color). */
export const DIMENSION_META: Record<DimensionCode, DimensionMeta> = {
  R: {
    code: "R",
    title: "Realista",
    adjective: "Práctico y Técnico",
    shortDesc:
      "Atracción por el trabajo manual, herramientas, maquinaria, naturaleza y actividades al aire libre.",
    traits: ["Práctico", "Mecánico", "Concreto", "Operativo"],
    color: "#EA580C", // ColorRealistic
  },
  I: {
    code: "I",
    title: "Investigador",
    adjective: "Científico y Analítico",
    shortDesc:
      "Interés por la ciencia, la investigación, la lógica, el análisis de datos y la resolución de problemas abstractos.",
    traits: ["Analítico", "Científico", "Curioso", "Observador"],
    color: "#0284C7", // ColorInvestigative
  },
  A: {
    code: "A",
    title: "Artístico",
    adjective: "Creativo y Expresivo",
    shortDesc:
      "Preferencia por la creatividad, el diseño, la innovación estética, la escritura y la libre expresión.",
    traits: ["Creativo", "Intuitivo", "Original", "Expresivo"],
    color: "#9333EA", // ColorArtistic
  },
  S: {
    code: "S",
    title: "Social",
    adjective: "Empático y Cooperativo",
    shortDesc:
      "Vocación de ayuda, enseñanza, orientación, trabajo comunitario y bienestar de las personas.",
    traits: ["Empático", "Colaborativo", "Comunicativo", "Altruista"],
    color: "#16A34A", // ColorSocial
  },
  E: {
    code: "E",
    title: "Emprendedor",
    adjective: "Líder y Estratega",
    shortDesc:
      "Atracción por el liderazgo, la persuasión, los negocios, la toma de riesgos y la dirección de proyectos.",
    traits: ["Líder", "Persuasivo", "Visionario", "Decidido"],
    color: "#E11D48", // ColorEnterprising
  },
  C: {
    code: "C",
    title: "Convencional",
    adjective: "Metódico y Estructurado",
    shortDesc:
      "Preferencia por el orden, la organización de datos, los sistemas estructurados y la precisión.",
    traits: ["Organizado", "Metódico", "Detallista", "Sistemático"],
    color: "#4F46E5", // ColorConventional
  },
};

/** Orden canónico de las dimensiones RIASEC. */
export const DIMENSION_ORDER: DimensionCode[] = ["R", "I", "A", "S", "E", "C"];

export interface AssessmentQuestion {
  id: number;
  dimension: DimensionCode;
  text: string;
  category: string; // por defecto "INTEREST"
  mirrorPairId?: number;
}

export interface AssessmentAnswer {
  questionId: number;
  dimension: DimensionCode;
  /** Puntaje Likert 1 a 5. */
  score: number;
  timeSpentMs: number;
}

export interface PsychometricScores {
  r: number;
  i: number;
  a: number;
  s: number;
  e: number;
  c: number;
}

export interface Career {
  id: number;
  title: string;
  areaName: string;
  description: string;
  workEnvironment: string;
  idealR: number;
  idealI: number;
  idealA: number;
  idealS: number;
  idealE: number;
  idealC: number;
  keySkills: string[];
  futureTrends: string;
}

export interface CareerMatch {
  career: Career;
  affinityPercentage: number;
  /** "Compatibilidad Excelente" | "Alta Afinidad" | "Buena Afinidad" | "Afinidad Moderada" | "Moderada" */
  matchLevel: string;
  primaryDimensionMatch: boolean;
}

export interface QualityMetric {
  isValid: boolean;
  straightLiningDetected: boolean;
  averageResponseTimeMs: number;
  speedTrapTriggered: boolean;
  mirrorConsistencyPercent: number;
  /** "Alta" | "Moderada" | "Baja" | "Insuficiente" */
  reliabilityLevel: string;
  warningMessage: string | null;
}

export interface DiagnosticResult {
  sessionId: string;
  timestamp: number;
  scores: PsychometricScores;
  dominantCode: string;
  dominantSummary: string;
  quality: QualityMetric;
  careerMatches: CareerMatch[];
  aiAnalysis?: string | null;
}

// ---------------------------------------------------------------------------
// Roles y estados de revisión - portados desde UserModels.kt
// ---------------------------------------------------------------------------

export type UserRoleCode =
  | "SUPER_ADMIN"
  | "TEST_ADMIN"
  | "REPORT_REVIEWER"
  | "STUDENT";

export interface UserRoleMeta {
  code: UserRoleCode;
  title: string;
  description: string;
  badgeIcon: string;
  isStaff: boolean;
}

export const USER_ROLES: Record<UserRoleCode, UserRoleMeta> = {
  SUPER_ADMIN: {
    code: "SUPER_ADMIN",
    title: "Admin Principal",
    description:
      "Acceso total al sistema, auditoría global, gestión de instituciones y configuración de IA",
    badgeIcon: "👑",
    isStaff: true,
  },
  TEST_ADMIN: {
    code: "TEST_ADMIN",
    title: "Admin de Test",
    description:
      "Coordinador de evaluaciones, creación de códigos de cohorte y control de calidad psicométrica",
    badgeIcon: "📋",
    isStaff: true,
  },
  REPORT_REVIEWER: {
    code: "REPORT_REVIEWER",
    title: "Revisor de Reportes",
    description:
      "Orientador y psicólogo vocacional, auditor de informes de estudiantes y dictamen pedagógico",
    badgeIcon: "🔍",
    isStaff: true,
  },
  STUDENT: {
    code: "STUDENT",
    title: "Estudiante",
    description:
      "Toma de diagnósticos vocacionales RIASEC, acceso a resultados y Tutor IA personalizado",
    badgeIcon: "🎓",
    isStaff: false,
  },
};

export type AuthProviderCode = "GOOGLE" | "EMAIL" | "GUEST";

export const AUTH_PROVIDERS: Record<AuthProviderCode, { displayName: string }> = {
  GOOGLE: { displayName: "Google / Gmail" },
  EMAIL: { displayName: "Correo Institucional" },
  GUEST: { displayName: "Acceso Invitado" },
};

export type ReviewStatusCode =
  | "PENDING"
  | "IN_REVIEW"
  | "APPROVED"
  | "NEEDS_FOLLOWUP";

export const REVIEW_STATUS: Record<ReviewStatusCode, { displayName: string }> = {
  PENDING: { displayName: "Pendiente de Revisión" },
  IN_REVIEW: { displayName: "En Auditoría" },
  APPROVED: { displayName: "Dictamen Aprobado" },
  NEEDS_FOLLOWUP: { displayName: "Requiere Entrevista" },
};

export interface AppUser {
  id: string;
  email: string;
  displayName: string;
  role: UserRoleCode;
  cohortCode?: string | null;
  avatarUrl?: string | null;
  authProvider: AuthProviderCode;
  institution?: string | null;
}

export interface CohortGroup {
  code: string;
  title: string;
  institution: string;
  creatorName: string;
  isActive: boolean;
  description: string;
}
