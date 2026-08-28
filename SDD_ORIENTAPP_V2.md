# Software Design Document (SDD) — OrientApp v2.0
## Proyecto: OrientApp — Plataforma Móvil Nativa de Diagnóstico Vocacional Psicométrico con Asesor de IA Configurable

**Versión:** 2.0.0 (Actualizada para Android Nativo & NVIDIA NIM / OpenAI)  
**Fecha:** 26 de Agosto de 2026  
**Document Type:** Software Design Document (SDD)  
**Target:** Android (Kotlin, Jetpack Compose, Room, Material 3, OkHttp/Moshi)

---

## 1. Resumen Ejecutivo y Objetivos del Sistema

### 1.1 Propósito
OrientApp es una aplicación móvil nativa diseñada para orientar vocacionalmente a estudiantes preuniversitarios y profesionales en reconversión mediante un diagnóstico psicométrico riguroso basado en el modelo tipológico **RIASEC (Holland)** con normalización O*NET, control de calidad heurístico (detección de patrones lineales, tiempos de respuesta y consistencia en pares espejo) y un **Asesor Vocacional Inteligente con integración universal de IA** (NVIDIA NIM, OpenAI y Modelos Locales).

### 1.2 Alcance
* **Evaluación Psicométrica Estandarizada:** 60 reactivos calibrados (10 por dimensión: R, I, A, S, E, C) en escala Likert de 5 puntos.
* **Control de Calidad de Respuestas:** Detección de trampa de velocidad (<1100ms/ítem), straight-lining (>75% respuestas monótonas) y pares espejo de consistencia.
* **Motor Matemático Vectorial:** Cálculo de vector normalizado $\vec{U} = [Score_R, Score_I, Score_A, Score_S, Score_E, Score_C]$ y similitud coseno + proximidad euclidiana contra catálogo ocupacional.
* **Visualización Dinámica:** Gráfico Radial Hexagonal interactivo desarrollado en Jetpack Compose Canvas.
* **Módulo Universal de IA Configurable:**
  * Soporte nativo para **NVIDIA NIM / API** (`https://integrate.api.nvidia.com/v1`, e.g., `meta/llama-3.1-70b-instruct`, `nvidia/nemotron-4-340b-instruct`).
  * Soporte para **OpenAI** (`https://api.openai.com/v1`, e.g., `gpt-4o-mini`, `gpt-4o`).
  * Soporte para **IA Local** (Ollama / LM Studio / Jan en `http://10.0.2.2:11434/v1`).
  * Asesor Vocacional Interactivo con contexto del perfil psicométrico cargado en tiempo real.
* **Persistencia Local Offline-First:** Base de datos Room para almacenamiento seguro de sesiones, respuestas, resultados y claves de configuración.

---

## 2. Arquitectura del Sistema (Android Nativo)

### 2.1 Diagrama de Componentes
```
+-------------------------------------------------------------------------+
|                        OrientApp Compose UI                             |
|  [HomeScreen] <-> [AssessmentScreen] <-> [ResultsScreen (Radar Canvas)] |
|  [CareersExplorer] <-> [AiChatScreen (Tutor IA)] <-> [AiSettingsDialog] |
+------------------------------------+------------------------------------+
                                     | (StateFlow / Events)
                                     v
+-------------------------------------------------------------------------+
|                    ViewModel (OrientAppViewModel)                       |
|  - Assessment State & Auto-Save Manager                                 |
|  - PsychometricEngine Orchestrator                                      |
|  - AI Configuration & Chat Session Dispatcher                           |
+------------------------------------+------------------------------------+
                                     |
                                     v
+-------------------------------------------------------------------------+
|                       Data / Repository Layer                           |
|  + AssessmentRepository                                                 |
|  + Room Database (AppDatabase -> AssessmentDao)                         |
|  + Remote Service (AiService -> OkHttp & Moshi JSON Adapters)           |
+-------------------------------------------------------------------------+
```

### 2.2 Stack Tecnológico
* **Lenguaje:** Kotlin 2.x
* **UI Toolkit:** Jetpack Compose + Material Design 3 (M3)
* **Arquitectura:** MVVM (Model-View-ViewModel) + Repository Pattern + Unidirectional Data Flow (UDF)
* **Persistencia Local:** AndroidX Room + KSP (Kotlin Symbol Processing)
* **Networking & JSON:** OkHttp 4 + Moshi Kotlin Codegen
* **Concurrencia:** Kotlin Coroutines & StateFlow / SharedFlow

---

## 3. Modelo Psicométrico y Algoritmo de Cálculo

### 3.1 Dimensiones RIASEC
1. **R (Realista):** Práctico, mecánico, físico, herramientas, naturaleza y robótica.
2. **I (Investigador):** Científico, analítico, abstracto, investigación y ciencia de datos.
3. **A (Artístico):** Creativo, intuitivo, diseño visual, música y narrativa original.
4. **S (Social):** Empatía, educación, psicología, medicina y servicio comunitario.
5. **E (Emprendedor):** Liderazgo, negociación, visión de negocios y dirección estratégica.
6. **C (Convencional):** Estructurado, metódico, finanzas, contabilidad y auditoría de sistemas.

### 3.2 Escala Likert y Normalización Vectorial
Cada reactivo se puntúa $Score \in [1, 5]$. La puntuación normalizada por dimensión $d$ es:
$$Score_d = \frac{\sum_{i=1}^{N_d} (Item_{d,i} - 1)}{4 \cdot N_d} \times 100$$
Donde $Score_d \in [0, 100]$.

### 3.3 Similitud Coseno y Emparejamiento de Carreras
La afinidad vocacional entre el vector del usuario $\vec{U}$ y el perfil ideal de la carrera $\vec{C_k}$ se calcula combinando similitud coseno ($70\%$) y proximidad euclidiana ($30\%$):
$$Affinity_k = \left( 0.70 \cdot \frac{\vec{U} \cdot \vec{C_k}}{\|\vec{U}\| \|\vec{C_k}\|} + 0.30 \cdot \left(1 - \frac{d_{eucl}(\vec{U}, \vec{C_k})}{2.45}\right) \right) \times 100$$

---

## 4. Módulo de Integración de IA (NVIDIA NIM / OpenAI / Local)

El cliente universal se conecta con cualquier endpoint OpenAI-compatible:

```python
# Equivalente conceptual en Python / OpenAI SDK:
client = OpenAI(
    base_url = "https://integrate.api.nvidia.com/v1", # O "https://api.openai.com/v1" / "http://localhost:11434/v1"
    api_key = user_api_key
)
```

En Kotlin, se implementa mediante `AiService` utilizando `OkHttp` para gestionar endpoints dinámicos, encabezados de autenticación (`Authorization: Bearer <API_KEY>`) y parsing mediante `Moshi`.

### Prompts de Sistema
* **Generación de Diagnóstico Vocacional:** Analiza el vector del estudiante, código dominante y ranking de afinidad para redactar un informe en 4 secciones (Identidad, Análisis dimensional, Sinergia con carreras, Estrategia).
* **Tutor Vocacional Conversacional:** Chat continuo que mantiene el contexto de los resultados psicométricos del estudiante para resolver dudas sobre carreras, salarios, campos laborales y habilidades.
