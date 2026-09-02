# Test RIASEC / Inventario de Holland
## Algoritmo, Fórmulas y Confiabilidad

**Método:** RIASEC (Holland)  
**Archivo del motor:** `web/lib/riasec/engine.ts`  
**Fuente bibliográfica base:** Holland, J. L. (1997). *Making Vocational Choices* (3ª ed.). Odessa, FL: PAR. Normalización O*NET.

---

## 1. Estructura del instrumento

| Dimensión | Código | Descripción |
|---|---|---|
| Realista | R | Trabajo práctico, mecánico, físico, herramientas, naturaleza |
| Investigador | I | Científico, analítico, investigación, ciencia de datos |
| Artístico | A | Creativo, diseño visual, música, narrativa |
| Social | S | Empatía, educación, psicología, servicio comunitario |
| Emprendedor | E | Liderazgo, negociación, negocios, estrategia |
| Convencional | C | Estructurado, metódico, finanzas, contabilidad |

- **Total de ítems:** 60 (10 por dimensión)
- **Escala de respuesta:** Likert de 5 puntos (1 = Nada, 5 = Totalmente)
- **Pares espejo de control (ítems de consistencia):**
  - Ítem 1 ↔ Ítem 7 (R)
  - Ítem 11 ↔ Ítem 17 (I)
  - Ítem 21 ↔ Ítem 27 (A)
  - Ítem 31 ↔ Ítem 37 (S)
  - Ítem 41 ↔ Ítem 47 (E)
  - Ítem 51 ↔ Ítem 57 (C)

---

## 2. Cálculo del puntaje por dimensión

### Fórmula de normalización

Para cada dimensión `d` con `N_d` ítems respondidos:

```
Score_d = [ Σ (respuesta_i − 1) / (4 × N_d) ] × 100
```

Donde:
- `respuesta_i ∈ {1, 2, 3, 4, 5}` → se convierte a rango `[0, 4]` restando 1
- `4 × N_d` es el puntaje máximo posible
- El resultado es `Score_d ∈ [0, 100]`

**Implementación en código:**
```typescript
const score_i = clamp(respuesta - 1, 0, 4)  // rango 0-4
const maxPossible = 4 * answeredCount
Score_d = clamp((sumShifted / maxPossible) * 100, 0, 100)
```

**Ejemplo concreto:**
```
Dimensión R, 10 ítems, respuestas: [5, 4, 3, 5, 4, 3, 5, 2, 4, 5]
Suma shifted: (4+3+2+4+3+2+4+1+3+4) = 30
maxPossible = 4 × 10 = 40
Score_R = (30 / 40) × 100 = 75%
```

---

## 3. Determinación del perfil dominante

```
DominantCode = top3Dimensions ordenadas de mayor a menor Score
```

Ejemplo: si `I=82`, `R=75`, `E=61`, el código dominante es `"IRE"`.

La función `getDominantProfileDescription()` mapea el prefijo de 2 letras a una descripción en español del perfil (ej. `"IR"` → *"Perfil Tecnológico e Investigativo"*). Hay 15 combinaciones de 2 letras definidas; el resto cae en *"Perfil Multifacético"*.

---

## 4. Control de calidad de respuestas

### 4a. Trampa de velocidad (Speed Trap)

```
avgTime = media(tiempos por ítem en ms)
speedTrapTriggered = (avgTime < 1100ms) AND (ítems con tiempo > 0 >= 10)
```

Si se activa: nivel de fiabilidad degradado. Umbral: 1100 ms/ítem.

### 4b. Patrón recto (Straight-lining)

```
maxFrequency = frecuencia del valor más repetido
repetitionRatio = maxFrequency / totalRespuestas
straightLiningDetected = (repetitionRatio >= 0.75) AND (totalRespuestas >= 15)
```

Si el 75 % o más de las respuestas son idénticas con ≥15 ítems, se detecta monotonía.

### 4c. Consistencia de pares espejo

Para cada par espejo `(ítem_a, ítem_b)` que miden la misma dimensión desde ángulos opuestos:

```
diff = |respuesta_a − respuesta_b|
penalty += 20 si diff >= 3
penalty += 10 si diff == 2
mirrorConsistencyPercent = clamp(100 − totalPenalty, 40, 100)
```

### 4d. Nivel de fiabilidad resultante

| Condición | Nivel |
|---|---|
| `!isValid OR mirrorConsistency < 60` | **Baja** |
| `speedTrap OR mirrorConsistency < 80` | **Moderada** |
| De lo contrario | **Alta** |

La sesión se marca `isValid = false` si:
- Se detectó straight-lining, **O**
- Se activó la trampa de velocidad **Y** `mirrorConsistency < 60`

---

## 5. Emparejamiento de carreras

El sistema compara el vector del usuario `U = [R, I, A, S, E, C]` contra el vector ideal `C_k = [R_k, I_k, A_k, S_k, E_k, C_k]` de cada carrera usando una **combinación ponderada de similitud coseno y proximidad euclidiana**.

### Fórmula de afinidad

```
cosineSim = (U · C_k) / (‖U‖ × ‖C_k‖)

euclidean_dist² = Σ [(U_i − C_k_i) / 100]²  (para i ∈ R,I,A,S,E,C)
euclidean_dist = √(euclidean_dist²)            // máx. teórico ≈ √6 ≈ 2.449
euclidean_proximity = clamp(1 − euclidean_dist / 2.45, 0, 1)

affinity = (0.70 × cosineSim + 0.30 × euclidean_proximity) × 100
```

### Boost por dimensión dominante coincidente

Si la dimensión dominante del usuario coincide con la dimensión dominante de la carrera:

```
affinity = min(affinity × 1.05, 99.5)
```

### Clamping final

```
finalAffinity = clamp(affinity, 30, 99)
```

### Umbrales de nivel de coincidencia

| Afinidad | Etiqueta |
|---|---|
| ≥ 88 | Compatibilidad Excelente |
| ≥ 78 | Alta Afinidad |
| ≥ 68 | Buena Afinidad |
| < 68 | Afinidad Moderada |

---

## 6. Confiabilidad y validez

| Propiedad | Valor | Fuente |
|---|---|---|
| Base teórica | Modelo hexagonal RIASEC de Holland (1959–1997) | Holland (1997) |
| Consistencia interna (α Cronbach) | 0.70 – 0.92 según escala y muestra | Múltiples estudios O*NET |
| Estabilidad test-retest (8 semanas) | r = 0.76 – 0.89 | Holland & Gottfredson (1994) |
| Validez de constructo | Confirmada por AFC en múltiples culturas | Tracey & Rounds (1993) |
| Validez predictiva | Predice satisfacción laboral y permanencia | Spokane et al. (2000) |
| Normalización en aplicación | O*NET 28.0 (2023), 1000+ ocupaciones | U.S. Department of Labor |

### Control de calidad del sistema

La triple heurística (speed trap + straight-lining + pares espejo) es una salvaguarda adicional de la implementación, no parte del instrumento original de Holland. Permite detectar respuestas aleatorias o apresuradas antes de entregar el diagnóstico.

---

## 7. Catálogo de carreras en la aplicación

16 carreras con vectores ideales RIASEC calibrados, que incluyen:
Ingeniería de Software e IA, Biotecnología, Diseño Digital UX/UI, Medicina Humana, Administración y Startups, Ciencia de Datos, Psicología Clínica, Robótica y Mecatrónica, Arquitectura, Ciberseguridad, Marketing Digital, Ingeniería Ambiental, Derecho y RRII, Contabilidad y Finanzas, Comunicación Audiovisual, Pedagogía.
