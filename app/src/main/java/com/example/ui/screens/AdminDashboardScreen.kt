package com.example.ui.screens

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material.icons.outlined.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import com.example.data.local.entities.AssessmentSessionEntity
import com.example.data.model.AppUser
import com.example.data.model.CohortGroup
import com.example.data.model.ReviewStatus
import com.example.data.model.UserRole
import com.example.ui.theme.ColorNvidiaGreen
import com.example.ui.theme.ColorSuccess
import com.example.ui.theme.ColorWarning
import com.example.ui.viewmodel.AppScreen
import com.example.ui.viewmodel.UiState
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AdminDashboardScreen(
    uiState: UiState,
    onNavigate: (AppScreen) -> Unit,
    onOpenAuthDialog: () -> Unit,
    onOpenCreateCohort: () -> Unit,
    onSelectCohortFilter: (String) -> Unit,
    onSelectSessionForReview: (AssessmentSessionEntity) -> Unit,
    onLoadSession: (AssessmentSessionEntity) -> Unit,
    onGenerateCohortAiReport: (String) -> Unit,
    onSaveReviewerNotes: () -> Unit,
    onUpdateNotesDraft: (String) -> Unit,
    onUpdateStatusDraft: (ReviewStatus) -> Unit,
    onDismissReviewDialog: () -> Unit
) {
    val currentUser = uiState.currentUser
    val userRole = currentUser.role
    var selectedTab by remember { mutableStateOf(0) }
    var searchQuery by remember { mutableStateOf("") }

    val filteredSessions = remember(uiState.historySessions, uiState.selectedCohortFilterForAdmin, searchQuery) {
        uiState.historySessions.filter { session ->
            val matchesCohort = if (uiState.selectedCohortFilterForAdmin == "ALL") true
            else session.cohortCode.equals(uiState.selectedCohortFilterForAdmin, ignoreCase = true)

            val matchesSearch = if (searchQuery.isBlank()) true
            else {
                val q = searchQuery.lowercase()
                (session.studentName?.lowercase()?.contains(q) == true) ||
                (session.studentEmail?.lowercase()?.contains(q) == true) ||
                session.dominantCode.lowercase().contains(q) ||
                session.id.lowercase().contains(q)
            }
            matchesCohort && matchesSearch
        }
    }

    Scaffold(
        topBar = {
            Surface(
                tonalElevation = 2.dp,
                color = MaterialTheme.colorScheme.surface
            ) {
                Column(modifier = Modifier.fillMaxWidth()) {
                    // Header Role Banner
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(horizontal = 16.dp, vertical = 12.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(10.dp)
                        ) {
                            Surface(
                                shape = CircleShape,
                                color = userRole.getThemeColor().copy(alpha = 0.2f),
                                modifier = Modifier.size(42.dp)
                            ) {
                                Box(contentAlignment = Alignment.Center) {
                                    Text(text = userRole.badgeIcon, fontSize = 20.sp)
                                }
                            }
                            Column {
                                Row(
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                                ) {
                                    Text(
                                        text = userRole.title,
                                        fontWeight = FontWeight.Bold,
                                        fontSize = 16.sp,
                                        color = userRole.getThemeColor()
                                    )
                                    Surface(
                                        shape = RoundedCornerShape(4.dp),
                                        color = userRole.getThemeColor()
                                    ) {
                                        Text(
                                            text = "STAFF",
                                            fontSize = 9.sp,
                                            fontWeight = FontWeight.Black,
                                            color = Color.White,
                                            modifier = Modifier.padding(horizontal = 4.dp, vertical = 1.dp)
                                        )
                                    }
                                }
                                Text(
                                    text = currentUser.displayName,
                                    style = MaterialTheme.typography.bodySmall,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                            }
                        }

                        // Switch Profile Button
                        OutlinedButton(
                            onClick = onOpenAuthDialog,
                            shape = RoundedCornerShape(10.dp),
                            contentPadding = PaddingValues(horizontal = 10.dp, vertical = 4.dp),
                            modifier = Modifier.testTag("admin_switch_role_button")
                        ) {
                            Icon(Icons.Default.SwapHoriz, contentDescription = null, modifier = Modifier.size(16.dp))
                            Spacer(Modifier.width(4.dp))
                            Text("Cambiar Rol", fontSize = 12.sp)
                        }
                    }

                    // Admin Module Tabs
                    val tabs = when (userRole) {
                        UserRole.SUPER_ADMIN -> listOf("Evaluaciones & Auditoría", "Gestión de Cohortes", "Síntesis Grupal IA", "Directorio de Usuarios")
                        UserRole.TEST_ADMIN -> listOf("Control Psicométrico & Cohortes", "Monitoreo de Evaluaciones", "Calidad de Reactivos")
                        UserRole.REPORT_REVIEWER -> listOf("Auditoría & Dictámenes", "Síntesis Grupal IA", "Fichas de Estudiantes")
                        UserRole.STUDENT -> listOf("Mis Evaluaciones", "Cohortes Disponibles")
                    }

                    TabRow(
                        selectedTabIndex = selectedTab.coerceIn(0, tabs.size - 1),
                        containerColor = MaterialTheme.colorScheme.surface,
                        contentColor = MaterialTheme.colorScheme.primary,
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        tabs.forEachIndexed { index, tabTitle ->
                            Tab(
                                selected = selectedTab == index,
                                onClick = { selectedTab = index },
                                text = { Text(tabTitle, fontSize = 12.sp, fontWeight = if (selectedTab == index) FontWeight.Bold else FontWeight.Normal) }
                            )
                        }
                    }
                }
            }
        }
    ) { innerPadding ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
                .testTag("admin_dashboard_screen")
        ) {
            when (selectedTab) {
                0 -> EvaluationsAuditTab(
                    sessions = filteredSessions,
                    cohorts = uiState.cohorts,
                    selectedCohort = uiState.selectedCohortFilterForAdmin,
                    searchQuery = searchQuery,
                    onSearchChange = { searchQuery = it },
                    onSelectCohortFilter = onSelectCohortFilter,
                    onReviewSession = onSelectSessionForReview,
                    onViewFullSession = { session ->
                        onLoadSession(session)
                    },
                    onOpenCreateCohort = onOpenCreateCohort,
                    canCreateCohort = userRole == UserRole.SUPER_ADMIN || userRole == UserRole.TEST_ADMIN
                )

                1 -> CohortsManagementTab(
                    cohorts = uiState.cohorts,
                    sessions = uiState.historySessions,
                    onOpenCreateCohort = onOpenCreateCohort,
                    onGenerateAiSummary = { code ->
                        onGenerateCohortAiReport(code)
                    },
                    isSuperAdmin = userRole == UserRole.SUPER_ADMIN
                )

                2 -> GroupAiSynthesisTab(
                    cohorts = uiState.cohorts,
                    sessions = uiState.historySessions,
                    isGenerating = uiState.isGeneratingCohortAiReport,
                    reportResult = uiState.cohortAiReportResult,
                    reportError = uiState.cohortAiReportError,
                    onGenerateAiReport = onGenerateCohortAiReport
                )

                3 -> UsersDirectoryTab(
                    users = uiState.allUsers,
                    onOpenAuthDialog = onOpenAuthDialog
                )
            }
        }
    }

    // Reviewer Feedback Modal Dialog
    uiState.selectedSessionForReview?.let { session ->
        ReviewerFeedbackDialog(
            session = session,
            notesDraft = uiState.reviewerNotesDraft,
            statusDraft = uiState.reviewerStatusDraft,
            onNotesChange = onUpdateNotesDraft,
            onStatusChange = onUpdateStatusDraft,
            onDismiss = onDismissReviewDialog,
            onSave = onSaveReviewerNotes
        )
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun EvaluationsAuditTab(
    sessions: List<AssessmentSessionEntity>,
    cohorts: List<CohortGroup>,
    selectedCohort: String,
    searchQuery: String,
    onSearchChange: (String) -> Unit,
    onSelectCohortFilter: (String) -> Unit,
    onReviewSession: (AssessmentSessionEntity) -> Unit,
    onViewFullSession: (AssessmentSessionEntity) -> Unit,
    onOpenCreateCohort: () -> Unit,
    canCreateCohort: Boolean
) {
    val dateFormat = remember { SimpleDateFormat("dd MMM yyyy, HH:mm", Locale("es", "ES")) }

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp)
    ) {
        // Search & Filter Controls
        item {
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.4f))
            ) {
                Column(
                    modifier = Modifier.padding(14.dp),
                    verticalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    OutlinedTextField(
                        value = searchQuery,
                        onValueChange = onSearchChange,
                        placeholder = { Text("Buscar por estudiante, Gmail o código RIASEC...") },
                        leadingIcon = { Icon(Icons.Default.Search, contentDescription = null) },
                        trailingIcon = {
                            if (searchQuery.isNotEmpty()) {
                                IconButton(onClick = { onSearchChange("") }) {
                                    Icon(Icons.Default.Clear, contentDescription = "Limpiar")
                                }
                            }
                        },
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = true,
                        shape = RoundedCornerShape(12.dp)
                    )

                    // Cohort Filter Chips
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = "Filtrar por Cohorte:",
                            style = MaterialTheme.typography.labelMedium,
                            fontWeight = FontWeight.Bold
                        )
                        if (canCreateCohort) {
                            TextButton(
                                onClick = onOpenCreateCohort,
                                contentPadding = PaddingValues(horizontal = 8.dp, vertical = 2.dp)
                            ) {
                                Icon(Icons.Default.Add, contentDescription = null, modifier = Modifier.size(14.dp))
                                Spacer(Modifier.width(2.dp))
                                Text("Nueva Cohorte", fontSize = 11.sp)
                            }
                        }
                    }

                    LazyRow(
                        horizontalArrangement = Arrangement.spacedBy(6.dp),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        item {
                            FilterChip(
                                selected = selectedCohort == "ALL",
                                onClick = { onSelectCohortFilter("ALL") },
                                label = { Text("Todas (${sessions.size})", fontSize = 11.sp) }
                            )
                        }
                        items(cohorts) { cohort ->
                            FilterChip(
                                selected = selectedCohort == cohort.code,
                                onClick = { onSelectCohortFilter(cohort.code) },
                                label = { Text(cohort.code, fontSize = 11.sp, fontWeight = FontWeight.SemiBold) }
                            )
                        }
                    }
                }
            }
        }

        // Summary Metric Bar
        item {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Surface(
                    shape = RoundedCornerShape(12.dp),
                    color = MaterialTheme.colorScheme.primaryContainer.copy(alpha = 0.5f),
                    modifier = Modifier.weight(1f)
                ) {
                    Column(
                        modifier = Modifier.padding(10.dp),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Text("Evaluaciones", fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                        Text("${sessions.size}", fontWeight = FontWeight.Bold, fontSize = 18.sp)
                    }
                }

                Surface(
                    shape = RoundedCornerShape(12.dp),
                    color = ColorSuccess.copy(alpha = 0.15f),
                    modifier = Modifier.weight(1f)
                ) {
                    Column(
                        modifier = Modifier.padding(10.dp),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        val validCount = sessions.count { it.isValid }
                        Text("Válidas / Alta Confiab.", fontSize = 11.sp, color = ColorSuccess)
                        Text("$validCount", fontWeight = FontWeight.Bold, fontSize = 18.sp, color = ColorSuccess)
                    }
                }

                Surface(
                    shape = RoundedCornerShape(12.dp),
                    color = ColorWarning.copy(alpha = 0.15f),
                    modifier = Modifier.weight(1f)
                ) {
                    Column(
                        modifier = Modifier.padding(10.dp),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        val pendingCount = sessions.count { it.reviewStatus == "PENDING" || it.reviewerNotes.isNullOrBlank() }
                        Text("Pendientes Dictamen", fontSize = 11.sp, color = ColorWarning)
                        Text("$pendingCount", fontWeight = FontWeight.Bold, fontSize = 18.sp, color = ColorWarning)
                    }
                }
            }
        }

        // Students Evaluations List
        if (sessions.isEmpty()) {
            item {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(16.dp),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
                ) {
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(32.dp),
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Icon(Icons.Default.Inbox, contentDescription = null, modifier = Modifier.size(48.dp), tint = MaterialTheme.colorScheme.onSurfaceVariant)
                        Text("No se encontraron evaluaciones con los filtros actuales.", fontWeight = FontWeight.Medium)
                        Text("Realiza un test o selecciona otra cohorte para ver los resultados de los estudiantes.", fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                    }
                }
            }
        } else {
            items(sessions) { session ->
                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .testTag("admin_session_item_${session.id}"),
                    shape = RoundedCornerShape(16.dp),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                    border = BorderStroke(1.dp, MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.4f))
                ) {
                    Column(
                        modifier = Modifier.padding(14.dp),
                        verticalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        // Student Name & Cohort Badge
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.Top
                        ) {
                            Column(modifier = Modifier.weight(1f)) {
                                Row(
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                                ) {
                                    Text(
                                        text = session.studentName ?: "Estudiante OrientApp",
                                        fontWeight = FontWeight.Bold,
                                        style = MaterialTheme.typography.titleMedium
                                    )
                                    Surface(
                                        shape = RoundedCornerShape(4.dp),
                                        color = Color(0xFF4285F4).copy(alpha = 0.15f)
                                    ) {
                                        Text(
                                            text = "GMAIL",
                                            fontSize = 9.sp,
                                            fontWeight = FontWeight.Black,
                                            color = Color(0xFF1967D2),
                                            modifier = Modifier.padding(horizontal = 4.dp, vertical = 1.dp)
                                        )
                                    }
                                }
                                Text(
                                    text = session.studentEmail ?: "fernando.allegri@gmail.com",
                                    fontSize = 12.sp,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                            }

                            Surface(
                                shape = RoundedCornerShape(8.dp),
                                color = MaterialTheme.colorScheme.primary.copy(alpha = 0.12f)
                            ) {
                                Text(
                                    text = session.cohortCode ?: "UNIV-2026",
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 11.sp,
                                    color = MaterialTheme.colorScheme.primary,
                                    modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                                )
                            }
                        }

                        // Holland Code & Reliability Badges
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(8.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Surface(
                                shape = CircleShape,
                                color = MaterialTheme.colorScheme.primary,
                                modifier = Modifier.size(36.dp)
                            ) {
                                Box(contentAlignment = Alignment.Center) {
                                    Text(
                                        text = session.dominantCode,
                                        color = Color.White,
                                        fontWeight = FontWeight.Black,
                                        fontSize = 13.sp
                                    )
                                }
                            }

                            Column(modifier = Modifier.weight(1f)) {
                                Text(
                                    text = "Carrera Top: ${session.topCareerTitle ?: "Ver Informe"}",
                                    fontSize = 13.sp,
                                    fontWeight = FontWeight.SemiBold
                                )
                                Text(
                                    text = "Puntajes: R=${session.rScore.toInt()}% I=${session.iScore.toInt()}% A=${session.aScore.toInt()}% S=${session.sScore.toInt()}% E=${session.eScore.toInt()}% C=${session.cScore.toInt()}%",
                                    fontSize = 11.sp,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                            }

                            // Reliability & Review Status Pill
                            Column(horizontalAlignment = Alignment.End) {
                                Surface(
                                    shape = RoundedCornerShape(6.dp),
                                    color = if (session.isValid) ColorSuccess.copy(alpha = 0.15f) else ColorWarning.copy(alpha = 0.15f)
                                ) {
                                    Text(
                                        text = session.reliabilityLevel,
                                        fontSize = 10.sp,
                                        fontWeight = FontWeight.Bold,
                                        color = if (session.isValid) ColorSuccess else ColorWarning,
                                        modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                                    )
                                }
                                Text(
                                    text = dateFormat.format(Date(session.completedAt ?: session.startedAt)),
                                    fontSize = 10.sp,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                            }
                        }

                        // Reviewer Notes if present
                        if (!session.reviewerNotes.isNullOrBlank()) {
                            Surface(
                                shape = RoundedCornerShape(8.dp),
                                color = MaterialTheme.colorScheme.secondaryContainer.copy(alpha = 0.4f),
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                Row(
                                    modifier = Modifier.padding(8.dp),
                                    verticalAlignment = Alignment.Top,
                                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                                ) {
                                    Icon(Icons.Default.RateReview, contentDescription = null, modifier = Modifier.size(16.dp), tint = MaterialTheme.colorScheme.primary)
                                    Column {
                                        Text(
                                            text = "Dictamen del Revisor (${session.reviewStatus ?: "Aprobado"}):",
                                            fontWeight = FontWeight.Bold,
                                            fontSize = 11.sp
                                        )
                                        Text(
                                            text = session.reviewerNotes,
                                            fontSize = 11.sp,
                                            color = MaterialTheme.colorScheme.onSurface
                                        )
                                    }
                                }
                            }
                        }

                        // Action Buttons
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            OutlinedButton(
                                onClick = { onReviewSession(session) },
                                modifier = Modifier.weight(1f),
                                shape = RoundedCornerShape(10.dp),
                                contentPadding = PaddingValues(horizontal = 8.dp, vertical = 6.dp)
                            ) {
                                Icon(Icons.Default.EditNote, contentDescription = null, modifier = Modifier.size(16.dp))
                                Spacer(Modifier.width(4.dp))
                                Text(if (session.reviewerNotes.isNullOrBlank()) "Añadir Dictamen" else "Editar Dictamen", fontSize = 11.sp)
                            }

                            Button(
                                onClick = { onViewFullSession(session) },
                                modifier = Modifier.weight(1f),
                                shape = RoundedCornerShape(10.dp),
                                contentPadding = PaddingValues(horizontal = 8.dp, vertical = 6.dp)
                            ) {
                                Icon(Icons.Default.Visibility, contentDescription = null, modifier = Modifier.size(16.dp))
                                Spacer(Modifier.width(4.dp))
                                Text("Ver Diagnóstico", fontSize = 11.sp)
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun CohortsManagementTab(
    cohorts: List<CohortGroup>,
    sessions: List<AssessmentSessionEntity>,
    onOpenCreateCohort: () -> Unit,
    onGenerateAiSummary: (String) -> Unit,
    isSuperAdmin: Boolean
) {
    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp)
    ) {
        item {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Text(
                        text = "Cohortes y Códigos Activos",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold
                    )
                    Text(
                        text = "Control institucional para toma de evaluaciones masivas",
                        fontSize = 12.sp,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }

                Button(
                    onClick = onOpenCreateCohort,
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Icon(Icons.Default.Add, contentDescription = null, modifier = Modifier.size(16.dp))
                    Spacer(Modifier.width(4.dp))
                    Text("Crear Cohorte", fontSize = 12.sp)
                }
            }
        }

        items(cohorts) { cohort ->
            val cohortSessions = sessions.filter { it.cohortCode.equals(cohort.code, ignoreCase = true) }
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                border = BorderStroke(1.dp, MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.5f))
            ) {
                Column(
                    modifier = Modifier.padding(16.dp),
                    verticalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Surface(
                            shape = RoundedCornerShape(8.dp),
                            color = MaterialTheme.colorScheme.primaryContainer
                        ) {
                            Text(
                                text = cohort.code,
                                fontWeight = FontWeight.Black,
                                fontSize = 14.sp,
                                color = MaterialTheme.colorScheme.primary,
                                modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp)
                            )
                        }

                        Surface(
                            shape = RoundedCornerShape(6.dp),
                            color = if (cohort.isActive) ColorSuccess.copy(alpha = 0.15f) else Color.Gray.copy(alpha = 0.15f)
                        ) {
                            Text(
                                text = if (cohort.isActive) "ACTIVA" else "CERRADA",
                                fontSize = 10.sp,
                                fontWeight = FontWeight.Bold,
                                color = if (cohort.isActive) ColorSuccess else Color.Gray,
                                modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                            )
                        }
                    }

                    Text(
                        text = cohort.title,
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold
                    )

                    Text(
                        text = "🏛️ ${cohort.institution} • Coordinador: ${cohort.creatorName}",
                        fontSize = 12.sp,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )

                    if (cohort.description.isNotBlank()) {
                        Text(
                            text = cohort.description,
                            fontSize = 12.sp,
                            color = MaterialTheme.colorScheme.onSurface
                        )
                    }

                    Divider()

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = "Alumnos Evaluados: ${cohortSessions.size}",
                            fontWeight = FontWeight.SemiBold,
                            fontSize = 12.sp,
                            color = MaterialTheme.colorScheme.primary
                        )

                        OutlinedButton(
                            onClick = { onGenerateAiSummary(cohort.code) },
                            shape = RoundedCornerShape(10.dp),
                            contentPadding = PaddingValues(horizontal = 10.dp, vertical = 4.dp)
                        ) {
                            Icon(Icons.Default.AutoAwesome, contentDescription = null, tint = ColorNvidiaGreen, modifier = Modifier.size(16.dp))
                            Spacer(Modifier.width(4.dp))
                            Text("Síntesis con IA", fontSize = 11.sp)
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun GroupAiSynthesisTab(
    cohorts: List<CohortGroup>,
    sessions: List<AssessmentSessionEntity>,
    isGenerating: Boolean,
    reportResult: String?,
    reportError: String?,
    onGenerateAiReport: (String) -> Unit
) {
    var selectedCohortCode by remember { mutableStateOf(cohorts.firstOrNull()?.code ?: "ING-2026-A") }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp)
    ) {
        Text(
            text = "Síntesis Psicométrica Grupal con IA",
            style = MaterialTheme.typography.titleMedium,
            fontWeight = FontWeight.Bold
        )
        Text(
            text = "Genera un dictamen global para directivos y gabinete psicopedagógico combinando los vectores RIASEC de toda la cohorte.",
            fontSize = 12.sp,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )

        // Cohort Selector Dropdown
        Card(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(14.dp),
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.4f))
        ) {
            Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                Text("Selecciona la cohorte a auditar:", fontWeight = FontWeight.SemiBold, fontSize = 13.sp)
                LazyRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    items(cohorts) { cohort ->
                        FilterChip(
                            selected = selectedCohortCode == cohort.code,
                            onClick = { selectedCohortCode = cohort.code },
                            label = { Text("${cohort.code} (${cohort.title.take(15)}...)") }
                        )
                    }
                }

                val cohortSessions = sessions.filter { it.cohortCode.equals(selectedCohortCode, ignoreCase = true) }
                Text("Total de diagnósticos en este grupo: ${cohortSessions.size} estudiantes", fontSize = 12.sp, color = MaterialTheme.colorScheme.primary, fontWeight = FontWeight.Bold)

                Button(
                    onClick = { onGenerateAiReport(selectedCohortCode) },
                    enabled = !isGenerating && cohortSessions.isNotEmpty(),
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(12.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = ColorNvidiaGreen)
                ) {
                    if (isGenerating) {
                        CircularProgressIndicator(modifier = Modifier.size(18.dp), color = Color.White, strokeWidth = 2.dp)
                        Spacer(Modifier.width(8.dp))
                        Text("Sintetizando grupo con IA...")
                    } else {
                        Icon(Icons.Default.AutoAwesome, contentDescription = null)
                        Spacer(Modifier.width(8.dp))
                        Text("Generar Dictamen Colectivo con IA")
                    }
                }
            }
        }

        // Display AI Report Result
        if (reportResult != null) {
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                border = BorderStroke(1.5.dp, ColorNvidiaGreen.copy(alpha = 0.6f))
            ) {
                Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Icon(Icons.Default.AutoAwesome, contentDescription = null, tint = ColorNvidiaGreen)
                        Text(
                            text = "Dictamen Grupal Oficial",
                            fontWeight = FontWeight.Bold,
                            style = MaterialTheme.typography.titleMedium
                        )
                    }
                    Divider()
                    Text(
                        text = reportResult,
                        style = MaterialTheme.typography.bodyMedium,
                        lineHeight = 22.sp
                    )
                }
            }
        } else if (reportError != null) {
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(14.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.errorContainer)
            ) {
                Text(
                    text = reportError,
                    color = MaterialTheme.colorScheme.onErrorContainer,
                    modifier = Modifier.padding(14.dp),
                    fontSize = 12.sp
                )
            }
        }
    }
}

@Composable
private fun UsersDirectoryTab(
    users: List<AppUser>,
    onOpenAuthDialog: () -> Unit
) {
    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        item {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Text(
                        text = "Directorio de Usuarios y Roles",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold
                    )
                    Text(
                        text = "Gestión de accesos, revisores y estudiantes con Gmail",
                        fontSize = 12.sp,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
                OutlinedButton(
                    onClick = onOpenAuthDialog,
                    shape = RoundedCornerShape(10.dp)
                ) {
                    Text("Administrar")
                }
            }
        }

        items(users) { user ->
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(14.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                border = BorderStroke(1.dp, user.role.getThemeColor().copy(alpha = 0.3f))
            ) {
                Row(
                    modifier = Modifier.padding(14.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    Surface(
                        shape = CircleShape,
                        color = user.role.getThemeColor().copy(alpha = 0.2f),
                        modifier = Modifier.size(40.dp)
                    ) {
                        Box(contentAlignment = Alignment.Center) {
                            Text(text = user.role.badgeIcon, fontSize = 18.sp)
                        }
                    }

                    Column(modifier = Modifier.weight(1f)) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(6.dp)
                        ) {
                            Text(
                                text = user.displayName,
                                fontWeight = FontWeight.Bold,
                                fontSize = 14.sp
                            )
                            Surface(
                                shape = RoundedCornerShape(4.dp),
                                color = user.role.getThemeColor()
                            ) {
                                Text(
                                    text = user.role.title,
                                    fontSize = 9.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = Color.White,
                                    modifier = Modifier.padding(horizontal = 4.dp, vertical = 1.dp)
                                )
                            }
                        }
                        Text(
                            text = user.email,
                            fontSize = 12.sp,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                        if (!user.cohortCode.isNullOrBlank()) {
                            Text(
                                text = "Cohorte: ${user.cohortCode} • ${user.institution ?: "OrientApp"}",
                                fontSize = 11.sp,
                                color = MaterialTheme.colorScheme.primary
                            )
                        }
                    }
                }
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ReviewerFeedbackDialog(
    session: AssessmentSessionEntity,
    notesDraft: String,
    statusDraft: ReviewStatus,
    onNotesChange: (String) -> Unit,
    onStatusChange: (ReviewStatus) -> Unit,
    onDismiss: () -> Unit,
    onSave: () -> Unit
) {
    Dialog(
        onDismissRequest = onDismiss,
        properties = DialogProperties(usePlatformDefaultWidth = false)
    ) {
        Card(
            modifier = Modifier
                .fillMaxWidth(0.94f)
                .padding(vertical = 24.dp)
                .clip(RoundedCornerShape(24.dp))
                .testTag("reviewer_feedback_dialog"),
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .verticalScroll(rememberScrollState())
                    .padding(20.dp),
                verticalArrangement = Arrangement.spacedBy(14.dp)
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column {
                        Text(
                            text = "Dictamen del Revisor Vocacional",
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold
                        )
                        Text(
                            text = "Estudiante: ${session.studentName ?: "Alumno"} (${session.dominantCode})",
                            style = MaterialTheme.typography.labelSmall,
                            color = MaterialTheme.colorScheme.primary
                        )
                    }
                    IconButton(onClick = onDismiss) {
                        Icon(Icons.Default.Close, contentDescription = "Cerrar")
                    }
                }

                // Summary Pill
                Surface(
                    shape = RoundedCornerShape(12.dp),
                    color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(modifier = Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                        Text("Resumen Psicométrico:", fontWeight = FontWeight.Bold, fontSize = 12.sp)
                        Text("• Código Dominante: ${session.dominantCode} - ${session.dominantSummary}", fontSize = 11.sp)
                        Text("• Carrera sugerida: ${session.topCareerTitle ?: "N/A"}", fontSize = 11.sp)
                        Text("• Nivel de confiabilidad: ${session.reliabilityLevel}", fontSize = 11.sp)
                    }
                }

                // Status Selector
                Text("Estado de la Auditoría:", fontWeight = FontWeight.SemiBold, fontSize = 12.sp)
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    ReviewStatus.values().forEach { status ->
                        FilterChip(
                            selected = statusDraft == status,
                            onClick = { onStatusChange(status) },
                            label = { Text(status.displayName, fontSize = 10.sp) }
                        )
                    }
                }

                // Notes input
                OutlinedTextField(
                    value = notesDraft,
                    onValueChange = onNotesChange,
                    label = { Text("Observaciones y Recomendaciones del Gabinete") },
                    placeholder = { Text("Escribe aquí el dictamen psicopedagógico, fortalezas observadas y pautas de orientación...") },
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(130.dp),
                    maxLines = 6
                )

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    TextButton(
                        onClick = onDismiss,
                        modifier = Modifier.weight(1f)
                    ) {
                        Text("Cancelar")
                    }

                    Button(
                        onClick = onSave,
                        modifier = Modifier.weight(1f),
                        shape = RoundedCornerShape(12.dp)
                    ) {
                        Text("Guardar Dictamen")
                    }
                }
            }
        }
    }
}
