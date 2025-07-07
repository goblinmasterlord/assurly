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

  // Use fixed 1-4 scale for consistent representation
  const minScale = 1;
  const maxScale = 4;
  const range = maxScale - minScale;

  // Padding for the chart
  const padding = 4;
  const chartWidth = width - (padding * 2);
  const chartHeight = height - (padding * 2);

  // Calculate points for the line with fixed scale
  const points = data.map((d, index) => {
    const x = padding + (index / (data.length - 1)) * chartWidth;
    const y = padding + chartHeight - ((d.overallScore - minScale) / range) * chartHeight;
    return { x, y, score: d.overallScore };
  });

  // Create smooth curve path using quadratic Bézier curves
  const createSmoothPath = (points: { x: number; y: number; score: number }[]) => {
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
  
  // Helper to get Y position for a score value
  const getYForScore = (score: number) => {
    return padding + chartHeight - ((score - minScale) / range) * chartHeight;
  };

  const pathD = createSmoothPath(points);

  // Determine colors based on current performance level
  const currentScore = data[data.length - 1].overallScore;
  let strokeColor = "#64748b"; // slate-500 (default)
  
  if (currentScore >= 3.5) {
    strokeColor = "#10b981"; // emerald-500 (Outstanding)
  } else if (currentScore >= 2.5) {
    strokeColor = "#6366f1"; // indigo-500 (Good)
  } else if (currentScore >= 1.5) {
    strokeColor = "#f59e0b"; // amber-500 (Requires Improvement)
  } else {
    strokeColor = "#ef4444"; // red-500 (Inadequate)
  }

  return (
    <div className={`inline-block relative ${className}`}>
      <svg width={width} height={height} className="overflow-visible">
        {/* Performance zone backgrounds */}
        <g opacity="0.15">
          {/* Outstanding zone (3.5-4) */}
          <rect
            x={padding}
            y={getYForScore(4)}
            width={chartWidth}
            height={getYForScore(3.5) - getYForScore(4)}
            fill="#10b981"
          />
          {/* Good zone (2.5-3.5) */}
          <rect
            x={padding}
            y={getYForScore(3.5)}
            width={chartWidth}
            height={getYForScore(2.5) - getYForScore(3.5)}
            fill="#6366f1"
          />
          {/* Requires Improvement zone (1.5-2.5) */}
          <rect
            x={padding}
            y={getYForScore(2.5)}
            width={chartWidth}
            height={getYForScore(1.5) - getYForScore(2.5)}
            fill="#f59e0b"
          />
          {/* Inadequate zone (1-1.5) */}
          <rect
            x={padding}
            y={getYForScore(1.5)}
            width={chartWidth}
            height={getYForScore(1) - getYForScore(1.5)}
            fill="#ef4444"
          />
        </g>
        
        {/* Reference lines at key thresholds */}
        <g opacity="0.2">
          <line x1={padding} y1={getYForScore(2.5)} x2={width - padding} y2={getYForScore(2.5)} stroke="#64748b" strokeWidth="1" strokeDasharray="2,2" />
        </g>
        
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
        
        {/* Data points with values */}
        {points.map((point, index) => (
          <g key={index}>
            <circle
              cx={point.x}
              cy={point.y}
              r="3"
              fill="white"
              stroke={strokeColor}
              strokeWidth="2"
            />
            {/* Show value for first and last points */}
            {(index === 0 || index === points.length - 1) && (
              <text
                x={point.x}
                y={point.y - 6}
                textAnchor="middle"
                fontSize="9"
                fill={strokeColor}
                fontWeight="600"
              >
                {point.score.toFixed(1)}
              </text>
            )}
          </g>
        ))}
      </svg>
    </div>
  );
} 