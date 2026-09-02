# Documentación Técnica — Métodos de Orientación Vocacional

Documentación detallada del algoritmo, fórmulas de cálculo y confiabilidad de cada uno de los 5 instrumentos de orientación vocacional implementados en OrientApp.

Cada documento describe:
- La estructura del instrumento (dimensiones, ítems, escala)
- La fórmula exacta de cálculo con ejemplos numéricos
- El mecanismo de determinación del perfil dominante
- La interpretación del resultado
- Las propiedades psicométricas (confiabilidad y validez)

---

## Documentos disponibles

| # | Método | Ítems | Escala | Documento |
|---|---|---|---|---|
| 1 | **RIASEC / Holland** | 60 | Likert 1–5 | [01-RIASEC-Holland.md](./01-RIASEC-Holland.md) |
| 2 | **CHASIDE** | 98 | Sí/No (dicotómica) | [02-CHASIDE.md](./02-CHASIDE.md) |
| 3 | **TIPOV** | 66 | Likert 3 pts | [03-TIPOV.md](./03-TIPOV.md) |
| 4 | **CIP-R** | 114 | Agrado/Indiferencia/Desagrado | [04-CIP-R.md](./04-CIP-R.md) |
| 5 | **Magdalena Contreras** | 120 | Escala 0–4 (doble cuestionario) | [05-Magdalena-Contreras.md](./05-Magdalena-Contreras.md) |

---

## Comparativa rápida de algoritmos

| Método | ¿Cómo puntúa? | ¿Mide aptitud? | Perfil dominante |
|---|---|---|---|
| **RIASEC** | `Σ(item−1)/(4×N)×100` por dimensión | No | Top 3 dimensiones por puntaje normalizado |
| **CHASIDE** | Conteo de "Sí" separado por Interés/Aptitud | Sí (separado) | Top 2 áreas por conteo de Interés |
| **TIPOV** | `Σraw/(3×N)×100` por dimensión | No | Top 3 dimensiones por suma cruda |
| **CIP-R** | `Σvalor/(2×N)×100` con A=2,I=1,D=0 | No | Top 3 escalas por suma cruda |
| **Magdalena** | `Σvalor` (0–24 por campo) separado I y A, con bandas | Sí (cuestionario paralelo) | Top 3 campos por suma de Interés |

---

## Fórmula unificada

Todos los métodos (excepto CHASIDE y Magdalena que tienen lógica específica) siguen el patrón:

```
value_d = (raw_d / maxPossible_d) × 100

Donde:
  raw_d        = suma de los valores numéricos de las respuestas en la dimensión d
  maxPossible_d = valor_máximo_por_ítem × número_de_ítems_en_d
```

| Método | Valor máximo por ítem | Base del cálculo |
|---|---|---|
| RIASEC | 4 (respuesta 5 → 5-1=4) | Respuesta Likert desplazada |
| TIPOV | 3 ("Me agrada") | Respuesta Likert directa |
| CIP-R | 2 ("Agrado") | Mapeo A=2, I=1, D=0 |

---

## Niveles de confiabilidad (resumen)

| Método | Alpha Cronbach | Muestra de validación | Fuente |
|---|---|---|---|
| RIASEC | 0.70 – 0.92 | Global (O*NET) | Holland (1997) + múltiples |
| CHASIDE | **α = 0.92 – 0.93** | 715 estudiantes (Honduras), estudiantes Ecuador | Menjívar Alas (2026); Morales & Gálvez (2018) |
| TIPOV | **α ordinal 0.84 – 0.94** | 568 estudiantes secundarios (Chile) | Carrasco, Zúñiga & Asún (2021) |
| CIP-R | Adecuada (no publicada en detalle) | Universitarios y bachillerato (Argentina) | Fogliatto et al. (2003) |
| Magdalena | No indexada | Uso público (México) | Alcaldía La Magdalena Contreras (2021) |

---

## Archivos del motor en el sistema

```
web/lib/riasec/engine.ts           → RIASEC
web/lib/methods/chaside/engine.ts  → CHASIDE
web/lib/methods/tipov/engine.ts    → TIPOV
web/lib/methods/cipr/engine.ts     → CIP-R
web/lib/methods/magdalena/engine.ts → Magdalena Contreras
```

Los tests unitarios de cada motor están en `web/tests/`:
```
web/tests/engine.test.ts           → RIASEC
web/tests/chaside-engine.test.ts   → CHASIDE
web/tests/tipov-engine.test.ts     → TIPOV
web/tests/cipr-engine.test.ts      → CIP-R
web/tests/magdalena-engine.test.ts → Magdalena Contreras
```
