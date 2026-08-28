package com.example.data.local.entities

import androidx.room.Entity
import androidx.room.ForeignKey
import androidx.room.Index
import androidx.room.PrimaryKey

@Entity(tableName = "assessment_sessions")
data class AssessmentSessionEntity(
    @PrimaryKey
    val id: String,
    val startedAt: Long,
    val completedAt: Long?,
    val isValid: Boolean,
    val reliabilityLevel: String,
    val rScore: Float,
    val iScore: Float,
    val aScore: Float,
    val sScore: Float,
    val eScore: Float,
    val cScore: Float,
    val dominantCode: String,
    val dominantSummary: String,
    val warningMessage: String?,
    val topCareerTitle: String?,
    val topCareerAffinity: Float?,
    val aiAnalysis: String? = null,
    // Cohort & Student fields
    val cohortCode: String? = null,
    val studentName: String? = null,
    val studentEmail: String? = null,
    val reviewerNotes: String? = null,
    val reviewStatus: String? = "PENDING"
)

@Entity(
    tableName = "assessment_responses",
    foreignKeys = [
        ForeignKey(
            entity = AssessmentSessionEntity::class,
            parentColumns = ["id"],
            childColumns = ["sessionId"],
            onDelete = ForeignKey.CASCADE
        )
    ],
    indices = [Index("sessionId"), Index("questionId")]
)
data class AssessmentResponseEntity(
    @PrimaryKey(autoGenerate = true)
    val id: Long = 0,
    val sessionId: String,
    val questionId: Int,
    val dimensionCode: String,
    val score: Int,
    val timeSpentMs: Long,
    val answeredAt: Long = System.currentTimeMillis()
)

@Entity(tableName = "ai_config")
data class AiConfigEntity(
    @PrimaryKey
    val id: Int = 1,
    val providerType: String,
    val baseUrl: String,
    val apiKey: String,
    val modelName: String,
    val temperature: Float = 0.7f
)

@Entity(tableName = "cohort_groups")
data class CohortGroupEntity(
    @PrimaryKey
    val code: String,
    val title: String,
    val institution: String,
    val creatorName: String,
    val createdAt: Long = System.currentTimeMillis(),
    val isActive: Boolean = true,
    val description: String = ""
)

@Entity(tableName = "app_users")
data class UserEntity(
    @PrimaryKey
    val id: String,
    val email: String,
    val displayName: String,
    val role: String,
    val cohortCode: String? = null,
    val authProvider: String = "GOOGLE",
    val institution: String? = null
)
