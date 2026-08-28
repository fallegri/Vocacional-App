package com.example

import com.example.data.model.AssessmentAnswer
import com.example.data.model.DimensionCode
import com.example.data.repository.SeedData
import com.example.domain.PsychometricEngine
import org.junit.Assert.*
import org.junit.Test

class ExampleUnitTest {

    @Test
    fun testPsychometricScoreCalculation() {
        val questions = SeedData.QUESTIONS
        val answers = mutableMapOf<Int, AssessmentAnswer>()

        // Answer all I (Investigative) with 5 (max score), all others with 1 (min score)
        questions.forEach { q ->
            val score = if (q.dimension == DimensionCode.I) 5 else 1
            answers[q.id] = AssessmentAnswer(
                questionId = q.id,
                dimension = q.dimension,
                score = score,
                timeSpentMs = 3000L
            )
        }

        val scores = PsychometricEngine.calculateScores(answers, questions)
        assertEquals(100f, scores.i, 0.1f)
        assertEquals(0f, scores.r, 0.1f)
        assertEquals(0f, scores.a, 0.1f)

        val dominantCode = scores.getDominantCode(3)
        assertTrue(dominantCode.startsWith("I"))
    }

    @Test
    fun testCareerMatchingEngine() {
        val questions = SeedData.QUESTIONS
        val careers = SeedData.CAREERS
        val answers = mutableMapOf<Int, AssessmentAnswer>()

        // Simulate high Investigative & Realistic scores (Software / Data / Bio)
        questions.forEach { q ->
            val score = when (q.dimension) {
                DimensionCode.I -> 5
                DimensionCode.R -> 4
                DimensionCode.C -> 4
                else -> 2
            }
            answers[q.id] = AssessmentAnswer(
                questionId = q.id,
                dimension = q.dimension,
                score = score,
                timeSpentMs = 2500L
            )
        }

        val scores = PsychometricEngine.calculateScores(answers, questions)
        val matches = PsychometricEngine.matchCareers(scores, careers)

        assertTrue(matches.isNotEmpty())
        val topCareer = matches.first()
        assertTrue(
            topCareer.career.title.contains("Software") ||
            topCareer.career.title.contains("Biotecnología") ||
            topCareer.career.title.contains("Datos") ||
            topCareer.career.title.contains("Robótica")
        )
        assertTrue(topCareer.affinityPercentage > 75f)
    }

    @Test
    fun testQualityControlSpeedTrapAndStraightLining() {
        val questions = SeedData.QUESTIONS
        val answers = mutableMapOf<Int, AssessmentAnswer>()

        // Fast straight-lining responses (all 3s, 500ms each)
        questions.forEach { q ->
            answers[q.id] = AssessmentAnswer(
                questionId = q.id,
                dimension = q.dimension,
                score = 3,
                timeSpentMs = 500L
            )
        }

        val quality = PsychometricEngine.evaluateQuality(answers, questions)
        assertTrue(quality.straightLiningDetected)
        assertTrue(quality.speedTrapTriggered)
        assertFalse(quality.isValid)
    }
}

