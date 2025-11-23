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

  // Extract numeric values from data
  const values = data.map(d => typeof d === 'number' ? d : d.overallScore);

  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;

  // Calculate points for SVG polyline
  const padding = 2;

  const points = values
    .map((value, index) => {
      const x = padding + (index / (values.length - 1)) * (width - padding * 2);
      const y = height - padding - ((value - min) / range) * (height - padding * 2);
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg
      width={width}
      height={height}
      className={className}
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
    >
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
