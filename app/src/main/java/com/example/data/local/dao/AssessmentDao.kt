package com.example.data.local.dao

import androidx.room.*
import com.example.data.local.entities.AiConfigEntity
import com.example.data.local.entities.AssessmentResponseEntity
import com.example.data.local.entities.AssessmentSessionEntity
import com.example.data.local.entities.CohortGroupEntity
import com.example.data.local.entities.UserEntity
import kotlinx.coroutines.flow.Flow

@Dao
interface AssessmentDao {

    @Query("SELECT * FROM assessment_sessions ORDER BY startedAt DESC")
    fun getAllSessions(): Flow<List<AssessmentSessionEntity>>

    @Query("SELECT * FROM assessment_sessions WHERE cohortCode = :cohortCode ORDER BY startedAt DESC")
    fun getSessionsByCohort(cohortCode: String): Flow<List<AssessmentSessionEntity>>

    @Query("SELECT * FROM assessment_sessions WHERE id = :sessionId LIMIT 1")
    suspend fun getSessionById(sessionId: String): AssessmentSessionEntity?

    @Query("SELECT * FROM assessment_sessions WHERE completedAt IS NOT NULL ORDER BY completedAt DESC LIMIT 1")
    fun getLatestCompletedSession(): Flow<AssessmentSessionEntity?>

    @Query("SELECT * FROM assessment_sessions WHERE completedAt IS NULL ORDER BY startedAt DESC LIMIT 1")
    suspend fun getActiveSession(): AssessmentSessionEntity?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertSession(session: AssessmentSessionEntity)

    @Update
    suspend fun updateSession(session: AssessmentSessionEntity)

    @Query("UPDATE assessment_sessions SET aiAnalysis = :aiAnalysis WHERE id = :sessionId")
    suspend fun updateAiAnalysis(sessionId: String, aiAnalysis: String)

    @Query("UPDATE assessment_sessions SET reviewerNotes = :notes, reviewStatus = :status WHERE id = :sessionId")
    suspend fun updateReviewerFeedback(sessionId: String, notes: String, status: String)

    @Query("DELETE FROM assessment_sessions WHERE id = :sessionId")
    suspend fun deleteSession(sessionId: String)

    // Responses
    @Query("SELECT * FROM assessment_responses WHERE sessionId = :sessionId")
    suspend fun getResponsesForSession(sessionId: String): List<AssessmentResponseEntity>

    @Query("SELECT * FROM assessment_responses WHERE sessionId = :sessionId")
    fun getResponsesForSessionFlow(sessionId: String): Flow<List<AssessmentResponseEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertResponse(response: AssessmentResponseEntity)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertResponses(responses: List<AssessmentResponseEntity>)

    @Query("DELETE FROM assessment_responses WHERE sessionId = :sessionId")
    suspend fun clearResponsesForSession(sessionId: String)

    // AI Config
    @Query("SELECT * FROM ai_config WHERE id = 1 LIMIT 1")
    fun getAiConfig(): Flow<AiConfigEntity?>

    @Query("SELECT * FROM ai_config WHERE id = 1 LIMIT 1")
    suspend fun getAiConfigSync(): AiConfigEntity?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun saveAiConfig(config: AiConfigEntity)

    // Cohort Groups
    @Query("SELECT * FROM cohort_groups ORDER BY createdAt DESC")
    fun getAllCohorts(): Flow<List<CohortGroupEntity>>

    @Query("SELECT * FROM cohort_groups WHERE code = :code LIMIT 1")
    suspend fun getCohortByCode(code: String): CohortGroupEntity?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertCohort(cohort: CohortGroupEntity)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertCohorts(cohorts: List<CohortGroupEntity>)

    @Query("DELETE FROM cohort_groups WHERE code = :code")
    suspend fun deleteCohort(code: String)

    // Users
    @Query("SELECT * FROM app_users ORDER BY displayName ASC")
    fun getAllUsers(): Flow<List<UserEntity>>

    @Query("SELECT * FROM app_users WHERE id = :userId LIMIT 1")
    suspend fun getUserById(userId: String): UserEntity?

    @Query("SELECT * FROM app_users WHERE email = :email LIMIT 1")
    suspend fun getUserByEmail(email: String): UserEntity?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertUser(user: UserEntity)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertUsers(users: List<UserEntity>)
}
