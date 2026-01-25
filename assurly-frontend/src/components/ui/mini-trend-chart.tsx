export interface TrendDataPoint {
  overallScore: number;
  term?: string;
  academicYear?: string;
}

interface MiniTrendChartProps {
  data: number[] | TrendDataPoint[];
  className?: string;
  color?: string;
  width?: number;
  height?: number;
}

export function MiniTrendChart({ 
  data, 
  className = "", 
  color = "#3b82f6",
  width = 60,
  height = 20
}: MiniTrendChartProps) {
  if (data.length < 2) return null;

  const pointsData: Array<{ value: number; label?: string }> = data.map((d) => {
    if (typeof d === "number") return { value: d };
    const termPart = d.term ? d.term.split("-")[0] : undefined;
    const yearPart = d.academicYear || (d.term ? d.term.split("-").slice(1).join("-") : undefined);
    const label = termPart && yearPart ? `${termPart} ${yearPart}` : d.term;
    return { value: d.overallScore, label };
  });

  // Extract numeric values from data
  const values = pointsData.map((d) => d.value);

  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;

  // Calculate points for SVG polyline
  const padding = 2;

  const computedPoints = values.map((value, index) => {
    const x = padding + (index / (values.length - 1)) * (width - padding * 2);
    const y = height - padding - ((value - min) / range) * (height - padding * 2);
    return { x, y, value, label: pointsData[index]?.label };
  });

  const polylinePoints = computedPoints.map((p) => `${p.x},${p.y}`).join(" ");

  return (
    <svg
      width={width}
      height={height}
      className={className}
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
    >
      <polyline
        points={polylinePoints}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Point-in-time markers + hover tooltip via <title> */}
      {computedPoints.map((p, idx) => (
        <circle
          key={idx}
          cx={p.x}
          cy={p.y}
          r={2.6}
          fill={color}
          stroke="#ffffff"
          strokeWidth={1.5}
        >
          <title>
            {`${p.label ? `${p.label}: ` : ""}${p.value.toFixed(1)}`}
          </title>
        </circle>
      ))}
    </svg>
  );
}
