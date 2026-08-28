package com.example.ui.components

import androidx.compose.animation.core.Animatable
import androidx.compose.animation.core.tween
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.*
import androidx.compose.material3.MaterialTheme
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.*
import androidx.compose.ui.graphics.drawscope.DrawScope
import androidx.compose.ui.graphics.drawscope.Fill
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.*
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.data.model.DimensionCode
import com.example.data.model.PsychometricScores
import kotlin.math.PI
import kotlin.math.cos
import kotlin.math.sin

@OptIn(ExperimentalTextApi::class)
@Composable
fun RiasecRadarChart(
    scores: PsychometricScores,
    modifier: Modifier = Modifier,
    selectedDimension: DimensionCode? = null,
    onDimensionSelected: ((DimensionCode) -> Unit)? = null
) {
    val textMeasurer = rememberTextMeasurer()
    val animatedProgress = remember { Animatable(0f) }

    LaunchedEffect(scores) {
        animatedProgress.animateTo(
            targetValue = 1f,
            animationSpec = tween(durationMillis = 900)
        )
    }

    val dimensions = listOf(
        DimensionCode.R,
        DimensionCode.I,
        DimensionCode.A,
        DimensionCode.S,
        DimensionCode.E,
        DimensionCode.C
    )

    val onSurfaceColor = MaterialTheme.colorScheme.onSurface
    val surfaceVariantColor = MaterialTheme.colorScheme.surfaceVariant
    val primaryColor = MaterialTheme.colorScheme.primary

    Box(
        modifier = modifier
            .fillMaxWidth()
            .height(280.dp)
            .testTag("riasec_radar_chart")
    ) {
        Canvas(modifier = Modifier.fillMaxSize()) {
            val center = Offset(size.width / 2f, size.height / 2f)
            val maxRadius = (minOf(size.width, size.height) / 2f) - 44.dp.toPx()
            val numAxes = dimensions.size
            val angleStep = (2 * PI / numAxes).toFloat()
            // Start at top (-PI/2)
            val startAngle = (-PI / 2).toFloat()

            // 1. Draw concentric hexagonal guide polygons (20%, 40%, 60%, 80%, 100%)
            val rings = listOf(0.2f, 0.4f, 0.6f, 0.8f, 1.0f)
            rings.forEach { ratio ->
                val ringPath = Path()
                val radius = maxRadius * ratio
                for (i in 0 until numAxes) {
                    val angle = startAngle + i * angleStep
                    val x = center.x + radius * cos(angle)
                    val y = center.y + radius * sin(angle)
                    if (i == 0) ringPath.moveTo(x, y) else ringPath.lineTo(x, y)
                }
                ringPath.close()

                drawPath(
                    path = ringPath,
                    color = onSurfaceColor.copy(alpha = if (ratio == 1.0f) 0.25f else 0.10f),
                    style = Stroke(width = if (ratio == 1.0f) 1.5.dp.toPx() else 1.dp.toPx())
                )
            }

            // 2. Draw axis lines & labels
            val dataPoints = mutableListOf<Offset>()

            dimensions.forEachIndexed { index, dim ->
                val angle = startAngle + index * angleStep
                val axisEnd = Offset(
                    center.x + maxRadius * cos(angle),
                    center.y + maxRadius * sin(angle)
                )

                // Axis line
                drawLine(
                    color = onSurfaceColor.copy(alpha = 0.15f),
                    start = center,
                    end = axisEnd,
                    strokeWidth = 1.dp.toPx()
                )

                // Calculate data point for user score
                val score = scores.getScore(dim).coerceIn(0f, 100f)
                val currentScoreRatio = (score / 100f) * animatedProgress.value
                val dataRadius = maxRadius * currentScoreRatio
                val pointX = center.x + dataRadius * cos(angle)
                val pointY = center.y + dataRadius * sin(angle)
                dataPoints.add(Offset(pointX, pointY))

                // Label Position (outside the 100% boundary)
                val labelDistance = maxRadius + 26.dp.toPx()
                val labelX = center.x + labelDistance * cos(angle)
                val labelY = center.y + labelDistance * sin(angle)

                val labelText = "${dim.name} (${score.toInt()}%)"
                val textLayoutResult = textMeasurer.measure(
                    text = AnnotatedString(labelText),
                    style = TextStyle(
                        color = dim.getColor(),
                        fontSize = 12.sp,
                        fontWeight = androidx.compose.ui.text.font.FontWeight.Bold
                    )
                )

                val textOffset = Offset(
                    x = labelX - (textLayoutResult.size.width / 2f),
                    y = labelY - (textLayoutResult.size.height / 2f)
                )

                drawText(textLayoutResult, topLeft = textOffset)
            }

            // 3. Draw filled user score polygon
            if (dataPoints.isNotEmpty()) {
                val polyPath = Path().apply {
                    moveTo(dataPoints[0].x, dataPoints[0].y)
                    for (i in 1 until dataPoints.size) {
                        lineTo(dataPoints[i].x, dataPoints[i].y)
                    }
                    close()
                }

                // Shaded transparent fill
                drawPath(
                    path = polyPath,
                    brush = Brush.radialGradient(
                        colors = listOf(
                            primaryColor.copy(alpha = 0.45f),
                            primaryColor.copy(alpha = 0.18f)
                        ),
                        center = center,
                        radius = maxRadius
                    ),
                    style = Fill
                )

                // Outline stroke
                drawPath(
                    path = polyPath,
                    color = primaryColor,
                    style = Stroke(width = 3.dp.toPx(), cap = StrokeCap.Round, join = StrokeJoin.Round)
                )

                // 4. Draw vertex circle points
                dataPoints.forEachIndexed { i, point ->
                    val dim = dimensions[i]
                    val isSelected = selectedDimension == dim
                    val pointColor = dim.getColor()

                    // Outer halo
                    drawCircle(
                        color = pointColor.copy(alpha = 0.35f),
                        radius = if (isSelected) 8.dp.toPx() else 5.dp.toPx(),
                        center = point
                    )
                    // Inner dot
                    drawCircle(
                        color = pointColor,
                        radius = if (isSelected) 5.dp.toPx() else 3.5.dp.toPx(),
                        center = point
                    )
                    drawCircle(
                        color = Color.White,
                        radius = 1.8.dp.toPx(),
                        center = point
                    )
                }
            }
        }
    }
}
