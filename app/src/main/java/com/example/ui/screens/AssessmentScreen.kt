package com.example.ui.screens

import androidx.compose.animation.*
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
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.data.model.AssessmentQuestion
import com.example.data.model.DimensionCode
import com.example.ui.viewmodel.UiState

@Composable
fun AssessmentScreen(
    uiState: UiState,
    onAnswerSelected: (Int) -> Unit,
    onPreviousClicked: () -> Unit,
    onFinishClicked: () -> Unit,
    onExitClicked: () -> Unit
) {
    val questions = uiState.questions
    val currentIndex = uiState.currentQuestionIndex
    val totalCount = questions.size
    val currentQuestion = questions.getOrNull(currentIndex) ?: return
    val selectedScore = uiState.answers[currentQuestion.id]?.score

    val progress = (currentIndex + 1).toFloat() / totalCount.toFloat()
    val dimension = currentQuestion.dimension
    val dimColor = dimension.getColor()

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(horizontal = 16.dp, vertical = 8.dp)
            .testTag("assessment_screen"),
        verticalArrangement = Arrangement.SpaceBetween
    ) {
        // Top Header & Progress Bar
        Column(
            modifier = Modifier.fillMaxWidth(),
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                IconButton(onClick = onExitClicked) {
                    Icon(Icons.Default.Close, contentDescription = "Salir del test")
                }

                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    Surface(
                        shape = RoundedCornerShape(8.dp),
                        color = dimColor.copy(alpha = 0.15f)
                    ) {
                        Text(
                            text = "Dimensión ${dimension.name} (${dimension.title})",
                            color = dimColor,
                            fontWeight = FontWeight.Bold,
                            fontSize = 12.sp,
                            modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp)
                        )
                    }
                }

                Text(
                    text = "${currentIndex + 1} / $totalCount",
                    fontWeight = FontWeight.Bold,
                    fontSize = 14.sp,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }

            // Progress Bar
            LinearProgressIndicator(
                progress = { progress },
                modifier = Modifier
                    .fillMaxWidth()
                    .height(8.dp)
                    .clip(RoundedCornerShape(4.dp)),
                color = dimColor,
                trackColor = MaterialTheme.colorScheme.surfaceVariant
            )

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "Alumno: ${uiState.currentUser.displayName} • Cohorte: ${uiState.selectedCohortCodeForStudent}",
                    fontSize = 11.sp,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    fontWeight = FontWeight.Medium
                )
                Text(
                    text = "${(progress * 100).toInt()}% • Guardado",
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Bold,
                    color = dimColor
                )
            }
        }

        // Center Question Card with animation
        AnimatedContent(
            targetState = currentQuestion,
            transitionSpec = {
                slideInHorizontally { width -> width } + fadeIn() togetherWith
                        slideOutHorizontally { width -> -width } + fadeOut()
            },
            modifier = Modifier.weight(1f),
            label = "question_transition"
        ) { targetQ ->
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .verticalScroll(rememberScrollState())
                    .padding(vertical = 12.dp),
                verticalArrangement = Arrangement.Center,
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(24.dp)),
                    colors = CardDefaults.cardColors(
                        containerColor = MaterialTheme.colorScheme.surface
                    ),
                    border = BorderStroke(1.dp, MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.4f)),
                    elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
                ) {
                    Column(
                        modifier = Modifier.padding(24.dp),
                        verticalArrangement = Arrangement.spacedBy(18.dp),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Surface(
                            shape = CircleShape,
                            color = targetQ.dimension.getColor().copy(alpha = 0.15f),
                            modifier = Modifier.size(52.dp)
                        ) {
                            Box(contentAlignment = Alignment.Center) {
                                Text(
                                    text = targetQ.dimension.name,
                                    color = targetQ.dimension.getColor(),
                                    fontWeight = FontWeight.Black,
                                    fontSize = 22.sp
                                )
                            }
                        }

                        Text(
                            text = "¿Qué tan interesado o identificado te sientes con la siguiente actividad?",
                            style = MaterialTheme.typography.labelMedium,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                            textAlign = TextAlign.Center
                        )

                        Text(
                            text = "\"${targetQ.text}\"",
                            style = MaterialTheme.typography.headlineSmall,
                            fontWeight = FontWeight.Bold,
                            textAlign = TextAlign.Center,
                            lineHeight = 28.sp,
                            modifier = Modifier.testTag("question_text_${targetQ.id}")
                        )
                    }
                }

                Spacer(Modifier.height(20.dp))

                // Likert 5-Option Selector (Vertical Cards with clear semantic labels)
                Text(
                    text = "Selecciona una opción:",
                    style = MaterialTheme.typography.labelLarge,
                    fontWeight = FontWeight.SemiBold,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )

                Spacer(Modifier.height(10.dp))

                val likertOptions = listOf(
                    1 to "1 • Nada interesado / En desacuerdo",
                    2 to "2 • Poco interesado",
                    3 to "3 • Indiferente / Neutral",
                    4 to "4 • Interesado / De acuerdo",
                    5 to "5 • Muy interesado / Totalmente de acuerdo"
                )

                Column(
                    modifier = Modifier.fillMaxWidth(),
                    verticalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    likertOptions.forEach { (scoreValue, label) ->
                        val isSelected = selectedScore == scoreValue
                        Card(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clip(RoundedCornerShape(14.dp))
                                .clickable { onAnswerSelected(scoreValue) }
                                .testTag("likert_option_${targetQ.id}_$scoreValue"),
                            colors = CardDefaults.cardColors(
                                containerColor = if (isSelected)
                                    targetQ.dimension.getColor().copy(alpha = 0.18f)
                                else
                                    MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.35f)
                            ),
                            border = if (isSelected)
                                BorderStroke(2.dp, targetQ.dimension.getColor())
                            else
                                BorderStroke(1.dp, MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.3f))
                        ) {
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(horizontal = 16.dp, vertical = 12.dp),
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(12.dp)
                            ) {
                                Surface(
                                    shape = CircleShape,
                                    color = if (isSelected) targetQ.dimension.getColor() else MaterialTheme.colorScheme.surfaceVariant,
                                    modifier = Modifier.size(28.dp)
                                ) {
                                    Box(contentAlignment = Alignment.Center) {
                                        Text(
                                            text = scoreValue.toString(),
                                            color = if (isSelected) Color.White else MaterialTheme.colorScheme.onSurface,
                                            fontWeight = FontWeight.Bold,
                                            fontSize = 13.sp
                                        )
                                    }
                                }
                                Text(
                                    text = label.substringAfter("• "),
                                    fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Normal,
                                    fontSize = 13.sp,
                                    color = if (isSelected) targetQ.dimension.getColor() else MaterialTheme.colorScheme.onSurface
                                )
                            }
                        }
                    }
                }
            }
        }

        // Bottom Navigation Bar (Previous & Next/Finish)
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(vertical = 12.dp),
            horizontalArrangement = Arrangement.spacedBy(12.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            OutlinedButton(
                onClick = onPreviousClicked,
                enabled = currentIndex > 0,
                modifier = Modifier
                    .weight(1f)
                    .height(48.dp)
                    .testTag("assessment_previous_button"),
                shape = RoundedCornerShape(12.dp)
            ) {
                Icon(Icons.Default.ArrowBack, contentDescription = null, modifier = Modifier.size(16.dp))
                Spacer(Modifier.width(6.dp))
                Text("Anterior")
            }

            if (selectedScore != null) {
                Button(
                    onClick = {
                        if (currentIndex < totalCount - 1) {
                            onAnswerSelected(selectedScore)
                        } else {
                            onFinishClicked()
                        }
                    },
                    modifier = Modifier
                        .weight(1.2f)
                        .height(48.dp)
                        .testTag("assessment_next_button"),
                    shape = RoundedCornerShape(12.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = dimColor)
                ) {
                    Text(
                        text = if (currentIndex < totalCount - 1) "Siguiente" else "Ver Resultados 🎉",
                        fontWeight = FontWeight.Bold
                    )
                    Spacer(Modifier.width(6.dp))
                    Icon(
                        imageVector = if (currentIndex < totalCount - 1) Icons.Default.ArrowForward else Icons.Default.Check,
                        contentDescription = null,
                        modifier = Modifier.size(16.dp)
                    )
                }
            }
        }
    }
}
