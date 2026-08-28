package com.example.data.repository

import com.example.data.local.dao.AssessmentDao
import com.example.data.local.entities.AiConfigEntity
import com.example.data.local.entities.AssessmentResponseEntity
import com.example.data.local.entities.AssessmentSessionEntity
import com.example.data.local.entities.CohortGroupEntity
import com.example.data.local.entities.UserEntity
import com.example.data.model.*
import com.example.data.remote.AiService
import com.example.domain.PsychometricEngine
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import java.util.UUID

class AssessmentRepository(
    private val assessmentDao: AssessmentDao,
    private val aiService: AiService = AiService()
) {

    fun getQuestions(): List<AssessmentQuestion> = SeedData.QUESTIONS

    fun getCareers(): List<Career> = SeedData.CAREERS

    fun getAllSessions(): Flow<List<AssessmentSessionEntity>> = assessmentDao.getAllSessions()

    fun getSessionsByCohort(cohortCode: String): Flow<List<AssessmentSessionEntity>> =
        assessmentDao.getSessionsByCohort(cohortCode)

    fun getLatestCompletedSession(): Flow<AssessmentSessionEntity?> =
        assessmentDao.getLatestCompletedSession()

    // Cohorts
    fun getAllCohorts(): Flow<List<CohortGroup>> =
        assessmentDao.getAllCohorts().map { entities ->
            entities.map {
                CohortGroup(
                    code = it.code,
                    title = it.title,
                    institution = it.institution,
                    creatorName = it.creatorName,
                    createdAt = it.createdAt,
                    isActive = it.isActive,
                    description = it.description
                )
            }
        }

    suspend fun createCohort(cohort: CohortGroup) {
        val entity = CohortGroupEntity(
            code = cohort.code.uppercase().trim(),
            title = cohort.title.trim(),
            institution = cohort.institution.trim(),
            creatorName = cohort.creatorName.trim(),
            createdAt = cohort.createdAt,
            isActive = cohort.isActive,
            description = cohort.description.trim()
        )
        assessmentDao.insertCohort(entity)
    }

    suspend fun deleteCohort(code: String) {
        assessmentDao.deleteCohort(code)
    }

    // Users
    fun getAllUsers(): Flow<List<AppUser>> =
        assessmentDao.getAllUsers().map { entities ->
            entities.map {
                val role = try {
                    UserRole.valueOf(it.role)
                } catch (e: Exception) {
                    UserRole.STUDENT
                }
                val provider = try {
                    AuthProvider.valueOf(it.authProvider)
                } catch (e: Exception) {
                    AuthProvider.GOOGLE
                }
                AppUser(
                    id = it.id,
                    email = it.email,
                    displayName = it.displayName,
                    role = role,
                    cohortCode = it.cohortCode,
                    authProvider = provider,
                    institution = it.institution
                )
            }
        }

    suspend fun saveUser(user: AppUser) {
        val entity = UserEntity(
            id = user.id,
            email = user.email,
            displayName = user.displayName,
            role = user.role.name,
            cohortCode = user.cohortCode,
            authProvider = user.authProvider.name,
            institution = user.institution
        )
        assessmentDao.insertUser(entity)
    }

    suspend fun updateReviewerNotes(sessionId: String, notes: String, status: ReviewStatus) {
        assessmentDao.updateReviewerFeedback(sessionId, notes, status.name)
    }

    suspend fun initializeSeedDataIfEmpty() {
        // Insert default cohorts
        val cohorts = SeedData.DEFAULT_COHORTS.map {
            CohortGroupEntity(
                code = it.code,
                title = it.title,
                institution = it.institution,
                creatorName = it.creatorName,
                createdAt = it.createdAt,
                isActive = it.isActive,
                description = it.description
            )
        }
        assessmentDao.insertCohorts(cohorts)

        // Insert default users
        val users = SeedData.DEFAULT_USERS.map {
            UserEntity(
                id = it.id,
                email = it.email,
                displayName = it.displayName,
                role = it.role.name,
                cohortCode = it.cohortCode,
                authProvider = it.authProvider.name,
                institution = it.institution
            )
        }
        assessmentDao.insertUsers(users)
    }

    suspend fun saveAnswer(
        sessionId: String,
        questionId: Int,
        dimension: DimensionCode,
        score: Int,
        timeSpentMs: Long
    ) {
        val entity = AssessmentResponseEntity(
            sessionId = sessionId,
            questionId = questionId,
            dimensionCode = dimension.name,
            score = score,
            timeSpentMs = timeSpentMs
        )
        assessmentDao.insertResponse(entity)
    }

    suspend fun completeAssessment(
        sessionId: String,
        startedAt: Long,
        answers: Map<Int, AssessmentAnswer>,
        currentUser: AppUser?,
        cohortCode: String?
    ): DiagnosticResult {
        val questions = getQuestions()
        val scores = PsychometricEngine.calculateScores(answers, questions)
        val quality = PsychometricEngine.evaluateQuality(answers, questions)
        val dominantCode = scores.getDominantCode(3)
        val dominantSummary = PsychometricEngine.getDominantProfileDescription(dominantCode)
        val careerMatches = PsychometricEngine.matchCareers(scores, getCareers())

        val topMatch = careerMatches.firstOrNull()

        val effectiveCohort = cohortCode ?: currentUser?.cohortCode ?: "UNIV-VOC-2026"
        val effectiveStudentName = currentUser?.displayName ?: "Estudiante OrientApp"
        val effectiveStudentEmail = currentUser?.email ?: "estudiante@gmail.com"

        val sessionEntity = AssessmentSessionEntity(
            id = sessionId,
            startedAt = startedAt,
            completedAt = System.currentTimeMillis(),
            isValid = quality.isValid,
            reliabilityLevel = quality.reliabilityLevel,
            rScore = scores.r,
            iScore = scores.i,
            aScore = scores.a,
            sScore = scores.s,
            eScore = scores.e,
            cScore = scores.c,
            dominantCode = dominantCode,
            dominantSummary = dominantSummary,
            warningMessage = quality.warningMessage,
            topCareerTitle = topMatch?.career?.title,
            topCareerAffinity = topMatch?.affinityPercentage,
            aiAnalysis = null,
            cohortCode = effectiveCohort,
            studentName = effectiveStudentName,
            studentEmail = effectiveStudentEmail,
            reviewerNotes = null,
            reviewStatus = "PENDING"
        )

        assessmentDao.insertSession(sessionEntity)

        return DiagnosticResult(
            sessionId = sessionId,
            timestamp = sessionEntity.completedAt ?: System.currentTimeMillis(),
            scores = scores,
            dominantCode = dominantCode,
            dominantSummary = dominantSummary,
            quality = quality,
            careerMatches = careerMatches,
            aiAnalysis = null
        )
    }

    suspend fun loadDiagnosticResult(session: AssessmentSessionEntity): DiagnosticResult {
        val scores = PsychometricScores(
            r = session.rScore,
            i = session.iScore,
            a = session.aScore,
            s = session.sScore,
            e = session.eScore,
            c = session.cScore
        )
        val careerMatches = PsychometricEngine.matchCareers(scores, getCareers())
        val quality = QualityMetric(
            isValid = session.isValid,
            straightLiningDetected = false,
            averageResponseTimeMs = 2500L,
            speedTrapTriggered = false,
            mirrorConsistencyPercent = if (session.reliabilityLevel == "Alta") 95 else 75,
            reliabilityLevel = session.reliabilityLevel,
            warningMessage = session.warningMessage
        )

        return DiagnosticResult(
            sessionId = session.id,
            timestamp = session.completedAt ?: session.startedAt,
            scores = scores,
            dominantCode = session.dominantCode,
            dominantSummary = session.dominantSummary,
            quality = quality,
            careerMatches = careerMatches,
            aiAnalysis = session.aiAnalysis
        )
    }

    // AI Config Management
    fun getAiConfigFlow(): Flow<AiConfiguration> {
        return assessmentDao.getAiConfig().map { entity ->
            if (entity != null) {
                val pType = try {
                    AiProviderType.valueOf(entity.providerType)
                } catch (e: Exception) {
                    AiProviderType.NVIDIA_NIM
                }
                AiConfiguration(
                    providerType = pType,
                    baseUrl = entity.baseUrl,
                    apiKey = entity.apiKey,
                    modelName = entity.modelName,
                    temperature = entity.temperature
                )
            } else {
                AiConfiguration(
                    providerType = AiProviderType.NVIDIA_NIM,
                    baseUrl = AiProviderType.NVIDIA_NIM.defaultBaseUrl,
                    apiKey = "",
                    modelName = AiProviderType.NVIDIA_NIM.defaultModel
                )
            }
        }
    }

    suspend fun saveAiConfig(config: AiConfiguration) {
        val entity = AiConfigEntity(
            id = 1,
            providerType = config.providerType.name,
            baseUrl = config.baseUrl,
            apiKey = config.apiKey,
            modelName = config.modelName,
            temperature = config.temperature
        )
        assessmentDao.saveAiConfig(entity)
    }

    suspend fun testAiConnection(config: AiConfiguration): Result<String> {
        return aiService.testConnection(config)
    }

    suspend fun generateAiReport(
        config: AiConfiguration,
        result: DiagnosticResult,
        studentName: String? = null
    ): Result<String> {
        if (!config.isConfigured()) {
            val fallback = aiService.buildOfflineFallbackAnalysis(
                result.scores,
                result.dominantCode,
                result.careerMatches
            )
            assessmentDao.updateAiAnalysis(result.sessionId, fallback)
            return Result.success(fallback)
        }

        val aiResult = aiService.generateVocationalReport(
            config = config,
            scores = result.scores,
            dominantCode = result.dominantCode,
            topCareers = result.careerMatches,
            reliabilityLevel = result.quality.reliabilityLevel,
            studentName = studentName
        )

        aiResult.onSuccess { reportText ->
            assessmentDao.updateAiAnalysis(result.sessionId, reportText)
        }

        return aiResult
    }

    suspend fun generateCohortAiSynthesis(
        config: AiConfiguration,
        cohort: CohortGroup,
        sessions: List<AssessmentSessionEntity>
    ): Result<String> {
        if (sessions.isEmpty()) {
            return Result.success("No hay suficientes evaluaciones completadas en la cohorte ${cohort.code} para generar una síntesis estadística grupal.")
        }

        val total = sessions.size
        val avgR = sessions.map { it.rScore }.average().toInt()
        val avgI = sessions.map { it.iScore }.average().toInt()
        val avgA = sessions.map { it.aScore }.average().toInt()
        val avgS = sessions.map { it.sScore }.average().toInt()
        val avgE = sessions.map { it.eScore }.average().toInt()
        val avgC = sessions.map { it.cScore }.average().toInt()

        val dominantDistribution = sessions.groupingBy { it.dominantCode }.eachCount()
        val distSummary = dominantDistribution.entries.sortedByDescending { it.value }
            .take(4).joinToString(", ") { "${it.key} (${it.value} alumnos)" }

        val prompt = """
            Genera un Informe de Auditoría y Síntesis Vocacional Grupal para la cohorte '${cohort.title}' (Código: ${cohort.code}, Institución: ${cohort.institution}).
            Datos agregados del grupo:
            - Total de evaluaciones: $total
            - Perfil Promedio RIASEC: R=$avgR%, I=$avgI%, A=$avgA%, S=$avgS%, E=$avgE%, C=$avgC%
            - Distribución de Códigos Dominantes: $distSummary
            
            Estructura el informe en:
            1. **Resumen Ejecutivo y Tendencia Colectiva del Grupo**
            2. **Análisis de Fortalezas Vocacionales Dominantes del Aula**
            3. **Oportunidades de Formación y Talleres Recomendados para los Orientadores**
            4. **Estrategias Pedagógicas Sugeridas para la Institución**
        """.trimIndent()

        if (!config.isConfigured()) {
            return Result.success(
                """
                📊 **SÍNTESIS VOCACIONAL GRUPAL (Análisis Base)**
                **Cohorte:** ${cohort.title} (${cohort.code})
                **Institución:** ${cohort.institution}
                **Total de Alumnos Evaluados:** $total
                
                **1. Tendencia Colectiva:**
                El promedio general del grupo destaca principalmente en las dimensiones con mayor concentración (R=$avgR%, I=$avgI%, A=$avgA%, S=$avgS%, E=$avgE%, C=$avgC%). La distribución principal muestra preponderancia en los perfiles: $distSummary.
                
                **2. Recomendación para el Gabinete Psicopedagógico:**
                Se recomienda planificar talleres de exploración vocacional específicos para los sectores STEM, Humanidades y Negocios acorde a las inclinaciones mayoritarias observadas.
                
                *(Para un desglose narrativo profundo potenciado por IA avanzada, configura tu API Key de NVIDIA NIM o OpenAI en Ajustes de IA).*
                """.trimIndent()
            )
        }

        val messages = listOf(
            ChatMessageDto("system", "Eres un experto en Psicología Educacional y Auditoría Psicométrica de Grupos Escolares."),
            ChatMessageDto("user", prompt)
        )

        return aiService.completeChat(config, messages)
    }

    suspend fun sendChatMessage(
        config: AiConfiguration,
        conversationHistory: List<ChatMessage>,
        userMessage: String,
        currentDiagnostic: DiagnosticResult?
    ): Result<String> {
        val systemContext = if (currentDiagnostic != null) {
            val top3Careers = currentDiagnostic.careerMatches.take(3).joinToString { "${it.career.title} (${it.affinityPercentage.toInt()}%)" }
            """
                Eres OrientApp AI Tutor, un mentor y orientador vocacional inteligente, empático y experto.
                Estás guiando al estudiante basándote en su perfil psicométrico RIASEC oficial:
                - Código RIASEC Dominante: ${currentDiagnostic.dominantCode}
                - Puntuaciones: R=${currentDiagnostic.scores.r.toInt()}%, I=${currentDiagnostic.scores.i.toInt()}%, A=${currentDiagnostic.scores.a.toInt()}%, S=${currentDiagnostic.scores.s.toInt()}%, E=${currentDiagnostic.scores.e.toInt()}%, C=${currentDiagnostic.scores.c.toInt()}%
                - Carreras afines recomendadas: $top3Careers
                
                Responde de manera concisa, clara, inspiradora y personalizada. Ayuda a comparar carreras, dar consejos de preparación y responder inquietudes vocacionales.
            """.trimIndent()
        } else {
            "Eres OrientApp AI Tutor, un orientador vocacional profesional y empático. Ayudas a estudiantes a descubrir sus pasiones y elegir carreras."
        }

        if (!config.isConfigured()) {
            return Result.success(
                "¡Hola! He recibido tu mensaje: \"$userMessage\".\n\n" +
                "💡 Para habilitar respuestas interactivas generadas por IA de última generación (NVIDIA NIM o OpenAI), abre ⚙️ **Ajustes de IA** en la parte superior y registra tu API Key (por ejemplo de NVIDIA NIM en https://integrate.api.nvidia.com/v1 o OpenAI).\n\n" +
                if (currentDiagnostic != null) "De acuerdo a tu código RIASEC actual (${currentDiagnostic.dominantCode}), te sugiero explorar áreas afines a ${currentDiagnostic.careerMatches.firstOrNull()?.career?.title}." else ""
            )
        }

        val dtos = mutableListOf<ChatMessageDto>()
        dtos.add(ChatMessageDto(role = "system", content = systemContext))

        for (msg in conversationHistory.takeLast(6)) {
            val role = when (msg.sender) {
                MessageSender.USER -> "user"
                MessageSender.AI_TUTOR -> "assistant"
                MessageSender.SYSTEM -> "system"
            }
            dtos.add(ChatMessageDto(role = role, content = msg.text))
        }

        dtos.add(ChatMessageDto(role = "user", content = userMessage))

        return aiService.completeChat(config, dtos)
    }

    suspend fun deleteSession(sessionId: String) {
        assessmentDao.deleteSession(sessionId)
    }
}
