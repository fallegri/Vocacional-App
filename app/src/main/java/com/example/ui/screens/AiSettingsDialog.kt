package com.example.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import com.example.data.model.AiConfiguration
import com.example.data.model.AiProviderType
import com.example.ui.theme.ColorNvidiaGreen
import com.example.ui.theme.ColorSuccess
import com.example.ui.theme.ColorWarning

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AiSettingsDialog(
    currentConfig: AiConfiguration,
    isTesting: Boolean,
    testResult: Pair<Boolean, String>?,
    onDismiss: () -> Unit,
    onSave: (AiConfiguration) -> Unit,
    onTestConnection: (AiConfiguration) -> Unit
) {
    var selectedProvider by remember { mutableStateOf(currentConfig.providerType) }
    var baseUrl by remember { mutableStateOf(currentConfig.baseUrl) }
    var apiKey by remember { mutableStateOf(currentConfig.apiKey) }
    var modelName by remember { mutableStateOf(currentConfig.modelName) }
    var showPassword by remember { mutableStateOf(false) }

    Dialog(onDismissRequest = onDismiss) {
        Surface(
            modifier = Modifier
                .fillMaxWidth()
                .wrapContentHeight()
                .testTag("ai_settings_dialog"),
            shape = RoundedCornerShape(24.dp),
            color = MaterialTheme.colorScheme.surface,
            tonalElevation = 6.dp
        ) {
            Column(
                modifier = Modifier
                    .padding(24.dp)
                    .verticalScroll(rememberScrollState()),
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                // Header
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        Surface(
                            shape = RoundedCornerShape(12.dp),
                            color = ColorNvidiaGreen.copy(alpha = 0.15f),
                            modifier = Modifier.size(42.dp)
                        ) {
                            Box(contentAlignment = Alignment.Center) {
                                Icon(
                                    imageVector = Icons.Default.SmartToy,
                                    contentDescription = null,
                                    tint = ColorNvidiaGreen
                                )
                            }
                        }
                        Column {
                            Text(
                                text = "Configuración de IA",
                                style = MaterialTheme.typography.titleLarge,
                                fontWeight = FontWeight.Bold
                            )
                            Text(
                                text = "NVIDIA NIM / OpenAI / Local",
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                    }
                    IconButton(onClick = onDismiss) {
                        Icon(Icons.Default.Close, contentDescription = "Cerrar")
                    }
                }

                Divider()

                // Provider Presets Selector
                Text(
                    text = "Selecciona Proveedor / Entorno:",
                    style = MaterialTheme.typography.labelLarge,
                    fontWeight = FontWeight.SemiBold
                )

                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    AiProviderType.values().forEach { provider ->
                        val isSelected = selectedProvider == provider
                        Card(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clip(RoundedCornerShape(12.dp))
                                .clickable {
                                    selectedProvider = provider
                                    baseUrl = provider.defaultBaseUrl
                                    modelName = provider.defaultModel
                                },
                            colors = CardDefaults.cardColors(
                                containerColor = if (isSelected)
                                    MaterialTheme.colorScheme.primaryContainer.copy(alpha = 0.5f)
                                else
                                    MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.4f)
                            ),
                            border = if (isSelected)
                                androidx.compose.foundation.BorderStroke(1.5.dp, MaterialTheme.colorScheme.primary)
                            else null
                        ) {
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(12.dp),
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(12.dp)
                            ) {
                                RadioButton(
                                    selected = isSelected,
                                    onClick = {
                                        selectedProvider = provider
                                        baseUrl = provider.defaultBaseUrl
                                        modelName = provider.defaultModel
                                    }
                                )
                                Column(modifier = Modifier.weight(1f)) {
                                    Text(
                                        text = provider.displayName,
                                        fontWeight = FontWeight.Bold,
                                        fontSize = 14.sp
                                    )
                                    Text(
                                        text = provider.description,
                                        fontSize = 11.sp,
                                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                                        lineHeight = 14.sp
                                    )
                                }
                            }
                        }
                    }
                }

                // Base URL
                OutlinedTextField(
                    value = baseUrl,
                    onValueChange = { baseUrl = it },
                    label = { Text("Base URL / Endpoint") },
                    placeholder = { Text("https://integrate.api.nvidia.com/v1") },
                    modifier = Modifier.fillMaxWidth().testTag("ai_base_url_input"),
                    leadingIcon = { Icon(Icons.Default.Language, contentDescription = null) },
                    singleLine = true
                )

                // API Key (if required or optional)
                OutlinedTextField(
                    value = apiKey,
                    onValueChange = { apiKey = it },
                    label = {
                        Text(
                            if (selectedProvider.requiresApiKey) "API Key (Requerida)" else "API Key (Opcional en local)"
                        )
                    },
                    placeholder = {
                        Text(
                            if (selectedProvider == AiProviderType.NVIDIA_NIM) "nvapi-..." else "sk-..."
                        )
                    },
                    modifier = Modifier.fillMaxWidth().testTag("ai_api_key_input"),
                    leadingIcon = { Icon(Icons.Default.VpnKey, contentDescription = null) },
                    trailingIcon = {
                        IconButton(onClick = { showPassword = !showPassword }) {
                            Icon(
                                imageVector = if (showPassword) Icons.Default.VisibilityOff else Icons.Default.Visibility,
                                contentDescription = "Mostrar clave"
                            )
                        }
                    },
                    visualTransformation = if (showPassword) VisualTransformation.None else PasswordVisualTransformation(),
                    singleLine = true
                )

                // Model Name
                OutlinedTextField(
                    value = modelName,
                    onValueChange = { modelName = it },
                    label = { Text("Nombre del Modelo") },
                    placeholder = { Text("meta/llama-3.1-70b-instruct") },
                    modifier = Modifier.fillMaxWidth().testTag("ai_model_name_input"),
                    leadingIcon = { Icon(Icons.Default.Memory, contentDescription = null) },
                    singleLine = true
                )

                // Model Suggestion Chips
                if (selectedProvider == AiProviderType.NVIDIA_NIM) {
                    Text(
                        text = "Modelos Populares en NVIDIA NIM:",
                        style = MaterialTheme.typography.labelMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        SuggestionChip(
                            onClick = { modelName = "meta/llama-3.1-70b-instruct" },
                            label = { Text("Llama 3.1 70B", fontSize = 11.sp) }
                        )
                        SuggestionChip(
                            onClick = { modelName = "nvidia/nemotron-4-340b-instruct" },
                            label = { Text("Nemotron 340B", fontSize = 11.sp) }
                        )
                    }
                }

                // Test Connection Status Banner
                if (testResult != null) {
                    val (isSuccess, message) = testResult
                    Surface(
                        shape = RoundedCornerShape(12.dp),
                        color = if (isSuccess) ColorSuccess.copy(alpha = 0.15f) else MaterialTheme.colorScheme.errorContainer,
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Row(
                            modifier = Modifier.padding(12.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            Icon(
                                imageVector = if (isSuccess) Icons.Default.CheckCircle else Icons.Default.Error,
                                contentDescription = null,
                                tint = if (isSuccess) ColorSuccess else MaterialTheme.colorScheme.error
                            )
                            Text(
                                text = message,
                                style = MaterialTheme.typography.bodySmall,
                                color = if (isSuccess) MaterialTheme.colorScheme.onSurface else MaterialTheme.colorScheme.onErrorContainer
                            )
                        }
                    }
                }

                // Action Buttons
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    OutlinedButton(
                        onClick = {
                            val tempConfig = AiConfiguration(
                                providerType = selectedProvider,
                                baseUrl = baseUrl,
                                apiKey = apiKey,
                                modelName = modelName
                            )
                            onTestConnection(tempConfig)
                        },
                        modifier = Modifier.weight(1f).testTag("test_ai_connection_button"),
                        enabled = !isTesting
                    ) {
                        if (isTesting) {
                            CircularProgressIndicator(
                                modifier = Modifier.size(16.dp),
                                strokeWidth = 2.dp
                            )
                            Spacer(Modifier.width(8.dp))
                            Text("Probando...", fontSize = 12.sp)
                        } else {
                            Icon(Icons.Default.Bolt, contentDescription = null, modifier = Modifier.size(16.dp))
                            Spacer(Modifier.width(4.dp))
                            Text("Probar", fontSize = 12.sp)
                        }
                    }

                    Button(
                        onClick = {
                            val updated = AiConfiguration(
                                providerType = selectedProvider,
                                baseUrl = baseUrl.trim(),
                                apiKey = apiKey.trim(),
                                modelName = modelName.trim()
                            )
                            onSave(updated)
                            onDismiss()
                        },
                        modifier = Modifier.weight(1.2f).testTag("save_ai_settings_button")
                    ) {
                        Icon(Icons.Default.Save, contentDescription = null, modifier = Modifier.size(16.dp))
                        Spacer(Modifier.width(4.dp))
                        Text("Guardar", fontSize = 12.sp)
                    }
                }
            }
        }
    }
}
