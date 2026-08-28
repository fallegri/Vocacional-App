package com.example.ui.screens

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
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
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import com.example.data.model.AppUser
import com.example.data.model.AuthProvider
import com.example.data.model.UserRole
import com.example.data.repository.SeedData
import com.example.ui.theme.ColorNvidiaGreen

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AuthDialog(
    currentUser: AppUser,
    allUsers: List<AppUser>,
    onDismiss: () -> Unit,
    onSwitchUser: (AppUser) -> Unit,
    onLoginWithGoogle: (email: String, name: String) -> Unit
) {
    var isCustomGoogleLogin by remember { mutableStateOf(false) }
    var gmailInput by remember { mutableStateOf(if (currentUser.authProvider == AuthProvider.GOOGLE) currentUser.email else "fernando.allegri@gmail.com") }
    var nameInput by remember { mutableStateOf(if (currentUser.authProvider == AuthProvider.GOOGLE) currentUser.displayName else "Fernando Allegri") }

    Dialog(
        onDismissRequest = onDismiss,
        properties = DialogProperties(usePlatformDefaultWidth = false)
    ) {
        Card(
            modifier = Modifier
                .fillMaxWidth(0.92f)
                .padding(vertical = 24.dp)
                .clip(RoundedCornerShape(24.dp))
                .testTag("auth_dialog"),
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .verticalScroll(rememberScrollState())
                    .padding(20.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                // Header
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        Surface(
                            shape = CircleShape,
                            color = MaterialTheme.colorScheme.primaryContainer,
                            modifier = Modifier.size(40.dp)
                        ) {
                            Box(contentAlignment = Alignment.Center) {
                                Icon(
                                    imageVector = Icons.Default.AccountCircle,
                                    contentDescription = null,
                                    tint = MaterialTheme.colorScheme.primary,
                                    modifier = Modifier.size(24.dp)
                                )
                            }
                        }
                        Column {
                            Text(
                                text = "Control de Acceso & Roles",
                                style = MaterialTheme.typography.titleMedium,
                                fontWeight = FontWeight.Bold
                            )
                            Text(
                                text = "OrientApp Multi-Rol & Google Auth",
                                style = MaterialTheme.typography.labelSmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                    }

                    IconButton(onClick = onDismiss) {
                        Icon(Icons.Default.Close, contentDescription = "Cerrar")
                    }
                }

                // Current Active User Banner
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(16.dp),
                    colors = CardDefaults.cardColors(
                        containerColor = currentUser.role.getThemeColor().copy(alpha = 0.12f)
                    ),
                    border = BorderStroke(1.dp, currentUser.role.getThemeColor().copy(alpha = 0.35f))
                ) {
                    Row(
                        modifier = Modifier.padding(14.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        Surface(
                            shape = CircleShape,
                            color = currentUser.role.getThemeColor(),
                            modifier = Modifier.size(44.dp)
                        ) {
                            Box(contentAlignment = Alignment.Center) {
                                Text(
                                    text = currentUser.role.badgeIcon,
                                    fontSize = 20.sp
                                )
                            }
                        }
                        Column(modifier = Modifier.weight(1f)) {
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(6.dp)
                            ) {
                                Text(
                                    text = currentUser.displayName,
                                    fontWeight = FontWeight.Bold,
                                    style = MaterialTheme.typography.titleSmall
                                )
                                if (currentUser.authProvider == AuthProvider.GOOGLE) {
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
                            }
                            Text(
                                text = currentUser.email,
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                            Text(
                                text = "Rol: ${currentUser.role.title} • Cohorte: ${currentUser.cohortCode ?: "Sin asignar"}",
                                fontSize = 11.sp,
                                color = currentUser.role.getThemeColor(),
                                fontWeight = FontWeight.SemiBold
                            )
                        }
                    }
                }

                // Google / Gmail Student Sign-in Section
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(16.dp),
                    colors = CardDefaults.cardColors(
                        containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.4f)
                    ),
                    border = BorderStroke(1.dp, MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.5f))
                ) {
                    Column(
                        modifier = Modifier.padding(16.dp),
                        verticalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            Text(
                                text = "🎓",
                                fontSize = 18.sp
                            )
                            Text(
                                text = "Acceso Estudiante con Gmail",
                                fontWeight = FontWeight.Bold,
                                style = MaterialTheme.typography.titleSmall
                            )
                        }
                        Text(
                            text = "Los estudiantes pueden registrarse o iniciar sesión directamente con su cuenta de Google / Gmail para almacenar su historial psicométrico y recibir tutoría personalizada.",
                            fontSize = 12.sp,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                            lineHeight = 16.sp
                        )

                        if (!isCustomGoogleLogin) {
                            // Official Google-styled button
                            OutlinedButton(
                                onClick = {
                                    onLoginWithGoogle("fernando.allegri@gmail.com", "Fernando Allegri")
                                },
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .height(48.dp)
                                    .testTag("google_login_quick_button"),
                                shape = RoundedCornerShape(12.dp),
                                border = BorderStroke(1.5.dp, Color(0xFF4285F4)),
                                colors = ButtonDefaults.outlinedButtonColors(
                                    containerColor = Color.White,
                                    contentColor = Color(0xFF3C4043)
                                )
                            ) {
                                Row(
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.Center
                                ) {
                                    // Google 'G' Symbol representation
                                    Surface(
                                        shape = CircleShape,
                                        color = Color(0xFF4285F4),
                                        modifier = Modifier.size(20.dp)
                                    ) {
                                        Box(contentAlignment = Alignment.Center) {
                                            Text(
                                                text = "G",
                                                color = Color.White,
                                                fontWeight = FontWeight.Black,
                                                fontSize = 12.sp
                                            )
                                        }
                                    }
                                    Spacer(Modifier.width(10.dp))
                                    Text(
                                        text = "Continuar con Google (fernando.allegri@gmail.com)",
                                        fontWeight = FontWeight.SemiBold,
                                        fontSize = 13.sp,
                                        color = Color(0xFF3C4043)
                                    )
                                }
                            }

                            TextButton(
                                onClick = { isCustomGoogleLogin = true },
                                modifier = Modifier.align(Alignment.CenterHorizontally)
                            ) {
                                Text("Usar otra cuenta de Gmail o registrar nuevo nombre", fontSize = 11.sp)
                            }
                        } else {
                            // Custom Gmail & Name form
                            OutlinedTextField(
                                value = nameInput,
                                onValueChange = { nameInput = it },
                                label = { Text("Nombre y Apellido") },
                                leadingIcon = { Icon(Icons.Default.Person, contentDescription = null) },
                                modifier = Modifier.fillMaxWidth(),
                                singleLine = true
                            )

                            OutlinedTextField(
                                value = gmailInput,
                                onValueChange = { gmailInput = it },
                                label = { Text("Correo Gmail (@gmail.com)") },
                                leadingIcon = { Icon(Icons.Default.Mail, contentDescription = null) },
                                modifier = Modifier.fillMaxWidth(),
                                singleLine = true
                            )

                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.spacedBy(8.dp)
                            ) {
                                TextButton(
                                    onClick = { isCustomGoogleLogin = false },
                                    modifier = Modifier.weight(1f)
                                ) {
                                    Text("Cancelar")
                                }
                                Button(
                                    onClick = {
                                        onLoginWithGoogle(gmailInput, nameInput)
                                    },
                                    modifier = Modifier.weight(1f),
                                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF4285F4))
                                ) {
                                    Text("Ingresar")
                                }
                            }
                        }
                    }
                }

                Divider()

                // Fast Role Switcher (Preconfigured Roles for Demo & Administration)
                Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    Text(
                        text = "Conmutador Rápido de Roles (Demostración & Pruebas)",
                        style = MaterialTheme.typography.titleSmall,
                        fontWeight = FontWeight.Bold
                    )
                    Text(
                        text = "Selecciona un rol para probar las vistas y permisos correspondientes:",
                        fontSize = 12.sp,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )

                    SeedData.DEFAULT_USERS.forEach { user ->
                        val isSelected = currentUser.id == user.id || currentUser.role == user.role
                        Card(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clickable { onSwitchUser(user) }
                                .testTag("role_switch_item_${user.role.name}"),
                            shape = RoundedCornerShape(14.dp),
                            colors = CardDefaults.cardColors(
                                containerColor = if (isSelected)
                                    user.role.getThemeColor().copy(alpha = 0.15f)
                                else
                                    MaterialTheme.colorScheme.surface
                            ),
                            border = BorderStroke(
                                if (isSelected) 2.dp else 1.dp,
                                if (isSelected) user.role.getThemeColor() else MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.5f)
                            )
                        ) {
                            Row(
                                modifier = Modifier.padding(12.dp),
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(12.dp)
                            ) {
                                Surface(
                                    shape = CircleShape,
                                    color = user.role.getThemeColor().copy(alpha = 0.2f),
                                    modifier = Modifier.size(36.dp)
                                ) {
                                    Box(contentAlignment = Alignment.Center) {
                                        Text(text = user.role.badgeIcon, fontSize = 16.sp)
                                    }
                                }
                                Column(modifier = Modifier.weight(1f)) {
                                    Row(
                                        verticalAlignment = Alignment.CenterVertically,
                                        horizontalArrangement = Arrangement.spacedBy(6.dp)
                                    ) {
                                        Text(
                                            text = user.role.title,
                                            fontWeight = FontWeight.Bold,
                                            fontSize = 13.sp,
                                            color = user.role.getThemeColor()
                                        )
                                        if (isSelected) {
                                            Surface(
                                                shape = RoundedCornerShape(4.dp),
                                                color = user.role.getThemeColor()
                                            ) {
                                                Text(
                                                    text = "ACTIVO",
                                                    fontSize = 8.sp,
                                                    color = Color.White,
                                                    fontWeight = FontWeight.Bold,
                                                    modifier = Modifier.padding(horizontal = 4.dp, vertical = 1.dp)
                                                )
                                            }
                                        }
                                    }
                                    Text(
                                        text = user.displayName,
                                        fontSize = 12.sp,
                                        fontWeight = FontWeight.Medium
                                    )
                                    Text(
                                        text = user.role.description,
                                        fontSize = 11.sp,
                                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                                        lineHeight = 14.sp
                                    )
                                }
                                Icon(
                                    imageVector = if (isSelected) Icons.Default.CheckCircle else Icons.Default.RadioButtonUnchecked,
                                    contentDescription = null,
                                    tint = if (isSelected) user.role.getThemeColor() else MaterialTheme.colorScheme.onSurfaceVariant,
                                    modifier = Modifier.size(20.dp)
                                )
                            }
                        }
                    }
                }
            }
        }
    }
}
