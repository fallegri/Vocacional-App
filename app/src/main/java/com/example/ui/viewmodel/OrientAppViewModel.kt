package com.example.ui.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import com.example.data.local.entities.AssessmentSessionEntity
import com.example.data.model.*
import com.example.data.repository.AssessmentRepository
import com.example.data.repository.SeedData
import kotlinx.coroutines.Job
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import java.util.UUID

enum class AppScreen {
    HOME,
    ASSESSMENT,
    RESULTS,
    CAREERS_EXPLORER,
    AI_TUTOR_CHAT,
    HISTORY,
    ADMIN_DASHBOARD
}

data class UiState(
    val currentScreen: AppScreen = AppScreen.HOME,
    val questions: List<AssessmentQuestion> = emptyList(),
    val currentQuestionIndex: Int = 0,
    val answers: Map<Int, AssessmentAnswer> = emptyMap(),
    val currentSessionId: String = UUID.randomUUID().toString(),
    val sessionStartTime: Long = System.currentTimeMillis(),
    val currentQuestionStartTime: Long = System.currentTimeMillis(),
    val diagnosticResult: DiagnosticResult? = null,
    val selectedCareerForDetail: CareerMatch? = null,
    val aiConfig: AiConfiguration = AiConfiguration(),
    val isTestingAiConnection: Boolean = false,
    val aiConnectionTestResult: Pair<Boolean, String>? = null,
    val isGeneratingAiReport: Boolean = false,
    val aiReportError: String? = null,
    val chatMessages: List<ChatMessage> = emptyList(),
    val isSendingChatMessage: Boolean = false,
    val historySessions: List<AssessmentSessionEntity> = emptyList(),
    val showAiSettingsDialog: Boolean = false,
    // Users & Roles
    val currentUser: AppUser = SeedData.DEFAULT_USERS.last(), // Student with Gmail fernando.allegri@gmail.com
    val allUsers: List<AppUser> = SeedData.DEFAULT_USERS,
    val cohorts: List<CohortGroup> = SeedData.DEFAULT_COHORTS,
    val selectedCohortCodeForStudent: String = "ING-2026-A",
    val selectedCohortFilterForAdmin: String = "ALL",
    val showAuthDialog: Boolean = false,
    val showCohortSelectorDialog: Boolean = false,
    val showCreateCohortDialog: Boolean = false,
    val selectedSessionForReview: AssessmentSessionEntity? = null,
    val reviewerNotesDraft: String = "",
    val reviewerStatusDraft: ReviewStatus = ReviewStatus.APPROVED,
    val isGeneratingCohortAiReport: Boolean = false,
    val cohortAiReportResult: String? = null,
    val cohortAiReportError: String? = null,
    val statusMessage: String? = null
)

class OrientAppViewModel(
    private val repository: AssessmentRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(UiState())
    val uiState: StateFlow<UiState> = _uiState.asStateFlow()

    private var aiChatJob: Job? = null

    init {
        val questions = repository.getQuestions()
        _uiState.update { it.copy(questions = questions) }

        // Initialize seed data if empty
        viewModelScope.launch {
            repository.initializeSeedDataIfEmpty()
        }

        // Observe AI Config
        viewModelScope.launch {
            repository.getAiConfigFlow().collect { config ->
                _uiState.update { it.copy(aiConfig = config) }
            }
        }

        // Observe Historical sessions
        viewModelScope.launch {
            repository.getAllSessions().collect { sessions ->
                _uiState.update { it.copy(historySessions = sessions) }
            }
        }

        // Observe Cohorts
        viewModelScope.launch {
            repository.getAllCohorts().collect { cohorts ->
                if (cohorts.isNotEmpty()) {
                    _uiState.update { it.copy(cohorts = cohorts) }
                }
            }
        }

        // Observe Users
        viewModelScope.launch {
            repository.getAllUsers().collect { users ->
                if (users.isNotEmpty()) {
                    _uiState.update { it.copy(allUsers = users) }
                }
            }
        }

        // Initialize welcome message for AI Chat
        _uiState.update {
            it.copy(
                chatMessages = listOf(
                    ChatMessage(
                        sender = MessageSender.AI_TUTOR,
                        text = "¡Hola! Soy tu Asesor Vocacional de OrientApp con IA. Puedes preguntarme sobre tus afinidades profesionales, comparar carreras, o pedirme consejos sobre tu perfil RIASEC. ¿En qué puedo orientarte hoy?"
                    )
                )
            )
        }
    }

    fun navigateTo(screen: AppScreen) {
        _uiState.update { it.copy(currentScreen = screen) }
    }

    fun setShowAiSettings(show: Boolean) {
        _uiState.update {
            it.copy(
                showAiSettingsDialog = show,
                aiConnectionTestResult = null
            )
        }
    }

    fun setShowAuthDialog(show: Boolean) {
        _uiState.update { it.copy(showAuthDialog = show) }
    }

    fun setShowCohortSelectorDialog(show: Boolean) {
        _uiState.update { it.copy(showCohortSelectorDialog = show) }
    }

    fun setShowCreateCohortDialog(show: Boolean) {
        _uiState.update { it.copy(showCreateCohortDialog = show) }
    }

    fun switchUser(user: AppUser) {
        _uiState.update {
            it.copy(
                currentUser = user,
                selectedCohortCodeForStudent = user.cohortCode ?: it.selectedCohortCodeForStudent,
                showAuthDialog = false,
                statusMessage = "Sesión iniciada como: ${user.displayName} (${user.role.title})"
            )
        }
        viewModelScope.launch {
            repository.saveUser(user)
        }
    }

    fun registerOrLoginWithGoogle(email: String, displayName: String, cohortCode: String? = null) {
        val cleanEmail = if (email.isBlank()) "fernando.allegri@gmail.com" else email.trim()
        val cleanName = if (displayName.isBlank()) cleanEmail.substringBefore("@").replace(".", " ").capitalizeWords() else displayName.trim()
        val effectiveCohort = cohortCode ?: _uiState.value.selectedCohortCodeForStudent

        val newUser = AppUser(
            id = "user_${UUID.randomUUID().toString().take(8)}",
            email = cleanEmail,
            displayName = cleanName,
            role = UserRole.STUDENT,
            cohortCode = effectiveCohort,
            authProvider = AuthProvider.GOOGLE,
            institution = "Google Workspace User"
        )

        _uiState.update {
            it.copy(
                currentUser = newUser,
                selectedCohortCodeForStudent = effectiveCohort,
                showAuthDialog = false,
                statusMessage = "¡Bienvenido/a con Google: $cleanName!"
            )
        }

        viewModelScope.launch {
            repository.saveUser(newUser)
        }
    }

    fun setStudentCohortCode(code: String) {
        val cleanCode = code.uppercase().trim()
        _uiState.update {
            it.copy(
                selectedCohortCodeForStudent = cleanCode,
                currentUser = it.currentUser.copy(cohortCode = cleanCode),
                showCohortSelectorDialog = false,
                statusMessage = "Código de cohorte asignado: $cleanCode"
            )
        }
        viewModelScope.launch {
            repository.saveUser(_uiState.value.currentUser)
        }
    }

    fun createNewCohort(code: String, title: String, institution: String, description: String) {
        if (code.isBlank() || title.isBlank()) return
        val newCohort = CohortGroup(
            code = code.uppercase().trim(),
            title = title.trim(),
            institution = if (institution.isBlank()) "Institución Educativa" else institution.trim(),
            creatorName = _uiState.value.currentUser.displayName,
            createdAt = System.currentTimeMillis(),
            isActive = true,
            description = description.trim()
        )

        viewModelScope.launch {
            repository.createCohort(newCohort)
            _uiState.update {
                it.copy(
                    showCreateCohortDialog = false,
                    statusMessage = "Cohorte ${newCohort.code} creada con éxito."
                )
            }
        }
    }

    fun deleteCohort(code: String) {
        viewModelScope.launch {
            repository.deleteCohort(code)
            _uiState.update {
                it.copy(statusMessage = "Cohorte $code eliminada.")
            }
        }
    }

    fun setCohortFilterForAdmin(cohortCode: String) {
        _uiState.update { it.copy(selectedCohortFilterForAdmin = cohortCode) }
    }

    fun selectSessionForReview(session: AssessmentSessionEntity?) {
        _uiState.update {
            it.copy(
                selectedSessionForReview = session,
                reviewerNotesDraft = session?.reviewerNotes ?: "",
                reviewerStatusDraft = try {
                    ReviewStatus.valueOf(session?.reviewStatus ?: "APPROVED")
                } catch (e: Exception) {
                    ReviewStatus.APPROVED
                }
            )
        }
    }

    fun updateReviewerNotesDraft(notes: String) {
        _uiState.update { it.copy(reviewerNotesDraft = notes) }
    }

    fun updateReviewerStatusDraft(status: ReviewStatus) {
        _uiState.update { it.copy(reviewerStatusDraft = status) }
    }

    fun saveReviewerFeedback() {
        val session = _uiState.value.selectedSessionForReview ?: return
        val notes = _uiState.value.reviewerNotesDraft
        val status = _uiState.value.reviewerStatusDraft

        viewModelScope.launch {
            repository.updateReviewerNotes(session.id, notes, status)
            _uiState.update {
                it.copy(
                    selectedSessionForReview = null,
                    statusMessage = "Dictamen del orientador guardado con éxito."
                )
            }
        }
    }

    fun generateCohortAiReport(cohortCode: String) {
        val cohort = _uiState.value.cohorts.firstOrNull { it.code == cohortCode } ?: return
        val sessions = _uiState.value.historySessions.filter { it.cohortCode == cohortCode }

        viewModelScope.launch {
            _uiState.update {
                it.copy(
                    isGeneratingCohortAiReport = true,
                    cohortAiReportError = null,
                    cohortAiReportResult = null
                )
            }

            val result = repository.generateCohortAiSynthesis(
                config = _uiState.value.aiConfig,
                cohort = cohort,
                sessions = sessions
            )

            result.fold(
                onSuccess = { report ->
                    _uiState.update {
                        it.copy(
                            isGeneratingCohortAiReport = false,
                            cohortAiReportResult = report
                        )
                    }
                },
                onFailure = { error ->
                    _uiState.update {
                        it.copy(
                            isGeneratingCohortAiReport = false,
                            cohortAiReportError = "Error al sintetizar cohorte: ${error.message}"
                        )
                    }
                }
            )
        }
    }

    fun startNewAssessment() {
        val newSessionId = UUID.randomUUID().toString()
        val now = System.currentTimeMillis()
        _uiState.update {
            it.copy(
                currentSessionId = newSessionId,
                sessionStartTime = now,
                currentQuestionIndex = 0,
                answers = emptyMap(),
                currentQuestionStartTime = now,
                currentScreen = AppScreen.ASSESSMENT,
                diagnosticResult = null
            )
        }
    }

    fun recordAnswer(score: Int) {
        val state = _uiState.value
        val questions = state.questions
        if (state.currentQuestionIndex !in questions.indices) return

        val currentQ = questions[state.currentQuestionIndex]
        val timeSpent = System.currentTimeMillis() - state.currentQuestionStartTime

        val answer = AssessmentAnswer(
            questionId = currentQ.id,
            dimension = currentQ.dimension,
            score = score,
            timeSpentMs = timeSpent
        )

        val updatedAnswers = state.answers + (currentQ.id to answer)

        viewModelScope.launch {
            repository.saveAnswer(
                sessionId = state.currentSessionId,
                questionId = currentQ.id,
                dimension = currentQ.dimension,
                score = score,
                timeSpentMs = timeSpent
            )
        }

        // If not last question, move next
        if (state.currentQuestionIndex < questions.size - 1) {
            _uiState.update {
                it.copy(
                    answers = updatedAnswers,
                    currentQuestionIndex = it.currentQuestionIndex + 1,
                    currentQuestionStartTime = System.currentTimeMillis()
                )
            }
        } else {
            // Complete assessment!
            _uiState.update { it.copy(answers = updatedAnswers) }
            finishAssessment()
        }
    }

    fun goToPreviousQuestion() {
        val state = _uiState.value
        if (state.currentQuestionIndex > 0) {
            _uiState.update {
                it.copy(
                    currentQuestionIndex = it.currentQuestionIndex - 1,
                    currentQuestionStartTime = System.currentTimeMillis()
                )
            }
        }
    }

    fun finishAssessment() {
        val state = _uiState.value
        viewModelScope.launch {
            val result = repository.completeAssessment(
                sessionId = state.currentSessionId,
                startedAt = state.sessionStartTime,
                answers = state.answers,
                currentUser = state.currentUser,
                cohortCode = state.selectedCohortCodeForStudent
            )
            _uiState.update {
                it.copy(
                    diagnosticResult = result,
                    currentScreen = AppScreen.RESULTS
                )
            }
            // Auto generate initial report or fallback
            generateAiReport(result)
        }
    }

    fun loadSessionFromHistory(session: AssessmentSessionEntity) {
        viewModelScope.launch {
            val result = repository.loadDiagnosticResult(session)
            _uiState.update {
                it.copy(
                    diagnosticResult = result,
                    currentScreen = AppScreen.RESULTS
                )
            }
        }
    }

    fun selectCareerForDetail(match: CareerMatch?) {
        _uiState.update { it.copy(selectedCareerForDetail = match) }
    }

    fun updateAiConfig(newConfig: AiConfiguration) {
        viewModelScope.launch {
            repository.saveAiConfig(newConfig)
            _uiState.update { it.copy(aiConfig = newConfig) }
        }
    }

    fun testAiConnection(config: AiConfiguration) {
        viewModelScope.launch {
            _uiState.update { it.copy(isTestingAiConnection = true, aiConnectionTestResult = null) }
            val result = repository.testAiConnection(config)
            result.fold(
                onSuccess = { responseText ->
                    _uiState.update {
                        it.copy(
                            isTestingAiConnection = false,
                            aiConnectionTestResult = true to "¡Conexión verificada con éxito!\nRespuesta: $responseText"
                        )
                    }
                },
                onFailure = { error ->
                    _uiState.update {
                        it.copy(
                            isTestingAiConnection = false,
                            aiConnectionTestResult = false to (error.message ?: "Error al conectar con la API")
                        )
                    }
                }
            )
        }
    }

    fun generateAiReport(resultOverride: DiagnosticResult? = null) {
        val diagnostic = resultOverride ?: _uiState.value.diagnosticResult ?: return
        val config = _uiState.value.aiConfig
        val studentName = _uiState.value.currentUser.displayName

        viewModelScope.launch {
            _uiState.update { it.copy(isGeneratingAiReport = true, aiReportError = null) }
            val result = repository.generateAiReport(config, diagnostic, studentName)
            result.fold(
                onSuccess = { reportText ->
                    _uiState.update { current ->
                        current.copy(
                            isGeneratingAiReport = false,
                            diagnosticResult = current.diagnosticResult?.copy(aiAnalysis = reportText)
                        )
                    }
                },
                onFailure = { error ->
                    _uiState.update {
                        it.copy(
                            isGeneratingAiReport = false,
                            aiReportError = "No se pudo generar el informe con IA: ${error.localizedMessage}"
                        )
                    }
                }
            )
        }
    }

    fun sendChatMessage(userText: String) {
        if (userText.isBlank()) return
        val userMsg = ChatMessage(sender = MessageSender.USER, text = userText.trim())
        val updatedList = _uiState.value.chatMessages + userMsg

        _uiState.update {
            it.copy(
                chatMessages = updatedList,
                isSendingChatMessage = true
            )
        }

        aiChatJob?.cancel()
        aiChatJob = viewModelScope.launch {
            val result = repository.sendChatMessage(
                config = _uiState.value.aiConfig,
                conversationHistory = updatedList,
                userMessage = userText,
                currentDiagnostic = _uiState.value.diagnosticResult
            )

            result.fold(
                onSuccess = { reply ->
                    _uiState.update {
                        it.copy(
                            chatMessages = it.chatMessages + ChatMessage(sender = MessageSender.AI_TUTOR, text = reply),
                            isSendingChatMessage = false
                        )
                    }
                },
                onFailure = { err ->
                    _uiState.update {
                        it.copy(
                            chatMessages = it.chatMessages + ChatMessage(
                                sender = MessageSender.AI_TUTOR,
                                text = "⚠️ No pude procesar tu mensaje: ${err.message}. Verifica tu API Key en Ajustes de IA.",
                                isError = true
                            ),
                            isSendingChatMessage = false
                        )
                    }
                }
            )
        }
    }

    fun askAiAboutCareer(career: Career) {
        val prompt = "¿Podrías darme un desglose detallado de la carrera '${career.title}' (${career.areaName}), cómo se alinea con mi perfil y qué consejos de estudio o habilidades clave me recomiendas?"
        selectCareerForDetail(null)
        navigateTo(AppScreen.AI_TUTOR_CHAT)
        sendChatMessage(prompt)
    }

    fun deleteSession(sessionId: String) {
        viewModelScope.launch {
            repository.deleteSession(sessionId)
            if (_uiState.value.diagnosticResult?.sessionId == sessionId) {
                _uiState.update { it.copy(diagnosticResult = null, currentScreen = AppScreen.HOME) }
            }
        }
    }

    fun clearStatusMessage() {
        _uiState.update { it.copy(statusMessage = null) }
    }

    private fun String.capitalizeWords(): String =
        split(" ").joinToString(" ") { word -> word.replaceFirstChar { if (it.isLowerCase()) it.titlecase() else it.toString() } }

    companion object {
        fun provideFactory(repository: AssessmentRepository): ViewModelProvider.Factory =
            object : ViewModelProvider.Factory {
                @Suppress("UNCHECKED_CAST")
                override fun <T : ViewModel> create(modelClass: Class<T>): T {
                    return OrientAppViewModel(repository) as T
                }
            }
    }
}
