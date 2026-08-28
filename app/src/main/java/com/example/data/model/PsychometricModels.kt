package com.example.data.model

import androidx.compose.ui.graphics.Color
import com.example.ui.theme.*

enum class DimensionCode(
    val title: String,
    val adjective: String,
    val shortDesc: String,
    val traits: List<String>
) {
    R("Realista", "Práctico y Técnico", "Atracción por el trabajo manual, herramientas, maquinaria, naturaleza y actividades al aire libre.", listOf("Práctico", "Mecánico", "Concreto", "Operativo")),
    I("Investigador", "Científico y Analítico", "Interés por la ciencia, la investigación, la lógica, el análisis de datos y la resolución de problemas abstractos.", listOf("Analítico", "Científico", "Curioso", "Observador")),
    A("Artístico", "Creativo y Expresivo", "Preferencia por la creatividad, el diseño, la innovación estética, la escritura y la libre expresión.", listOf("Creativo", "Intuitivo", "Original", "Expresivo")),
    S("Social", "Empático y Cooperativo", "Vocación de ayuda, enseñanza, orientación, trabajo comunitario y bienestar de las personas.", listOf("Empático", "Colaborativo", "Comunicativo", "Altruista")),
    E("Emprendedor", "Líder y Estratega", "Atracción por el liderazgo, la persuasión, los negocios, la toma de riesgos y la dirección de proyectos.", listOf("Líder", "Persuasivo", "Visionario", "Decidido")),
    C("Convencional", "Metódico y Estructurado", "Preferencia por el orden, la organización de datos, los sistemas estructurados y la precisión.", listOf("Organizado", "Metódico", "Detallista", "Sistemático"));

    fun getColor(): Color = when (this) {
        R -> ColorRealistic
        I -> ColorInvestigative
        A -> ColorArtistic
        S -> ColorSocial
        E -> ColorEnterprising
        C -> ColorConventional
    }
}

data class AssessmentQuestion(
    val id: Int,
    val dimension: DimensionCode,
    val text: String,
    val category: String = "INTEREST",
    val mirrorPairId: Int? = null
)

data class AssessmentAnswer(
    val questionId: Int,
    val dimension: DimensionCode,
    val score: Int, // 1 to 5
    val timeSpentMs: Long = 0L
)

data class PsychometricScores(
    val r: Float,
    val i: Float,
    val a: Float,
    val s: Float,
    val e: Float,
    val c: Float
) {
    fun toList(): List<Pair<DimensionCode, Float>> = listOf(
        DimensionCode.R to r,
        DimensionCode.I to i,
        DimensionCode.A to a,
        DimensionCode.S to s,
        DimensionCode.E to e,
        DimensionCode.C to c
    )

    fun getScore(code: DimensionCode): Float = when (code) {
        DimensionCode.R -> r
        DimensionCode.I -> i
        DimensionCode.A -> a
        DimensionCode.S -> s
        DimensionCode.E -> e
        DimensionCode.C -> c
    }

    fun getDominantCode(topCount: Int = 3): String {
        return toList()
            .sortedByDescending { it.second }
            .take(topCount)
            .map { it.first.name }
            .joinToString("")
    }

    fun getDominantDimensions(topCount: Int = 3): List<Pair<DimensionCode, Float>> {
        return toList().sortedByDescending { it.second }.take(topCount)
    }
}

data class QualityMetric(
    val isValid: Boolean,
    val straightLiningDetected: Boolean,
    val averageResponseTimeMs: Long,
    val speedTrapTriggered: Boolean,
    val mirrorConsistencyPercent: Int,
    val reliabilityLevel: String, // "Alta", "Moderada", "Baja"
    val warningMessage: String?
)

data class Career(
    val id: Int,
    val title: String,
    val areaName: String,
    val description: String,
    val workEnvironment: String,
    val idealR: Float,
    val idealI: Float,
    val idealA: Float,
    val idealS: Float,
    val idealE: Float,
    val idealC: Float,
    val keySkills: List<String>,
    val futureTrends: String
) {
    fun getIdealScores(): PsychometricScores = PsychometricScores(
        r = idealR,
        i = idealI,
        a = idealA,
        s = idealS,
        e = idealE,
        c = idealC
    )
}

data class CareerMatch(
    val career: Career,
    val affinityPercentage: Float,
    val matchLevel: String, // "Excelente (90%+)", "Alta (80-89%)", "Buena (70-79%)", "Moderada"
    val primaryDimensionMatch: Boolean
)

data class DiagnosticResult(
    val sessionId: String,
    val timestamp: Long,
    val scores: PsychometricScores,
    val dominantCode: String,
    val dominantSummary: String,
    val quality: QualityMetric,
    val careerMatches: List<CareerMatch>,
    val aiAnalysis: String? = null
)
