# Test TIPOV — Test de Intereses Profesionales para la Orientación Vocacional
## Algoritmo, Fórmulas y Confiabilidad

**Método:** TIPOV  
**Archivo del motor:** `web/lib/methods/tipov/engine.ts`  
**Fuente bibliográfica base:** Carrasco, E., Zúñiga, C. y Asún, R. (2021). *Diseño y Validación Inicial del Test de Intereses Profesionales para la Orientación Vocacional (TIPOV) en Estudiantes Secundarios de Chile*. Psykhe. Universidad de Chile.

---

## 1. Estructura del instrumento

El TIPOV mide **13 dimensiones de interés profesional**:

| Código | Dimensión | Actividades típicas |
|---|---|---|
| TEC | Tecnología | Construcción, ingeniería industrial, informática aplicada |
| EMP | Empresa | Administración, finanzas, planificación organizacional |
| CAL | Cálculo | Matemáticas, estadística, lógica numérica |
| ART | Arte | Pintura, escultura, diseño plástico, crítica artística |
| CSS | Ciencias Sociales | Docencia, trabajo social, investigación grupal |
| MUS | Música y Artes Escénicas | Música, teatro, danza, actuación |
| COM | Comunicación | Periodismo, medios masivos, relaciones públicas |
| HUM | Humanidades | Historia, filosofía, literatura, antropología |
| IDI | Idiomas | Traducción, aprendizaje de lenguas, turismo |
| NAT | Naturaleza | Agronomía, ecología, silvicultura, conservación |
| SAL | Salud | Medicina, nutrición, rehabilitación, prevención |
| LEY | Leyes | Derecho, litigios, asesoría jurídica, mediación |
| CIB | Ciencias Básicas | Física teórica, química, biología molecular, laboratorio |

- **Total de ítems:** 66 (distribuidos entre las 13 dimensiones)
- **Escala de respuesta:** Likert de **3 puntos**

| Opción | Valor numérico |
|---|---|
| Me agrada | **3** |
| Me es indiferente | **2** |
| Me desagrada | **1** |

> **Nota:** El TIPOV no usa 0 como valor base sino 1. El rango por ítem es [1, 3], no [0, 2].

---

## 2. Cálculo del puntaje por dimensión

### Paso 1: Suma cruda por dimensión

```
raw_d = Σ respuesta_i   para todos los ítems del ítem i perteneciente a dimensión d
```

Los ítems sin respuesta cuentan como 0 (no se acumulan).

### Paso 2: Normalización (0–100)

```
maxPossible_d = 3 × cantidadDeItems_d
value_d = (raw_d / maxPossible_d) × 100
```

**Implementación en código:**
```typescript
const raw = sums[dim]                                // suma cruda
const maxPossible = MAX_LIKERT * counts[dim]        // 3 × nItems
const value = maxPossible > 0 ? (raw / maxPossible) * 100 : 0
```

### Distribución de ítems por dimensión

El banco de 66 ítems no distribuye exactamente igual entre las 13 dimensiones (el AFC original eliminó 2 ítems del banco de 68). El motor calcula `cantidadDeItems_d` dinámicamente desde el banco real, por lo que la fórmula se adapta automáticamente.

**Ejemplo concreto:**
```
Dimensión SAL (Salud), supongamos 6 ítems:
  Respuestas: [3, 2, 3, 3, 2, 3]
  raw_SAL = 3+2+3+3+2+3 = 16
  maxPossible = 3 × 6 = 18
  value_SAL = (16 / 18) × 100 ≈ 88.9%

Dimensión MUS (Música), supongamos 5 ítems:
  Respuestas: [1, 1, 2, 1, 1]
  raw_MUS = 1+1+2+1+1 = 6
  maxPossible = 3 × 5 = 15
  value_MUS = (6 / 15) × 100 = 40.0%
```

---

## 3. Determinación del perfil dominante

```
ranked = dimensiones ordenadas por raw_d descendente
         (desempate: índice de posición canónico, menor índice gana)

dominantCodes = top 3 de ranked  →  ej. ["SAL", "CIB", "CSS"]
```

### ¿Por qué se usa la suma cruda (raw) y no el valor normalizado para el ranking?

Porque las dimensiones tienen diferente número de ítems. Usar el raw directamente podría sobreponderar dimensiones con más ítems. Sin embargo, dado que el banco del TIPOV es relativamente equilibrado, la diferencia es mínima. La ventaja del raw es preservar la comparabilidad directa sin distorsión de escala.

> En versiones futuras se podría usar el valor normalizado (0–100) para el ranking, obteniendo resultados levemente distintos en casos de empate.

---

## 4. Interpretación del resultado

El sistema genera la interpretación automáticamente:

```
Si totalRaw == 0:
  "No se registraron respuestas, no es posible determinar intereses"

Si totalRaw > 0:
  "Tus intereses profesionales más altos se concentran en las áreas de
   {dim1}, {dim2} y {dim3}. Estas dimensiones reflejan las actividades
   que más te agradan y hacia las que conviene orientar tu exploración vocacional."
```

Donde `dim1, dim2, dim3` son los títulos completos en español de las 3 dimensiones dominantes.

---

## 5. Ejemplo completo de cálculo

```
Estudiante Camilo, respuestas por dimensión (suma cruda):
  TEC=14, EMP=10, CAL=18, ART=8, CSS=15, MUS=6, COM=12,
  HUM=9, IDI=7, NAT=11, SAL=16, LEY=13, CIB=17

Ranking por raw (descendente):
  1. CAL=18, 2. CIB=17, 3. SAL=16, 4. CSS=15, 5. TEC=14...

dominantCodes = ["CAL", "CIB", "SAL"]
dominantSummary = "Cálculo, Ciencias Básicas, Salud"

interpretation:
  "Tus intereses profesionales más altos se concentran en las áreas de
   Cálculo, Ciencias Básicas y Salud. Estas dimensiones reflejan..."

Valores normalizados (si cada dimensión tuviera 5 ítems, maxPossible=15):
  CAL: (18/15) × 100 → se clampea a 100% (raw puede exceder si hay más ítems)
  CIB: (17/15) × 100 → 113% (incorrecto si se asumen 5 ítems)

→ Por eso es crucial que maxPossible use el número real de ítems de la dimensión.
```

---

## 6. Confiabilidad y validez

### Validación original (Carrasco, Zúñiga & Asún, 2021)

| Propiedad | Valor |
|---|---|
| Muestra | **568 estudiantes** de 14 liceos científico-humanistas públicos de Chile |
| Método de confiabilidad | **Alfa Ordinal** (apropiado para escala ordinal de 3 puntos) |
| Rango de α ordinal | **0.84 – 0.94** en todas las escalas |
| Mejores escalas | Cálculo (0.94), Salud (0.94), Leyes (0.94), Arte (0.93) |
| Escala más baja | Música y Artes Escénicas (0.84), Comunicación (0.84) |

### Análisis Factorial Confirmatorio (AFC)

| Índice de ajuste | Valor | Criterio aceptable |
|---|---|---|
| χ²/gl | **2.43** | ≤ 3.0 |
| RMSEA | **0.05** | ≤ 0.05 (ajuste óptimo) |
| CFI | **0.90** | ≥ 0.90 |
| TLI | **0.90** | ≥ 0.90 |

El modelo de **13 factores** se ajustó excelentemente a los datos. Todas las cargas factoriales fueron superiores a 0.50.

### Validez concurrente con el Inventario de Kuder

Correlaciones de Spearman (rₛ) con dimensiones teóricamente homólogas del Kuder (n=289, p < 0.001):

| TIPOV | Kuder | rₛ |
|---|---|---|
| Empresa | Oficina | **0.64** (más alta) |
| Ciencias Básicas | Científica | 0.57 |
| Tecnología | Mecánica | 0.49 |
| Ciencias Sociales | Servicio Social | 0.49 |
| Cálculo | Cálculo | 0.42 |
| Arte | Artística | 0.42 |

### Innovaciones del TIPOV respecto al CIP-4 (instrumento base)

1. **Área de Ciencias Básicas** (nueva): física teórica, química, biología molecular
2. **Área de Ciencias Sociales** (redefinida desde "Servicio")
3. **Área de Música y Artes Escénicas** (amplía "Música" con teatro y danza)
4. **Adaptación semántica** al vocabulario juvenil chileno
5. **Digitalización** (diseñado para Moodle; la aplicación OrientApp lo porta a web)

---

## 7. Comparación de escalas entre métodos

| Característica | TIPOV | RIASEC | CHASIDE |
|---|---|---|---|
| Escala | Likert 3 pts | Likert 5 pts | Dicotómica |
| Dimensiones | 13 | 6 | 7 |
| Ítems totales | 66 | 60 | 98 |
| Mide aptitud | No (solo interés) | No | Sí |
| Origen | Chile (2021) | EEUU (1959–1997) | América Latina |
| Confiabilidad | α ordinal 0.84–0.94 | α 0.70–0.92 | α 0.70–0.93 |
