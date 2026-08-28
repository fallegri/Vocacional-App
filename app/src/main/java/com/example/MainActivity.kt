package com.example

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material.icons.outlined.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import com.example.data.local.AppDatabase
import com.example.data.model.UserRole
import com.example.data.repository.AssessmentRepository
import com.example.ui.screens.*
import com.example.ui.theme.ColorNvidiaGreen
import com.example.ui.theme.OrientAppTheme
import com.example.ui.viewmodel.AppScreen
import com.example.ui.viewmodel.OrientAppViewModel
import com.example.ui.viewmodel.UiState

class MainActivity : ComponentActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()

        val database = AppDatabase.getInstance(this)
        val repository = AssessmentRepository(database.assessmentDao())

        setContent {
            OrientAppTheme {
                val viewModel: OrientAppViewModel = viewModel(
                    factory = OrientAppViewModel.provideFactory(repository)
                )
                val uiState by viewModel.uiState.collectAsStateWithLifecycle()

                MainAppScaffold(
                    uiState = uiState,
                    viewModel = viewModel
                )
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MainAppScaffold(
    uiState: UiState,
    viewModel: OrientAppViewModel
) {
    val currentScreen = uiState.currentScreen
    val currentUser = uiState.currentUser

    val snackbarHostState = remember { SnackbarHostState() }

    LaunchedEffect(uiState.statusMessage) {
        uiState.statusMessage?.let { msg ->
            snackbarHostState.showSnackbar(msg)
            viewModel.clearStatusMessage()
        }
    }

    Scaffold(
        modifier = Modifier
            .fillMaxSize()
            .testTag("orient_app_main_scaffold"),
        snackbarHost = { SnackbarHost(snackbarHostState) },
        topBar = {
            if (currentScreen != AppScreen.ASSESSMENT) {
                TopAppBar(
                    title = {
                        Column {
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(8.dp)
                            ) {
                                Icon(
                                    imageVector = Icons.Default.Psychology,
                                    contentDescription = null,
                                    tint = MaterialTheme.colorScheme.primary,
                                    modifier = Modifier.size(24.dp)
                                )
                                Text(
                                    text = "OrientApp",
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 20.sp
                                )
                            }
                            Text(
                                text = "Diagnóstico Psicométrico & IA",
                                style = MaterialTheme.typography.labelSmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                    },
                    actions = {
                        // User Profile Pill (1-Click Google / Role Switcher)
                        Surface(
                            shape = RoundedCornerShape(12.dp),
                            color = currentUser.role.getThemeColor().copy(alpha = 0.15f),
                            modifier = Modifier
                                .clickable { viewModel.setShowAuthDialog(true) }
                                .padding(end = 6.dp)
                                .testTag("top_bar_user_profile_pill")
                        ) {
                            Row(
                                modifier = Modifier.padding(horizontal = 8.dp, vertical = 6.dp),
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(6.dp)
                            ) {
                                Text(text = currentUser.role.badgeIcon, fontSize = 14.sp)
                                Text(
                                    text = currentUser.displayName.take(12),
                                    fontSize = 12.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = currentUser.role.getThemeColor()
                                )
                            }
                        }

                        // AI Provider Button with Status
                        Surface(
                            shape = MaterialTheme.shapes.small,
                            color = if (uiState.aiConfig.isConfigured())
                                ColorNvidiaGreen.copy(alpha = 0.15f)
                            else
                                MaterialTheme.colorScheme.surfaceVariant,
                            modifier = Modifier
                                .padding(end = 8.dp)
                                .testTag("top_bar_ai_config_button")
                        ) {
                            IconButton(
                                onClick = { viewModel.setShowAiSettings(true) }
                            ) {
                                Icon(
                                    imageVector = Icons.Default.SmartToy,
                                    contentDescription = "Configuración de IA",
                                    tint = if (uiState.aiConfig.isConfigured()) ColorNvidiaGreen else MaterialTheme.colorScheme.onSurfaceVariant
                                )
                            }
                        }
                    },
                    colors = TopAppBarDefaults.topAppBarColors(
                        containerColor = MaterialTheme.colorScheme.surface
                    )
                )
            }
        },
        bottomBar = {
            if (currentScreen != AppScreen.ASSESSMENT) {
                NavigationBar(
                    modifier = Modifier.testTag("main_navigation_bar"),
                    tonalElevation = 8.dp
                ) {
                    NavigationBarItem(
                        selected = currentScreen == AppScreen.HOME,
                        onClick = { viewModel.navigateTo(AppScreen.HOME) },
                        icon = {
                            Icon(
                                imageVector = if (currentScreen == AppScreen.HOME) Icons.Filled.Home else Icons.Outlined.Home,
                                contentDescription = "Inicio"
                            )
                        },
                        label = { Text("Inicio", fontSize = 11.sp) },
                        modifier = Modifier.testTag("nav_item_home")
                    )

                    // If Staff, show Admin Dashboard in nav bar
                    if (currentUser.role.isStaff) {
                        NavigationBarItem(
                            selected = currentScreen == AppScreen.ADMIN_DASHBOARD,
                            onClick = { viewModel.navigateTo(AppScreen.ADMIN_DASHBOARD) },
                            icon = {
                                Icon(
                                    imageVector = if (currentScreen == AppScreen.ADMIN_DASHBOARD) Icons.Filled.AdminPanelSettings else Icons.Outlined.AdminPanelSettings,
                                    contentDescription = "Admin",
                                    tint = if (currentScreen == AppScreen.ADMIN_DASHBOARD) currentUser.role.getThemeColor() else MaterialTheme.colorScheme.onSurfaceVariant
                                )
                            },
                            label = { Text(currentUser.role.title.take(8), fontSize = 11.sp) },
                            modifier = Modifier.testTag("nav_item_admin_dashboard")
                        )
                    }

                    NavigationBarItem(
                        selected = currentScreen == AppScreen.RESULTS || currentScreen == AppScreen.ASSESSMENT,
                        onClick = {
                            if (uiState.diagnosticResult != null) {
                                viewModel.navigateTo(AppScreen.RESULTS)
                            } else {
                                viewModel.startNewAssessment()
                            }
                        },
                        icon = {
                            Icon(
                                imageVector = if (currentScreen == AppScreen.RESULTS) Icons.Filled.Assessment else Icons.Outlined.Assessment,
                                contentDescription = "Test"
                            )
                        },
                        label = { Text(if (uiState.diagnosticResult != null) "Resultados" else "Test", fontSize = 11.sp) },
                        modifier = Modifier.testTag("nav_item_test")
                    )

                    NavigationBarItem(
                        selected = currentScreen == AppScreen.CAREERS_EXPLORER,
                        onClick = { viewModel.navigateTo(AppScreen.CAREERS_EXPLORER) },
                        icon = {
                            Icon(
                                imageVector = if (currentScreen == AppScreen.CAREERS_EXPLORER) Icons.Filled.Work else Icons.Outlined.Work,
                                contentDescription = "Carreras"
                            )
                        },
                        label = { Text("Carreras", fontSize = 11.sp) },
                        modifier = Modifier.testTag("nav_item_careers")
                    )

                    NavigationBarItem(
                        selected = currentScreen == AppScreen.AI_TUTOR_CHAT,
                        onClick = { viewModel.navigateTo(AppScreen.AI_TUTOR_CHAT) },
                        icon = {
                            Icon(
                                imageVector = if (currentScreen == AppScreen.AI_TUTOR_CHAT) Icons.Filled.SmartToy else Icons.Outlined.SmartToy,
                                contentDescription = "Tutor IA",
                                tint = if (currentScreen == AppScreen.AI_TUTOR_CHAT) ColorNvidiaGreen else MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        },
                        label = { Text("Tutor IA", fontSize = 11.sp) },
                        modifier = Modifier.testTag("nav_item_ai_chat")
                    )

                    NavigationBarItem(
                        selected = currentScreen == AppScreen.HISTORY,
                        onClick = { viewModel.navigateTo(AppScreen.HISTORY) },
                        icon = {
                            Icon(
                                imageVector = if (currentScreen == AppScreen.HISTORY) Icons.Filled.History else Icons.Outlined.History,
                                contentDescription = "Historial"
                            )
                        },
                        label = { Text("Historial", fontSize = 11.sp) },
                        modifier = Modifier.testTag("nav_item_history")
                    )
                }
            }
        }
    ) { innerPadding ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
        ) {
            when (currentScreen) {
                AppScreen.HOME -> HomeScreen(
                    uiState = uiState,
                    onStartTest = { viewModel.startNewAssessment() },
                    onNavigate = { viewModel.navigateTo(it) },
                    onOpenAiSettings = { viewModel.setShowAiSettings(true) },
                    onOpenAuthDialog = { viewModel.setShowAuthDialog(true) },
                    onOpenCohortSelector = { viewModel.setShowCohortSelectorDialog(true) }
                )

                AppScreen.ADMIN_DASHBOARD -> AdminDashboardScreen(
                    uiState = uiState,
                    onNavigate = { viewModel.navigateTo(it) },
                    onOpenAuthDialog = { viewModel.setShowAuthDialog(true) },
                    onOpenCreateCohort = { viewModel.setShowCreateCohortDialog(true) },
                    onSelectCohortFilter = { code -> viewModel.setCohortFilterForAdmin(code) },
                    onSelectSessionForReview = { session -> viewModel.selectSessionForReview(session) },
                    onLoadSession = { session -> viewModel.loadSessionFromHistory(session) },
                    onGenerateCohortAiReport = { code -> viewModel.generateCohortAiReport(code) },
                    onSaveReviewerNotes = { viewModel.saveReviewerFeedback() },
                    onUpdateNotesDraft = { notes -> viewModel.updateReviewerNotesDraft(notes) },
                    onUpdateStatusDraft = { status -> viewModel.updateReviewerStatusDraft(status) },
                    onDismissReviewDialog = { viewModel.selectSessionForReview(null) }
                )

                AppScreen.ASSESSMENT -> AssessmentScreen(
                    uiState = uiState,
                    onAnswerSelected = { score -> viewModel.recordAnswer(score) },
                    onPreviousClicked = { viewModel.goToPreviousQuestion() },
                    onFinishClicked = { viewModel.finishAssessment() },
                    onExitClicked = { viewModel.navigateTo(AppScreen.HOME) }
                )

                AppScreen.RESULTS -> ResultsScreen(
                    uiState = uiState,
                    onCareerSelected = { match -> viewModel.selectCareerForDetail(match) },
                    onGenerateAiReport = { viewModel.generateAiReport() },
                    onOpenAiChat = { viewModel.navigateTo(AppScreen.AI_TUTOR_CHAT) },
                    onRestartTest = { viewModel.startNewAssessment() },
                    onOpenAiSettings = { viewModel.setShowAiSettings(true) }
                )

                AppScreen.CAREERS_EXPLORER -> CareersExplorerScreen(
                    uiState = uiState,
                    onCareerSelected = { match -> viewModel.selectCareerForDetail(match) }
                )

                AppScreen.AI_TUTOR_CHAT -> AiChatScreen(
                    uiState = uiState,
                    onSendMessage = { text -> viewModel.sendChatMessage(text) },
                    onOpenAiSettings = { viewModel.setShowAiSettings(true) }
                )

                AppScreen.HISTORY -> HistoryScreen(
                    uiState = uiState,
                    onSessionSelected = { session -> viewModel.loadSessionFromHistory(session) },
                    onDeleteSession = { sessionId -> viewModel.deleteSession(sessionId) },
                    onStartNewTest = { viewModel.startNewAssessment() }
                )
            }
        }
    }

    // Modal BottomSheet for Career Detail
    uiState.selectedCareerForDetail?.let { match ->
        CareerDetailSheet(
            match = match,
            userScores = uiState.diagnosticResult?.scores,
            onDismiss = { viewModel.selectCareerForDetail(null) },
            onAskAi = { career -> viewModel.askAiAboutCareer(career) }
        )
    }

    // AI Settings Dialog
    if (uiState.showAiSettingsDialog) {
        AiSettingsDialog(
            currentConfig = uiState.aiConfig,
            isTesting = uiState.isTestingAiConnection,
            testResult = uiState.aiConnectionTestResult,
            onDismiss = { viewModel.setShowAiSettings(false) },
            onSave = { newConfig -> viewModel.updateAiConfig(newConfig) },
            onTestConnection = { tempConfig -> viewModel.testAiConnection(tempConfig) }
        )
    }

    // Auth and Role Switcher Dialog
    if (uiState.showAuthDialog) {
        AuthDialog(
            currentUser = uiState.currentUser,
            allUsers = uiState.allUsers,
            onDismiss = { viewModel.setShowAuthDialog(false) },
            onSwitchUser = { user -> viewModel.switchUser(user) },
            onLoginWithGoogle = { email, name ->
                viewModel.registerOrLoginWithGoogle(email, name)
            }
        )
    }

    // Cohort Selector Dialog
    if (uiState.showCohortSelectorDialog) {
        CohortSelectorDialog(
            currentCohortCode = uiState.selectedCohortCodeForStudent,
            cohorts = uiState.cohorts,
            currentUser = uiState.currentUser,
            onDismiss = { viewModel.setShowCohortSelectorDialog(false) },
            onSelectCohort = { code -> viewModel.setStudentCohortCode(code) },
            onOpenCreateCohort = {
                viewModel.setShowCohortSelectorDialog(false)
                viewModel.setShowCreateCohortDialog(true)
            }
        )
    }

    // Create Cohort Dialog
    if (uiState.showCreateCohortDialog) {
        CreateCohortDialog(
            onDismiss = { viewModel.setShowCreateCohortDialog(false) },
            onCreate = { code, title, institution, description ->
                viewModel.createNewCohort(code, title, institution, description)
            }
        )
    }
}
