package com.example.data.model

import androidx.compose.ui.graphics.Color
import com.example.ui.theme.ColorNvidiaGreen
import com.example.ui.theme.ColorSuccess
import com.example.ui.theme.ColorWarning

enum class UserRole(
    val title: String,
    val description: String,
    val badgeIcon: String,
    val isStaff: Boolean
) {
    SUPER_ADMIN(
        title = "Admin Principal",
        description = "Acceso total al sistema, auditoría global, gestión de instituciones y configuración de IA",
        badgeIcon = "👑",
        isStaff = true
    ),
    TEST_ADMIN(
        title = "Admin de Test",
        description = "Coordinador de evaluaciones, creación de códigos de cohorte y control de calidad psicométrica",
        badgeIcon = "📋",
        isStaff = true
    ),
    REPORT_REVIEWER(
        title = "Revisor de Reportes",
        description = "Orientador y psicólogo vocacional, auditor de informes de estudiantes y dictamen pedagógico",
        badgeIcon = "🔍",
        isStaff = true
    ),
    STUDENT(
        title = "Estudiante",
        description = "Toma de diagnósticos vocacionales RIASEC, acceso a resultados y Tutor IA personalizado",
        badgeIcon = "🎓",
        isStaff = false
    );

    fun getThemeColor(): Color = when (this) {
        SUPER_ADMIN -> Color(0xFF673AB7) // Deep Purple
        TEST_ADMIN -> Color(0xFF0288D1)  // Light Blue
        REPORT_REVIEWER -> Color(0xFF00897B) // Teal
        STUDENT -> ColorNvidiaGreen
    }
}

enum class AuthProvider(val displayName: String) {
    GOOGLE("Google / Gmail"),
    EMAIL("Correo Institucional"),
    GUEST("Acceso Invitado")
}

data class AppUser(
    val id: String,
    val email: String,
    val displayName: String,
    val role: UserRole,
    val cohortCode: String? = null,
    val avatarUrl: String? = null,
    val authProvider: AuthProvider = AuthProvider.GOOGLE,
    val institution: String? = null
)

data class CohortGroup(
    val code: String,
    val title: String,
    val institution: String,
    val creatorName: String,
    val createdAt: Long = System.currentTimeMillis(),
    val isActive: Boolean = true,
    val description: String = ""
)

data class ReviewerFeedback(
    val sessionId: String,
    val reviewerName: String,
    val reviewerRole: String = "Revisor Vocacional",
    val notes: String,
    val status: ReviewStatus = ReviewStatus.PENDING,
    val updatedAt: Long = System.currentTimeMillis()
)

enum class ReviewStatus(val displayName: String) {
    PENDING("Pendiente de Revisión"),
    IN_REVIEW("En Auditoría"),
    APPROVED("Dictamen Aprobado"),
    NEEDS_FOLLOWUP("Requiere Entrevista")
}
