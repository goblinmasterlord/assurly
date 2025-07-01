import React from "react";

export interface TrendDataPoint {
  term: string;
  overallScore: number;
}

interface MiniTrendChartProps {
  data: TrendDataPoint[];
  width?: number;
  height?: number;
  className?: string;
}

export function MiniTrendChart({ 
  data, 
  width = 120, 
  height = 40, 
  className = "" 
}: MiniTrendChartProps) {
  if (!data || data.length < 2) {
    return (
      <div 
        className={`flex items-center justify-center text-slate-400 ${className}`}
        style={{ width, height }}
      >
        <span className="text-xs">No data</span>
      </div>
    );
  }

  // Calculate min and max values for scaling
  const scores = data.map(d => d.overallScore);
  const minScore = Math.min(...scores);
  const maxScore = Math.max(...scores);
  const range = maxScore - minScore || 1; // Avoid division by zero

  // Padding for the chart
  const padding = 4;
  const chartWidth = width - (padding * 2);
  const chartHeight = height - (padding * 2);

  // Calculate points for the line
  const points = data.map((d, index) => {
    const x = padding + (index / (data.length - 1)) * chartWidth;
    const y = padding + chartHeight - ((d.overallScore - minScore) / range) * chartHeight;
    return { x, y };
  });

  // Create smooth curve path using quadratic Bézier curves
  const createSmoothPath = (points: { x: number; y: number }[]) => {
    if (points.length < 2) return "";
    
    let path = `M ${points[0].x} ${points[0].y}`;
    
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      
      if (i === 1) {
        // First curve - use simple quadratic
        const midX = (prev.x + curr.x) / 2;
        path += ` Q ${midX} ${prev.y} ${curr.x} ${curr.y}`;
      } else {
        // Subsequent curves - create smooth connection
        const prevPrev = points[i - 2];
        const controlX = prev.x + (curr.x - prevPrev.x) * 0.2;
        const controlY = prev.y + (curr.y - prevPrev.y) * 0.2;
        path += ` Q ${controlX} ${controlY} ${curr.x} ${curr.y}`;
      }
    }
    
    return path;
  };

  const pathD = createSmoothPath(points);

  // Determine trend color based on overall direction
  const isUptrend = data[data.length - 1].overallScore > data[0].overallScore;
  const isFlat = Math.abs(data[data.length - 1].overallScore - data[0].overallScore) < 0.1;
  
  let strokeColor = "#64748b"; // slate-500 (neutral)
  if (!isFlat) {
    strokeColor = isUptrend ? "#10b981" : "#ef4444"; // emerald-500 or red-500
  }

  return (
    <div className={`inline-block ${className}`}>
      <svg width={width} height={height} className="overflow-visible">
        {/* Background grid (optional, very subtle) */}
        <defs>
          <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
            <path d="M 10 0 L 0 0 0 10" fill="none" stroke="#f1f5f9" strokeWidth="0.5"/>
          </pattern>
        </defs>
        
        {/* Main trend line */}
        <path
          d={pathD}
          fill="none"
          stroke={strokeColor}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="drop-shadow-sm"
        />
        
        {/* Data points */}
        {points.map((point, index) => (
          <circle
            key={index}
            cx={point.x}
            cy={point.y}
            r="2"
            fill={strokeColor}
            className="drop-shadow-sm"
          />
        ))}
        
        {/* Subtle area under curve for depth */}
        <path
          d={`${pathD} L ${points[points.length - 1].x} ${height} L ${points[0].x} ${height} Z`}
          fill={strokeColor}
          fillOpacity="0.1"
        />
      </svg>
    </div>
  );
} 