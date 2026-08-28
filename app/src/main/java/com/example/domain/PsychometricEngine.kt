package com.example.domain

import com.example.data.model.*
import kotlin.math.abs
import kotlin.math.sqrt

object PsychometricEngine {

    /**
     * Calculates the normalized scores (0 - 100) for all 6 RIASEC dimensions
     */
    fun calculateScores(
        answers: Map<Int, AssessmentAnswer>,
        questions: List<AssessmentQuestion>
    ): PsychometricScores {
        val questionsByDimension = questions.groupBy { it.dimension }
        
        fun calculateDimensionScore(dimension: DimensionCode): Float {
            val dimQuestions = questionsByDimension[dimension] ?: return 0f
            val totalQuestions = dimQuestions.size
            if (totalQuestions == 0) return 0f

            var sumShifted = 0
            var answeredCount = 0

            for (q in dimQuestions) {
                val ans = answers[q.id]
                if (ans != null) {
                    sumShifted += (ans.score - 1).coerceIn(0, 4)
                    answeredCount++
                }
            }

            if (answeredCount == 0) return 0f
            // Scale according to answered items (out of max 4 per item)
            val maxPossible = 4f * answeredCount
            return ((sumShifted.toFloat() / maxPossible) * 100f).coerceIn(0f, 100f)
        }

        return PsychometricScores(
            r = calculateDimensionScore(DimensionCode.R),
            i = calculateDimensionScore(DimensionCode.I),
            a = calculateDimensionScore(DimensionCode.A),
            s = calculateDimensionScore(DimensionCode.S),
            e = calculateDimensionScore(DimensionCode.E),
            c = calculateDimensionScore(DimensionCode.C)
        )
    }

    /**
     * Heuristic quality validation: speed trap, straight lining and mirror pair consistency
     */
    fun evaluateQuality(
        answers: Map<Int, AssessmentAnswer>,
        questions: List<AssessmentQuestion>
    ): QualityMetric {
        val answerList = answers.values.toList()
        if (answerList.isEmpty()) {
            return QualityMetric(
                isValid = false,
                straightLiningDetected = false,
                averageResponseTimeMs = 0L,
                speedTrapTriggered = false,
                mirrorConsistencyPercent = 100,
                reliabilityLevel = "Insuficiente",
                warningMessage = "No hay suficientes respuestas registradas."
            )
        }

        // 1. Speed trap check (< 1100ms per question)
        val validTimes = answerList.map { it.timeSpentMs }.filter { it > 0 }
        val avgTime = if (validTimes.isNotEmpty()) validTimes.average().toLong() else 2500L
        val speedTrapTriggered = avgTime < 1100L && validTimes.size >= 10

        // 2. Straight-lining (monotony)
        val scoreCounts = answerList.groupingBy { it.score }.eachCount()
        val maxScoreFrequency = scoreCounts.values.maxOrNull() ?: 0
        val repetitionRatio = maxScoreFrequency.toFloat() / answerList.size
        val straightLiningDetected = repetitionRatio >= 0.75f && answerList.size >= 15

        // 3. Mirror pairs consistency
        val mirrorQuestions = questions.filter { it.mirrorPairId != null }
        var consistencyPenalty = 0
        var mirrorPairsChecked = 0

        for (q in mirrorQuestions) {
            val pairId = q.mirrorPairId ?: continue
            if (q.id < pairId) { // Check each pair once
                val ans1 = answers[q.id]
                val ans2 = answers[pairId]
                if (ans1 != null && ans2 != null) {
                    mirrorPairsChecked++
                    val diff = abs(ans1.score - ans2.score)
                    if (diff >= 3) {
                        consistencyPenalty += 20
                    } else if (diff == 2) {
                        consistencyPenalty += 10
                    }
                }
            }
        }

        val mirrorConsistencyPercent = (100 - consistencyPenalty).coerceIn(40, 100)

        val isValid = !straightLiningDetected && !(speedTrapTriggered && mirrorConsistencyPercent < 60)

        val reliabilityLevel = when {
            !isValid || mirrorConsistencyPercent < 60 -> "Baja"
            speedTrapTriggered || mirrorConsistencyPercent < 80 -> "Moderada"
            else -> "Alta"
        }

        val warning = when {
            straightLiningDetected -> "Se detectó un patrón de respuestas monótono. Se recomienda reflexionar con mayor variabilidad para un diagnóstico preciso."
            speedTrapTriggered -> "El tiempo promedio por pregunta fue muy rápido ($avgTime ms). Verifica si las respuestas fueron reflexivas."
            mirrorConsistencyPercent < 75 -> "Existen algunas ligeras discrepancias en preguntas de control, pero los resultados son utilizables."
            else -> null
        }

        return QualityMetric(
            isValid = isValid,
            straightLiningDetected = straightLiningDetected,
            averageResponseTimeMs = avgTime,
            speedTrapTriggered = speedTrapTriggered,
            mirrorConsistencyPercent = mirrorConsistencyPercent,
            reliabilityLevel = reliabilityLevel,
            warningMessage = warning
        )
    }

    /**
     * Calculates cosine similarity between user vector and ideal career vectors
     */
    fun matchCareers(
        userScores: PsychometricScores,
        catalog: List<Career>
    ): List<CareerMatch> {
        val u = floatArrayOf(
            userScores.r,
            userScores.i,
            userScores.a,
            userScores.s,
            userScores.e,
            userScores.c
        )
        val uNorm = vectorMagnitude(u)

        if (uNorm == 0f) {
            return catalog.map {
                CareerMatch(
                    career = it,
                    affinityPercentage = 50f,
                    matchLevel = "Moderada",
                    primaryDimensionMatch = false
                )
            }
        }

        val userDominant = userScores.getDominantDimensions(1).firstOrNull()?.first

        val matches = catalog.map { career ->
            val c = floatArrayOf(
                career.idealR,
                career.idealI,
                career.idealA,
                career.idealS,
                career.idealE,
                career.idealC
            )
            val cNorm = vectorMagnitude(c)

            var dotProduct = 0f
            for (k in 0 until 6) {
                dotProduct += u[k] * c[k]
            }

            var cosineSim = if (cNorm > 0f) (dotProduct / (uNorm * cNorm)) else 0.5f

            // Also compute Euclidean proximity in [0, 1]
            var euclideanDistanceSq = 0f
            for (k in 0 until 6) {
                val diff = (u[k] - c[k]) / 100f
                euclideanDistanceSq += diff * diff
            }
            val euclideanDistance = sqrt(euclideanDistanceSq) // max is sqrt(6) ≈ 2.45
            val euclideanProximity = (1f - (euclideanDistance / 2.45f)).coerceIn(0f, 1f)

            // Combined affinity score: 70% cosine similarity + 30% euclidean proximity
            var affinity = (cosineSim * 0.70f + euclideanProximity * 0.30f) * 100f

            // Check primary dimension compatibility
            val careerIdealScores = career.getIdealScores()
            val careerDominant = careerIdealScores.getDominantDimensions(1).firstOrNull()?.first
            val primaryMatch = userDominant != null && userDominant == careerDominant

            if (primaryMatch) {
                affinity = (affinity * 1.05f).coerceAtMost(99.5f)
            }

            val finalAffinity = affinity.coerceIn(30f, 99f)

            val matchLevel = when {
                finalAffinity >= 88f -> "Compatibilidad Excelente"
                finalAffinity >= 78f -> "Alta Afinidad"
                finalAffinity >= 68f -> "Buena Afinidad"
                else -> "Afinidad Moderada"
            }

            CareerMatch(
                career = career,
                affinityPercentage = finalAffinity,
                matchLevel = matchLevel,
                primaryDimensionMatch = primaryMatch
            )
        }

        return matches.sortedByDescending { it.affinityPercentage }
    }

    private fun vectorMagnitude(v: FloatArray): Float {
        var sumSq = 0f
        for (x in v) {
            sumSq += x * x
        }
        return sqrt(sumSq)
    }

    fun getDominantProfileDescription(dominantCode: String): String {
        return when (dominantCode.take(2)) {
            "IR", "RI" -> "Perfil Tecnológico e Investigativo. Destacas por combinar la rigurosidad científica y el análisis con la aplicación práctica y técnica en sistemas complejos."
            "IA", "AI" -> "Perfil Científico-Creativo e Innovador. Te impulsa explorar nuevas ideas, resolver problemas abstractos y formular soluciones visuales o conceptuales disruptivas."
            "IS", "SI" -> "Perfil Humanístico-Científico. Interés profundo en comprender el comportamiento humano, la salud, la psicología y la educación a través del rigor del método científico."
            "IE", "EI" -> "Perfil Estratégico y de Desarrollo. Combina la capacidad analítica de datos con visión de liderazgo, innovación tecnológica y desarrollo de modelos de negocio."
            "IC", "CI" -> "Perfil de Arquitectura de Información y Precisión. Enfoque meticuloso en el análisis cuantitativo, la computación, las finanzas cuantitativas y la investigación estructurada."
            "AS", "SA" -> "Perfil Social-Artístico y Comunicacional. Gran empatía, talento para la comunicación interpersonal, artes expresivas, diseño de impacto social y docencia creativa."
            "AE", "EA" -> "Perfil Emprendedor Creativo. Talento para el marketing, publicidad, dirección de arte, diseño de marcas y generación de proyectos innovadores con alta visibilidad."
            "AC", "CA" -> "Perfil de Diseño Metódico. Capacidad para traducir conceptos estéticos en documentación técnica, diseño arquitectónico, UX estructurado y producción digital."
            "SE", "ES" -> "Perfil de Liderazgo Social y Gestión Humana. Habilidad nata para liderar equipos, relaciones públicas, derecho, recursos humanos y dirección institucional."
            "SC", "CS" -> "Perfil de Apoyo Operativo y Organizacional. Compromiso con el servicio estructurado, administración de salud, trabajo social protocolizado y pedagogía metódica."
            "ER", "RE" -> "Perfil de Gestión Industrial y Operaciones. Liderazgo en el terreno de la ingeniería civil, logística, agronomía, construcción y dirección de plantas industriales."
            "EC", "CE" -> "Perfil Corporativo y de Finanzas. Visión estratégica enfocada en resultados, administración de empresas, finanzas corporativas, auditoría y comercio internacional."
            "RC", "CR" -> "Perfil Técnico-Especializado y Logístico. Destreza en el mantenimiento de infraestructuras, telecomunicaciones, ciberseguridad operativa y gestión de calidad técnica."
            "RA", "AR" -> "Perfil de Diseño Industrial y Artesanal. Combinación de destrezas manuales con sensibilidad artística, diseño de producto, escenografía y animación."
            "RS", "SR" -> "Perfil de Entrenamiento y Acción Social. Interés en fisioterapia, terapia ocupacional, rescate, deporte y capacitación práctica comunitaria."
            else -> "Perfil Multifacético con fortalezas equilibradas en $dominantCode. Cuentas con versatilidad para desenvolverte en campos interdisciplinarios."
        }
    }
}
