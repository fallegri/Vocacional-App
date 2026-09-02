# Test de Orientación Vocacional — Magdalena Contreras / Lizarazo
## Algoritmo, Fórmulas y Confiabilidad

**Método:** Test Magdalena Contreras  
**Archivo del motor:** `web/lib/methods/magdalena/engine.ts`  
**Fuente bibliográfica base:**
- Alcaldía La Magdalena Contreras (2021). *Test de orientación vocacional*. Ciudad de México.
- Lizarazo, N. (2024). *Test Vocacional (Basado en la escala y descripción de Magdalena Contreras)*. UNICISO.

---

## 1. Estructura del instrumento

El test evalúa **10 campos de trabajo** en **dos dimensiones paralelas**: **Interés** y **Aptitud autopercibida**.

| Código | Campo | Actividades representativas |
|---|---|---|
| SS | Servicio Social | Bienestar de otros, comprensión de problemas humanos, auxilio social |
| EP | Ejecutivo-Persuasivo | Planear, organizar, dirigir grupos, liderar, convencer |
| VER | Verbal | Expresión oral y escrita, lectura, literatura, argumentación |
| AP | Artístico-Plástica | Dibujo, pintura, escultura, decoración, apreciación estética |
| MUS | Musical | Ejecución de instrumentos, canto, composición, teoría musical |
| ORG | Organización | Orden, clasificación, archivo, estructuración de oficinas |
| CIE | Científica | Investigación, curiosidad por causas naturales y sociales, experimentación |
| MAT | Cálculo | Operaciones matemáticas, aritmética, álgebra, datos cuantitativos |
| MEC | Mecánico-Constructiva | Herramientas, mecanismos, piezas móviles, diseño de objetos |
| AIR | Trabajo al Aire Libre | Actividades campestres, agricultura, zootecnia, destreza manual |

- **Total de cuestionarios:** 2 paralelos (Intereses + Aptitudes)
- **Total de ítems:** 120 (60 de Interés + 60 de Aptitud, distribuidos en 10 campos × 6 ítems cada uno por cuestionario)
- **Escala de respuesta:** **5 puntos (0–4)**

### Escala de Interés

| Valor | Descripción |
|---|---|
| 4 | Me gusta mucho |
| 3 | Me gusta algo o en parte |
| 2 | Me es indiferente |
| 1 | Me desagrada algo o en parte |
| 0 | Me desagrada mucho o totalmente |

### Escala de Aptitud (autopercepción)

| Valor | Descripción |
|---|---|
| 4 | Considero ser muy competente |
| 3 | Considero ser competente |
| 2 | Considero ser medianamente competente |
| 1 | Considero ser muy poco competente |
| 0 | Considero ser incompetente |

---

## 2. Cálculo del puntaje por campo

### Paso 1: Suma cruda separada por dimensión

Para cada campo `c ∈ {SS, EP, VER, AP, MUS, ORG, CIE, MAT, MEC, AIR}`:

```
Interés_c  = Σ valor_i   para los 6 ítems de Interés del campo c
Aptitud_c  = Σ valor_i   para los 6 ítems de Aptitud del campo c
```

Rango: `Interés_c ∈ [0, 24]` y `Aptitud_c ∈ [0, 24]`  
(Máximo = 4 puntos/ítem × 6 ítems = **24 puntos** por campo y dimensión)

Los ítems con valor ≤ 0 no acumulan (i.e. si la respuesta es 0, no suma).

**Implementación en código:**
```typescript
if (q.category === "APTITUD") totals.aptitud[field] += value
else                           totals.interes[field] += value
// (se omiten los valores <= 0)
```

### Paso 2: Bandas de interpretación (los cortes del instrumento original)

Los puntajes 0–24 se interpretan mediante **bandas de nivel** definidas en la fuente original:

#### Bandas de Interés

| Puntaje | Rango (%) | Banda |
|---|---|---|
| 0 – 6 | 0% – 25% | **Falta de Motivación** |
| 7 – 12 | 26% – 50% | **Intereses Comunes** |
| 13 – 18 | 51% – 75% | **Intereses Subprofesionales** |
| 19 – 24 | 76% – 100% | **Intereses Profesionales** |

#### Bandas de Aptitud

| Puntaje | Rango (%) | Banda |
|---|---|---|
| 0 – 6 | 0% – 25% | **Falta de Práctica** |
| 7 – 12 | 26% – 50% | **Aptitudes Comunes** |
| 13 – 18 | 51% – 75% | **Aptitudes Normales** |
| 19 – 24 | 76% – 100% | **Aptitudes Desarrolladas** |

**Implementación en código:**
```typescript
function interestBand(score: number): string {
  if (score <= 6)  return "Falta de Motivación"
  if (score <= 12) return "Intereses Comunes"
  if (score <= 18) return "Intereses Subprofesionales"
  return "Intereses Profesionales"
}

function aptitudeBand(score: number): string {
  if (score <= 6)  return "Falta de Práctica"
  if (score <= 12) return "Aptitudes Comunes"
  if (score <= 18) return "Aptitudes Normales"
  return "Aptitudes Desarrolladas"
}
```

### Paso 3: Puntaje normalizado compuesto por campo (0–100)

Para las visualizaciones y comparaciones relativas:

```
raw_c   = Interés_c + Aptitud_c          // suma total combinada (máx. 48)
value_c = (raw_c / (24 + 24)) × 100     // normalizado 0-100
        = (raw_c / 48) × 100
```

**Implementación en código:**
```typescript
const MAGDALENA_FIELD_MAX = 24          // máx por dimensión
const raw = interes + aptitud           // suma 0-48
const value = (raw / (MAGDALENA_FIELD_MAX * 2)) * 100
```

---

## 3. Determinación del perfil dominante

```
topInteres  = top 3 campos ordenados por Interés_c descendente
              (desempate: orden canónico de MAGDALENA_FIELDS)

dominantCodes = topInteres  // el perfil dominante usa el interés
```

```typescript
const dominantCodes = topFields(totals.interes, 3)
// ordenados por raw de Interés, no por el valor normalizado
```

---

## 4. Detección de desajuste Interés–Aptitud

El motor detecta automáticamente cuando existe un **desajuste significativo** en el campo principal: alto interés pero baja aptitud autopercibida.

```
mismatch = (Interés_topCampo1 >= 13) AND (Aptitud_topCampo1 <= 12)
```

Es decir: el campo de mayor interés está en banda "Intereses Subprofesionales" o "Intereses Profesionales" (≥13), pero la aptitud está en "Aptitudes Comunes" o "Falta de Práctica" (≤12).

**Si mismatch = true:**
> "Tu aptitud autopercibida en {campo} es más baja ({banda}); conviene reforzar la práctica y la formación en ese campo para nivelar tus habilidades con tu interés."

**Si mismatch = false:**
> "Tu aptitud autopercibida en {campo} se ubica en la banda de {banda}, lo que muestra una relación coherente entre lo que te gusta y aquello para lo que te sientes competente."

Este análisis de congruencia es una de las fortalezas distintivas de este test frente a instrumentos que solo miden interés.

---

## 5. Ejemplo completo de cálculo

```
Estudiante Laura (6 ítems por campo × cuestionario):

Sumas de Interés (0-24 por campo):
  SS=20, EP=14, VER=22, AP=10, MUS=6, ORG=12, CIE=18, MAT=8, MEC=4, AIR=16

Sumas de Aptitud (0-24 por campo):
  SS=15, EP=12, VER=21, AP=8,  MUS=5, ORG=10, CIE=10, MAT=6, MEC=3, AIR=14

Bandas de Interés:
  SS=20 → Intereses Profesionales
  EP=14 → Intereses Subprofesionales
  VER=22 → Intereses Profesionales
  AP=10 → Intereses Comunes
  MUS=6  → Falta de Motivación
  ORG=12 → Intereses Comunes
  CIE=18 → Intereses Subprofesionales
  MAT=8  → Intereses Comunes
  MEC=4  → Falta de Motivación
  AIR=16 → Intereses Subprofesionales

Ranking por Interés: VER(22) > SS(20) > AIR(16) > CIE(18)...
  Correcto: VER=22 > SS=20 > CIE=18 > AIR=16 > EP=14 > ...
  topInteres = ["VER", "SS", "CIE"]

Bandas de Aptitud (campos dominantes):
  VER=21 → Aptitudes Desarrolladas  (congruente con Interés Profesional)
  SS=15  → Aptitudes Normales       (congruente con Interés Profesional)
  CIE=10 → Aptitudes Comunes        (menor que Interés Subprofesional)

Detección de desajuste:
  topCampo1 = VER
  Interés_VER = 22 >= 13 → true
  Aptitud_VER = 21 > 12  → false
  mismatch = false → "relación coherente"

dominantCodes = ["VER", "SS", "CIE"]
dominantSummary = "Verbal, Servicio Social, Científica"

Puntajes normalizados:
  VER: (22+21)/48 × 100 = 89.6%
  SS:  (20+15)/48 × 100 = 72.9%
  CIE: (18+10)/48 × 100 = 58.3%
  AIR: (16+14)/48 × 100 = 62.5%
  ...
```

---

## 6. Confiabilidad y validez

### Origen del instrumento

Desarrollado por la **Alcaldía de La Magdalena Contreras** (Ciudad de México, 2021) como herramienta de orientación pública para estudiantes de nivel medio. Adaptado y formalizado por **Lizarazo (2024, UNICISO)** con énfasis en la doble medición simultánea de interés y aptitud.

### Propiedades psicométricas

| Propiedad | Estado |
|---|---|
| Validez de contenido | Respaldada por el marco teórico de Parsons y la tradición del diagnóstico vocacional por campos |
| Confiabilidad reportada | Las fuentes disponibles no publican α de Cronbach para este instrumento específico |
| Validez ecológica | Alta — diseñado para el contexto latinoamericano (México) con lenguaje cotidiano |
| Bandas de interpretación | Establecidas empíricamente en la fuente original (Alcaldía La Magdalena Contreras, 2021) |

> **Nota de transparencia:** A diferencia de RIASEC, CHASIDE y TIPOV, el Test Magdalena Contreras no tiene estudios de validación psicométrica formal publicados en revistas indexadas accesibles en las fuentes de referencia del sistema (`skills/knowledge/test-magdalena-contreras.md`). Su fortaleza reside en su amplio uso práctico en México y en la coherencia conceptual de su diseño (doble medición interés/aptitud con bandas claras).

### Comparación de las bandas con percentiles

Las bandas de interpretación se basan en cuartiles del rango 0–24:

| Banda | Puntaje | Percentil aprox. | Significado práctico |
|---|---|---|---|
| Falta de Motivación / Falta de Práctica | 0–6 | 0–25° | Ausencia de preferencia o habilidad |
| Comunes | 7–12 | 26–50° | Sin definición clara |
| Subprofesionales / Normales | 13–18 | 51–75° | Interés o habilidad como hobby/actividad parcial |
| Profesionales / Desarrolladas | 19–24 | 76–100° | Interés o habilidad suficiente para orientar la carrera |

---

## 7. Diferencias clave con otros métodos del sistema

| Aspecto | Magdalena Contreras | RIASEC | CHASIDE | CIP-R |
|---|---|---|---|---|
| Escala | 0–4 (Likert 5 pts) | Likert 1–5 | Sí/No | A/I/D |
| Campos | 10 | 6 dimensiones | 7 áreas | 15 escalas |
| Ítems totales | 120 | 60 | 98 | 114 |
| Cuestionarios | 2 paralelos (I+A) | 1 | 1 (ítems mixtos) | 1 |
| Mide aptitud | **Sí, cuestionario separado** | No | Sí (ítems mezclados) | No |
| Bandas de interpretación | **Sí, 4 niveles para cada dimensión** | No (solo %) | No | No |
| Detección de desajuste I/A | **Sí, automática** | No | Sí (cualitativa) | No |
| Origen | México (2021/2024) | EEUU (1959–1997) | América Latina | Argentina (2003) |
| Confiabilidad publicada | No indexada | α 0.70–0.92 | α 0.70–0.93 | Adecuada (reportada) |
