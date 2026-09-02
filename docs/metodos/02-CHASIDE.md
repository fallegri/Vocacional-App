# Test de Orientación Vocacional CHASIDE
## Algoritmo, Fórmulas y Confiabilidad

**Método:** CHASIDE  
**Archivo del motor:** `web/lib/methods/chaside/engine.ts`  
**Fuente bibliográfica base:** Menjívar Alas, R. (2026). *Propiedades psicométricas del test vocacional CHASIDE en estudiantes de bachillerato hondureño*. MLS-Psychology Research. / Morales, M. F. & Gálvez, S. A. H. (2018). *Adaptación y validación de la batería Chaside: estudio con estudiantes ecuatorianos*. Uniandes EPISTEME.

---

## 1. Estructura del instrumento

El nombre CHASIDE es un acrónimo de las 7 áreas profesionales que evalúa:

| Letra | Área | Perfil típico |
|---|---|---|
| **C** | Ciencias Biológicas y Exactas | Investigación experimental, biología, química, matemáticas |
| **H** | Humanístico, Social y Jurídico | Ciencias sociales, derecho, comunicación, filosofía |
| **A** | Arte | Expresión creativa, diseño, música, teatro, arquitectura |
| **S** | Salud y Medicina | Medicina, enfermería, psicología clínica, fisioterapia |
| **I** | Intereses Técnicos (Ingeniería) | Ingeniería, computación, sistemas, electrónica |
| **D** | Defensa y Seguridad | Fuerzas armadas, seguridad civil, bomberos, rescate |
| **E** | Económico-Empresarial | Administración, finanzas, negocios, comercio |

- **Total de ítems:** 98 (distribuidos entre Interés y Aptitud)
  - **70 ítems de Interés:** 10 por cada una de las 7 áreas
  - **28 ítems de Aptitud:** 4 por cada una de las 7 áreas
- **Escala de respuesta:** Dicotómica — **Sí (1) / No (0)**

---

## 2. Cálculo de puntajes

El test mide **dos dimensiones separadas** para cada área: **Interés** y **Aptitud**.

### Paso 1: Conteo de respuestas afirmativas

Para cada área `a ∈ {C, H, A, S, I, D, E}`:

```
Interés_a   = Σ respuestas "Sí" en los 10 ítems de Interés del área a
Aptitud_a   = Σ respuestas "Sí" en los 4 ítems de Aptitud del área a
```

Rango: `Interés_a ∈ [0, 10]` y `Aptitud_a ∈ [0, 4]`

**Implementación en código:**
```typescript
// Solo los "Sí" (value === 1) suman
if (q.category === "APTITUD") counts.aptitud[area] += 1  // ítem de aptitud
else                           counts.interes[area] += 1  // ítem de interés
```

### Paso 2: Perfil de Interés (las 2 áreas más altas)

```
topInteres = [área_1, área_2]  ordenadas de mayor a menor Interés_a
                                 (desempate: orden canónico CHASIDE)
```

### Paso 3: Perfil de Aptitud (las 2 áreas más altas)

```
topAptitud = [área_1, área_2]  ordenadas de mayor a menor Aptitud_a
```

### Paso 4: Puntaje normalizado compuesto por área (0–100)

Para las visualizaciones y comparaciones relativas, el motor calcula un valor combinado:

```
raw_a  = Interés_a + Aptitud_a                 // suma total (máx. 14)
value_a = (raw_a / (10 + 4)) × 100            // normalizado 0-100
```

Es decir, el máximo posible por área es `10 + 4 = 14` respuestas afirmativas.

**Ejemplo concreto:**
```
Área S (Salud):
  Interés: 8 "Sí" de 10  →  Interés_S = 8
  Aptitud: 3 "Sí" de 4   →  Aptitud_S = 3
  raw_S  = 8 + 3 = 11
  value_S = (11 / 14) × 100 ≈ 78.6%
```

---

## 3. Determinación del perfil y código dominante

```
dominantCodes = topInteres  // el perfil dominante se forma con los intereses
```

El código dominante en el sistema es la concatenación de las 2 áreas con mayor interés, ej. `"SI"` para Salud-Ingeniería.

---

## 4. Interpretación del resultado

El sistema genera la interpretación en 3 partes:

1. **Áreas de interés dominantes:** `topInteres[0]` y `topInteres[1]`
2. **Áreas de aptitud dominantes:** `topAptitud[0]` y `topAptitud[1]`
3. **Análisis de congruencia:** compara si `topInteres[0] == topAptitud[0]`

```typescript
const alignment = topInteres[0] === topAptitud[0]

si alignment:
  "Tu área de mayor aptitud coincide con tu principal interés → fuerte congruencia"
sino:
  "Tu área de mayor aptitud difiere de tu principal interés → conviene reflexionar"
```

Esta congruencia interés-aptitud es uno de los predictores más importantes de satisfacción vocacional según la teoría de Holland aplicada al CHASIDE.

---

## 5. Ejemplo completo de cálculo

```
Estudiante María:
  Ítems de Interés respondidos con "Sí":
    C=3, H=7, A=5, S=9, I=4, D=1, E=6

  Ítems de Aptitud respondidos con "Sí":
    C=2, H=3, A=2, S=4, I=2, D=0, E=3

Ordenadas por Interés: S(9) > H(7) > E(6) > A(5) > I(4) > C(3) > D(1)
  topInteres = ["S", "H"]

Ordenadas por Aptitud: S(4) > H(3) > E(3) > C(2) > A(2) > I(2) > D(0)
  topAptitud = ["S", "H"]  (H y E empatan en 3; gana H por orden canónico)

dominantCodes = ["S", "H"]
alignment = true  (S == S) → fuerte congruencia

Puntajes normalizados:
  S: (9+4)/14 × 100 = 92.9%
  H: (7+3)/14 × 100 = 71.4%
  E: (6+3)/14 × 100 = 64.3%
  A: (5+2)/14 × 100 = 50.0%
  I: (4+2)/14 × 100 = 42.9%
  C: (3+2)/14 × 100 = 35.7%
  D: (1+0)/14 × 100 = 7.1%
```

---

## 6. Confiabilidad y validez

### Validación en Honduras (Menjívar Alas, 2026)

| Propiedad | Valor |
|---|---|
| Muestra | 715 estudiantes de bachillerato público (último año) |
| Alpha de Cronbach (total) | **α = 0.92** |
| Omega de McDonald (total) | **Ω = 0.93** |
| Confiabilidad por factores | α entre 0.70 (A, H) y 0.77 (E) |
| Estructura factorial | Unidimensional con 7 factores de 2.º orden (AFC) |
| Mejor carga factorial | Área H (Humanístico-Social) |

### Validación en Ecuador (Morales & Gálvez, 2018)

| Propiedad | Valor |
|---|---|
| Consistencia interna (total) | **α = 0.93** |
| Instrumento | Autorreporte dicotómico adaptado |

### Estudio de correspondencia en Colombia (Tamayo Lopera et al., 2018)

| Resultado | Porcentaje |
|---|---|
| Correspondencia por interés con carrera cursada | 58.3 % |
| Correspondencia por aptitud con carrera cursada | 44.4 % |
| Mayor correspondencia simultánea | Administración de Negocios (70.8 % aptitud, 54.2 % interés) |

### Interpretación de la confiabilidad

Un **α = 0.92** indica una consistencia interna **excelente** según los criterios de George & Mallery (2003): α > 0.90 = excelente. Esto significa que los 98 ítems del test miden de forma muy coherente el constructo vocacional que pretenden medir.

---

## 7. Diferencia clave con RIASEC

| Aspecto | RIASEC | CHASIDE |
|---|---|---|
| Dimensiones | 6 | 7 |
| Escala | Likert 1-5 | Dicotómica Sí/No |
| Mide aptitud | No (solo interés) | Sí (separado del interés) |
| Validación regional | EEUU/global (O*NET) | América Latina (Honduras, Ecuador, Colombia) |
| Congruencia interés-aptitud | No calculada | Calculada explícitamente |
