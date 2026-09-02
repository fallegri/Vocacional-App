# Cuestionario de Intereses Profesionales Revisado (CIP-R)
## Algoritmo, Fórmulas y Confiabilidad

**Método:** CIP-R  
**Archivo del motor:** `web/lib/methods/cipr/engine.ts`  
**Fuente bibliográfica base:** Fogliatto, H., Pérez, E., Olaz, F. & Parodi, L. (2003). *Cuestionario de Intereses Profesionales Revisado (CIP-R). Análisis de sus Propiedades Psicométricas*. Revista Evaluar. Universidad Nacional de Córdoba, Argentina. Diseño original: Fogliatto, H. (1991, 1993).

---

## 1. Estructura del instrumento

El CIP-R evalúa **15 escalas primarias de interés profesional**:

| Código | Escala | Perfil de actividades |
|---|---|---|
| CAL | Cálculo | Operaciones cuantitativas, lógica matemática, estadística |
| CIE | Científica | Investigación de laboratorio, experimentación, descubrimiento de leyes |
| DIS | Diseño | Proyección estética de espacios, objetos, indumentaria, obras civiles |
| TEC | Tecnológica | Ciencia aplicada, informática, construcción, mantenimiento de maquinarias |
| GEO | Geoastronómica | Astronomía, geología, cartografía, sismos, atmósfera |
| NAT | Naturalista | Veterinaria, agricultura, botánica, preservación de flora y fauna |
| SAN | Sanitaria | Diagnóstico, tratamiento y prevención de patologías, cuidado clínico |
| ASI | Asistencial | Trabajo social, psicoterapia, asistencia a grupos vulnerables |
| JUR | Jurídica | Defensa de derechos, legislación, resolución de juicios |
| ECO | Económica | Administración, finanzas, comercialización, auditoría contable |
| COM | Comunicacional | Televisión, cine, periodismo digital, radio, producción de medios |
| HUM | Humanística | Historia, filosofía, literatura, antropología, comportamiento humano |
| ART | Artística | Dibujo, diseño gráfico, pintura, manualidades creativas |
| MUS | Musical | Ejecución de instrumentos, canto, composición, teoría musical |
| LIN | Lingüística | Comunicación oral/escrita, idiomas, lingüística aplicada |

- **Total de ítems:** 114
- **Distribución:** 9 escalas × 8 ítems + 6 escalas × 7 ítems = 72 + 42 = 114 ítems
- **Escala de respuesta:** Opción única entre 3 alternativas:

| Opción | Valor numérico asignado |
|---|---|
| Agrado (A) | **2** |
| Indiferencia (I) | **1** |
| Desagrado (D) | **0** |

> **Nota técnica:** El instrumento original usa las letras A/I/D. El motor las mapea a 2/1/0 para operacionalizar la suma numérica. No existe un estándar publicado de pesos numéricos para el CIP-R; este mapeo lineal es el más natural y conserva el orden ordinal.

---

## 2. Cálculo del puntaje por escala

### Paso 1: Suma del valor mapeado por escala

```
raw_e = Σ valor_i   para todos los ítems del ítem i pertenecientes a la escala e
```

Donde `valor_i ∈ {0, 1, 2}` según la respuesta A/I/D.

Los ítems sin respuesta no acumulan (cuentan como 0).

### Paso 2: Normalización (0–100)

```
maxPossible_e = MAX_PER_ITEM × cantidadDeItems_e = 2 × N_e
value_e = (raw_e / maxPossible_e) × 100
```

**Implementación en código:**
```typescript
const MAX_PER_ITEM = 2  // Agrado es el máximo
const raw = sums[scale]
const maxPossible = MAX_PER_ITEM * counts[scale]
const value = maxPossible > 0 ? (raw / maxPossible) * 100 : 0
```

**Ejemplo concreto (escala CAL con 8 ítems):**
```
Respuestas: [A, A, I, A, D, A, I, A]
Valores:    [2, 2, 1, 2, 0, 2, 1, 2]
raw_CAL = 2+2+1+2+0+2+1+2 = 12
maxPossible_CAL = 2 × 8 = 16
value_CAL = (12 / 16) × 100 = 75.0%
```

**Ejemplo (escala GEO con 7 ítems):**
```
Respuestas: [D, D, I, D, D, I, D]
Valores:    [0, 0, 1, 0, 0, 1, 0]
raw_GEO = 0+0+1+0+0+1+0 = 2
maxPossible_GEO = 2 × 7 = 14
value_GEO = (2 / 14) × 100 ≈ 14.3%
```

---

## 3. Determinación del perfil dominante

```
ranked = escalas ordenadas por raw_e descendente
         (desempate: índice de posición canónica en CIPR_SCALES_ORDER, menor índice gana)

dominantCodes = top 3 de ranked  →  ej. ["SAN", "ASI", "CIE"]
```

**Implementación en código:**
```typescript
const ranked = [...CIPR_SCALES_ORDER]
  .map((scale, index) => ({ scale, raw: sums[scale], index }))
  .sort((x, y) => y.raw !== x.raw ? y.raw - x.raw : x.index - y.index)

const dominantCodes = ranked.slice(0, 3).map(r => r.scale)
```

---

## 4. Interpretación del resultado

```
Si totalRaw == 0:
  "No se registraron respuestas con agrado, no es posible determinar intereses"

Si totalRaw > 0:
  "Tus intereses profesionales más altos se concentran en las escalas de
   {escala1}, {escala2} y {escala3}. Estas escalas reflejan las actividades
   académicas y laborales que más te agradan y hacia las que conviene
   orientar tu exploración vocacional."
```

---

## 5. Ejemplo completo de cálculo

```
Estudiante Sofía (sumas crudas por escala):
  CAL=14, CIE=12, DIS=10, TEC=8, GEO=4, NAT=9, SAN=15, ASI=13,
  JUR=11, ECO=7, COM=6, HUM=10, ART=8, MUS=3, LIN=12

Ranking por raw (descendente):
  1. SAN=15, 2. CAL=14, 3. ASI=13, 4. CIE=12, 5. LIN=12...
  (CIE y LIN empatan en 12; gana CIE por posición canónica anterior)

dominantCodes = ["SAN", "CAL", "ASI"]
dominantSummary = "Sanitaria, Cálculo, Asistencial"

interpretation:
  "Tus intereses profesionales más altos se concentran en las escalas de
   Sanitaria, Cálculo y Asistencial. Estas escalas reflejan..."

Valores normalizados (ej. SAN con 8 ítems):
  SAN: (15 / 16) × 100 = 93.75%
  CAL: (14 / 16) × 100 = 87.5%
  ASI: (13 / 16) × 100 = 81.25%  (si ASI tiene 8 ítems)
```

---

## 6. Confiabilidad y validez

### Origen y motivación del instrumento

Fogliatto et al. desarrollaron el CIP-R porque la aplicación directa de inventarios norteamericanos (Strong, Kuder, SDS de Holland) en Argentina presentaba:
- Problemas semánticos graves (béisbol, títulos de ocupaciones inexistentes en la región)
- Ítems con actividades desactualizadas o socialmente desprestigiadas localmente
- Baremos nacionales no disponibles

El CIP-R es el **primer instrumento latinoamericano de intereses profesionales con baremos locales** validado psicométricamente.

### Propiedades psicométricas (Fogliatto, Pérez, Olaz & Parodi, 2003)

| Propiedad | Resultado |
|---|---|
| Tipo de instrumento | 114 reactivos, respuesta única A/I/D |
| Muestra de validación | Estudiantes universitarios y bachillerato del Cono Sur |
| Método de confiabilidad | Alpha de Cronbach y test-retest |
| Estructura | 15 escalas primarias por análisis factorial |
| Validez | Discriminante entre grupos ocupacionales conocidos |
| Aplicación recomendada | **Desde los 15-17 años** (edad donde los intereses se estabilizan) |

> **Nota:** Los valores exactos de α por escala del CIP-R no están disponibles en las fuentes incluidas en `skills/knowledge/cuestionario-cip-r.md`. La cita original reporta consistencias internas adecuadas. Para los valores exactos, consultar Fogliatto et al. (2003).

### Comparación con el inventario de Strong y Kuder

El CIP-R parte de la misma tradición teórica (rasgos y factores de Parsons, 1909) pero:

| Aspecto | Strong (1927) | Kuder (1948) | CIP-R (2003) |
|---|---|---|---|
| Origen | EEUU | EEUU | Argentina (Cono Sur) |
| Formato | Agrado/Indiferencia/Desagrado | Elección forzada (tríadas) | Agrado/Indiferencia/Desagrado |
| Sesgos conocidos | Diferenciación por género original | Fatiga por longitud, baja confiabilidad en formato ipsativo | Diseñado para población latinoamericana |
| N° ítems | ~291 | Variable | 114 |
| Integración Holland | Adoptado a partir de los 90 | Adoptado a partir de los 90 | Independiente de Holland |

### Interpretación de la confiabilidad para el sistema

El mapeo A=2, I=1, D=0 produce una escala de razón ordinal. La consistencia interna reportada como "adecuada" por Fogliatto et al. es suficiente para uso orientativo en contextos educativos, pero el instrumento está diseñado para informar conversaciones vocacionales, **no para diagnósticos clínicos vinculantes**.

---

## 7. Diferencias clave con otros métodos del sistema

| Aspecto | CIP-R | RIASEC | CHASIDE | TIPOV |
|---|---|---|---|---|
| Escalas | 15 | 6 | 7 | 13 |
| Ítems | 114 | 60 | 98 | 66 |
| Escala respuesta | A/I/D (0,1,2) | Likert 1-5 | Sí/No (1,0) | Likert 1-3 |
| Mide aptitud | No | No | Sí | No |
| Región de origen | Argentina | EEUU | América Latina | Chile |
| Edad recomendada | 15-17+ años | Sin restricción | Estudiantes medios | Estudiantes medios |
