package com.example.data.remote

import com.example.data.model.*
import com.squareup.moshi.Moshi
import com.squareup.moshi.kotlin.reflect.KotlinJsonAdapterFactory
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import java.io.IOException
import java.util.concurrent.TimeUnit

class AiService {

    private val moshi = Moshi.Builder()
        .add(KotlinJsonAdapterFactory())
        .build()

    private val requestAdapter = moshi.adapter(ChatCompletionRequest::class.java)
    private val responseAdapter = moshi.adapter(ChatCompletionResponse::class.java)

    private val okHttpClient = OkHttpClient.Builder()
        .connectTimeout(30, TimeUnit.SECONDS)
        .readTimeout(60, TimeUnit.SECONDS)
        .writeTimeout(30, TimeUnit.SECONDS)
        .build()

    /**
     * Executes a chat completion request to the configured AI provider (NVIDIA NIM, OpenAI, Local AI)
     */
    suspend fun completeChat(
        config: AiConfiguration,
        messages: List<ChatMessageDto>
    ): Result<String> = withContext(Dispatchers.IO) {
        try {
            var rawBaseUrl = config.baseUrl.trim().trimEnd('/')
            if (!rawBaseUrl.startsWith("http://") && !rawBaseUrl.startsWith("https://")) {
                rawBaseUrl = "https://$rawBaseUrl"
            }

            val endpointUrl = if (rawBaseUrl.endsWith("/chat/completions")) {
                rawBaseUrl
            } else if (rawBaseUrl.endsWith("/v1")) {
                "$rawBaseUrl/chat/completions"
            } else {
                "$rawBaseUrl/v1/chat/completions"
            }

            val requestBodyObj = ChatCompletionRequest(
                model = config.modelName.trim(),
                messages = messages,
                temperature = config.temperature,
                maxTokens = config.maxTokens
            )

            val jsonPayload = requestAdapter.toJson(requestBodyObj)
            val mediaType = "application/json; charset=utf-8".toMediaType()
            val body = jsonPayload.toRequestBody(mediaType)

            val requestBuilder = Request.Builder()
                .url(endpointUrl)
                .post(body)
                .addHeader("Content-Type", "application/json")

            if (config.apiKey.isNotBlank()) {
                requestBuilder.addHeader("Authorization", "Bearer ${config.apiKey.trim()}")
            }

            val request = requestBuilder.build()
            val response = okHttpClient.newCall(request).execute()

            val responseBody = response.body?.string() ?: ""

            if (!response.isSuccessful) {
                val errorMsg = try {
                    val parsedErr = responseAdapter.fromJson(responseBody)
                    parsedErr?.error?.message ?: "HTTP ${response.code}: ${response.message}"
                } catch (e: Exception) {
                    "HTTP ${response.code}: ${response.message}\n$responseBody"
                }
                return@withContext Result.failure(IOException(errorMsg))
            }

            val parsedResponse = responseAdapter.fromJson(responseBody)
            val content = parsedResponse?.choices?.firstOrNull()?.message?.content
            if (content.isNullOrBlank()) {
                return@withContext Result.failure(IOException("Respuesta vacía recibida del proveedor de IA"))
            }

            Result.success(content.trim())
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    /**
     * Quick connection test to verify API key and model availability
     */
    suspend fun testConnection(config: AiConfiguration): Result<String> {
        val testMessages = listOf(
            ChatMessageDto(
                role = "user",
                content = "Responde únicamente 'OK: Conexión Exitosa con OrientApp' si puedes procesar este mensaje."
            )
        )
        return completeChat(config, testMessages)
    }

    /**
     * Generates a deep vocational diagnosis analysis based on RIASEC profile and career matches
     */
    suspend fun generateVocationalReport(
        config: AiConfiguration,
        scores: PsychometricScores,
        dominantCode: String,
        topCareers: List<CareerMatch>,
        reliabilityLevel: String,
        studentName: String? = null
    ): Result<String> {
        val greeting = if (!studentName.isNullOrBlank()) "para el estudiante $studentName" else "del usuario"
        val systemPrompt = """
            Eres OrientApp AI, un psicólogo vocacional y asesor de carrera de élite.
            Analiza el perfil psicométrico RIASEC $greeting y genera un informe vocacional profesional, empático, estructurado y altamente accionable.

            
            Usa el siguiente formato estructurado con subtítulos claros:
            1. 🌟 **Resumen de tu Identidad Vocacional**: Explica el significado de su código dominante $dominantCode y sus rasgos clave.
            2. 🔬 **Análisis Dimensional Detallado**: Destaca sus 2-3 mayores fortalezas y cómo se complementan.
            3. 🚀 **Sinergia con Carreras Recomendadas**: Explica por qué carreras como ${topCareers.take(3).joinToString { it.career.title }} encajan con su vector vocacional.
            4. 💡 **Estrategia de Crecimiento & Habilidades**: 3 recomendaciones prácticas para su desarrollo preuniversitario o profesional.
            
            Mantén un tono inspirador, riguroso y personalizado.
        """.trimIndent()

        val userPrompt = """
            Resultados Psicométricos del Usuario:
            - Código RIASEC Dominante: $dominantCode
            - Puntuaciones Normalizadas (0-100):
              * R (Realista): ${scores.r.toInt()}%
              * I (Investigador): ${scores.i.toInt()}%
              * A (Artístico): ${scores.a.toInt()}%
              * S (Social): ${scores.s.toInt()}%
              * E (Emprendedor): ${scores.e.toInt()}%
              * C (Convencional): ${scores.c.toInt()}%
            - Nivel de Confiabilidad de la Prueba: $reliabilityLevel
            - Carreras con Mayor Afinidad:
              ${topCareers.take(4).mapIndexed { idx, m -> "${idx + 1}. ${m.career.title} (Afinidad: ${m.affinityPercentage.toInt()}%) - Área: ${m.career.areaName}" }.joinToString("\n  ")}
        """.trimIndent()

        val messages = listOf(
            ChatMessageDto(role = "system", content = systemPrompt),
            ChatMessageDto(role = "user", content = userPrompt)
        )

        return completeChat(config, messages)
    }

    /**
     * Builds fallback heuristic vocational analysis when offline or without API key
     */
    fun buildOfflineFallbackAnalysis(
        scores: PsychometricScores,
        dominantCode: String,
        topCareers: List<CareerMatch>
    ): String {
        val topCareerTitles = topCareers.take(3).joinToString(", ") { it.career.title }
        val dominantDims = scores.getDominantDimensions(3)
        val dim1 = dominantDims.getOrNull(0)?.first
        val dim2 = dominantDims.getOrNull(1)?.first

        return """
            🌟 **Resumen de tu Identidad Vocacional ($dominantCode)**
            Tu perfil destaca principalmente en las áreas ${dim1?.title ?: ""} y ${dim2?.title ?: ""}. Cuentas con un patrón motivacional bien definido que combina ${dim1?.adjective ?: "fortalezas prácticas"} con ${dim2?.adjective ?: "habilidades estratégicas"}.

            🔬 **Análisis Dimensional de Fortalezas**
            • **${dim1?.title} (${scores.getScore(dim1 ?: DimensionCode.R).toInt()}%):** ${dim1?.shortDesc}
            • **${dim2?.title} (${scores.getScore(dim2 ?: DimensionCode.I).toInt()}%):** ${dim2?.shortDesc}

            🚀 **Afinidad con Carreras Principales**
            Tus mejores correspondencias ocupacionales son: **$topCareerTitles**. Estas áreas te permitirán explotar tu inclinación natural hacia la resolución de problemas y la creación de valor.

            💡 **Recomendación Estratégica**
            Explora planes de estudio, mallas curriculares y proyectos reales en tus carreras afines. Para potenciar tu perfil, trabaja en habilidades interdisciplinarias que conecten tus dos dimensiones dominantes.
            
            *(Nota: Puedes configurar tu API Key de NVIDIA NIM o OpenAI en Ajustes para obtener diagnósticos y un tutor interactivo con IA de última generación).*
        """.trimIndent()
    }
}
