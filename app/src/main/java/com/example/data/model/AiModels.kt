package com.example.data.model

import com.squareup.moshi.Json
import com.squareup.moshi.JsonClass

enum class AiProviderType(
    val displayName: String,
    val defaultBaseUrl: String,
    val defaultModel: String,
    val description: String,
    val requiresApiKey: Boolean
) {
    NVIDIA_NIM(
        displayName = "NVIDIA NIM / API",
        defaultBaseUrl = "https://integrate.api.nvidia.com/v1",
        defaultModel = "meta/llama-3.1-70b-instruct",
        description = "Inferencia acelerada de alto rendimiento de NVIDIA con soporte para Llama 3.1, Nemotron y Mixtral.",
        requiresApiKey = true
    ),
    OPENAI(
        displayName = "OpenAI",
        defaultBaseUrl = "https://api.openai.com/v1",
        defaultModel = "gpt-4o-mini",
        description = "Modelos comerciales de OpenAI (GPT-4o, GPT-4o-mini).",
        requiresApiKey = true
    ),
    LOCAL_AI(
        displayName = "IA Local (Ollama / LM Studio)",
        defaultBaseUrl = "http://10.0.2.2:11434/v1",
        defaultModel = "llama3.2",
        description = "Modelos ejecutados 100% en tu servidor/PC local sin costo y con máxima privacidad.",
        requiresApiKey = false
    ),
    CUSTOM(
        displayName = "Proveedor Personalizado",
        defaultBaseUrl = "https://api.together.xyz/v1",
        defaultModel = "mistralai/Mixtral-8x7B-Instruct-v0.1",
        description = "Cualquier endpoint compatible con la API de OpenAI / v1.",
        requiresApiKey = true
    )
}

data class AiConfiguration(
    val providerType: AiProviderType = AiProviderType.NVIDIA_NIM,
    val baseUrl: String = "https://integrate.api.nvidia.com/v1",
    val apiKey: String = "",
    val modelName: String = "meta/llama-3.1-70b-instruct",
    val temperature: Float = 0.7f,
    val maxTokens: Int = 1024
) {
    fun isConfigured(): Boolean {
        return if (providerType.requiresApiKey) {
            apiKey.isNotBlank() && baseUrl.isNotBlank() && modelName.isNotBlank()
        } else {
            baseUrl.isNotBlank() && modelName.isNotBlank()
        }
    }
}

@JsonClass(generateAdapter = true)
data class ChatCompletionRequest(
    @Json(name = "model") val model: String,
    @Json(name = "messages") val messages: List<ChatMessageDto>,
    @Json(name = "temperature") val temperature: Float = 0.7f,
    @Json(name = "max_tokens") val maxTokens: Int = 1024
)

@JsonClass(generateAdapter = true)
data class ChatMessageDto(
    @Json(name = "role") val role: String,
    @Json(name = "content") val content: String
)

@JsonClass(generateAdapter = true)
data class ChatCompletionResponse(
    @Json(name = "id") val id: String? = null,
    @Json(name = "choices") val choices: List<ChoiceDto>? = null,
    @Json(name = "error") val error: ErrorDto? = null
)

@JsonClass(generateAdapter = true)
data class ChoiceDto(
    @Json(name = "index") val index: Int? = null,
    @Json(name = "message") val message: ChatMessageDto? = null,
    @Json(name = "finish_reason") val finishReason: String? = null
)

@JsonClass(generateAdapter = true)
data class ErrorDto(
    @Json(name = "message") val message: String? = null,
    @Json(name = "type") val type: String? = null,
    @Json(name = "code") val code: String? = null
)

data class ChatMessage(
    val id: String = java.util.UUID.randomUUID().toString(),
    val sender: MessageSender,
    val text: String,
    val timestamp: Long = System.currentTimeMillis(),
    val isError: Boolean = false
)

enum class MessageSender {
    USER,
    AI_TUTOR,
    SYSTEM
}
