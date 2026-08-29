"use client";

import {
  DIMENSION_ORDER,
  DIMENSION_META,
  type PsychometricScores,
  type DimensionCode,
} from "@/lib/riasec/types";

/**
 * Radar hexagonal RIASEC (6 ejes: R, I, A, S, E, C) dibujado con SVG.
 * Puerto del Canvas de app/src/main/java/com/example/ui/components/RadarChart.kt:
 * - anillos de guía concéntricos (20%, 40%, 60%, 80%, 100%)
 * - líneas de eje y etiquetas con el color de cada dimensión
 * - polígono relleno con los puntajes normalizados 0-100
 * - vértices con halo/punto por dimensión
 * SVG usa el eje Y hacia abajo, igual que el Canvas de Compose, por lo que la
 * trigonometría (inicio en -PI/2, sentido horario) se traslada directamente.
 */

function scoreFor(scores: PsychometricScores, code: DimensionCode): number {
  switch (code) {
    case "R":
      return scores.r;
    case "I":
      return scores.i;
    case "A":
      return scores.a;
    case "S":
      return scores.s;
    case "E":
      return scores.e;
    case "C":
      return scores.c;
  }
}

const clamp = (v: number, min: number, max: number) =>
  Math.min(max, Math.max(min, v));

export interface RadarChartProps {
  scores: PsychometricScores;
  size?: number;
  /** Color del polígono de puntajes del usuario. */
  fillColor?: string;
}

export default function RadarChart({
  scores,
  size = 360,
  fillColor = "#76b900",
}: RadarChartProps) {
  const center = size / 2;
  // Deja margen para las etiquetas fuera del anillo del 100%.
  const maxRadius = center - 52;
  const numAxes = DIMENSION_ORDER.length;
  const angleStep = (2 * Math.PI) / numAxes;
  const startAngle = -Math.PI / 2; // arranca arriba

  const point = (angle: number, radius: number): [number, number] => [
    center + radius * Math.cos(angle),
    center + radius * Math.sin(angle),
  ];

  const rings = [0.2, 0.4, 0.6, 0.8, 1.0];

  const ringPolygon = (ratio: number): string =>
    DIMENSION_ORDER.map((_, i) => {
      const [x, y] = point(startAngle + i * angleStep, maxRadius * ratio);
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    }).join(" ");

  const dataPoints = DIMENSION_ORDER.map((code, i) => {
    const angle = startAngle + i * angleStep;
    const score = clamp(scoreFor(scores, code), 0, 100);
    const radius = maxRadius * (score / 100);
    const [x, y] = point(angle, radius);
    return { code, angle, score, x, y };
  });

  const dataPolygon = dataPoints
    .map((p) => `${p.x.toFixed(2)},${p.y.toFixed(2)}`)
    .join(" ");

  return (
    <svg
      data-testid="riasec-radar-chart"
      role="img"
      aria-label="Radar hexagonal de dimensiones RIASEC"
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      style={{ maxWidth: "100%", height: "auto" }}
    >
      {/* 1. Anillos hexagonales concéntricos */}
      {rings.map((ratio) => (
        <polygon
          key={`ring-${ratio}`}
          points={ringPolygon(ratio)}
          fill="none"
          stroke="#e6edf3"
          strokeOpacity={ratio === 1 ? 0.25 : 0.1}
          strokeWidth={ratio === 1 ? 1.5 : 1}
        />
      ))}

      {/* 2. Ejes y etiquetas */}
      {DIMENSION_ORDER.map((code, i) => {
        const angle = startAngle + i * angleStep;
        const [ex, ey] = point(angle, maxRadius);
        const [lx, ly] = point(angle, maxRadius + 30);
        const meta = DIMENSION_META[code];
        const score = clamp(scoreFor(scores, code), 0, 100);
        return (
          <g key={`axis-${code}`}>
            <line
              x1={center}
              y1={center}
              x2={ex}
              y2={ey}
              stroke="#e6edf3"
              strokeOpacity={0.15}
              strokeWidth={1}
            />
            <text
              x={lx}
              y={ly}
              fill={meta.color}
              fontSize={13}
              fontWeight={700}
              textAnchor="middle"
              dominantBaseline="middle"
            >
              {`${code} (${Math.round(score)}%)`}
            </text>
          </g>
        );
      })}

      {/* 3. Polígono de puntajes del usuario */}
      <polygon
        points={dataPolygon}
        fill={fillColor}
        fillOpacity={0.28}
        stroke={fillColor}
        strokeWidth={3}
        strokeLinejoin="round"
      />

      {/* 4. Vértices por dimensión */}
      {dataPoints.map((p) => {
        const color = DIMENSION_META[p.code].color;
        return (
          <g key={`vertex-${p.code}`}>
            <circle cx={p.x} cy={p.y} r={5.5} fill={color} fillOpacity={0.35} />
            <circle cx={p.x} cy={p.y} r={3.5} fill={color} />
            <circle cx={p.x} cy={p.y} r={1.6} fill="#ffffff" />
          </g>
        );
      })}
    </svg>
  );
}
