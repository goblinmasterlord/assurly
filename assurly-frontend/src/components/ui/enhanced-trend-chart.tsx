import { LineChart, Line, ResponsiveContainer, Tooltip } from "recharts";
import { cn } from "@/lib/utils";

export interface TrendDataPoint {
  overallScore: number;
  term?: string;
  academicYear?: string;
}

interface EnhancedTrendChartProps {
  data: number[] | TrendDataPoint[];
  className?: string;
  color?: string;
  width?: number;
  height?: number;
}

// Custom tooltip component for better UX
const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload as { score: number; label?: string };
    const score = data.score;
    const label = data.label || `Score: ${score.toFixed(1)}`;
    
    return (
      <div className="bg-slate-900 text-white px-2 py-1 rounded text-xs shadow-lg border border-slate-700">
        <p className="font-medium">{label}</p>
        <p className="text-slate-300">Score: {score.toFixed(1)}</p>
      </div>
    );
  }
  return null;
};

export function EnhancedTrendChart({ 
  data, 
  className = "", 
  color = "#3b82f6",
  width = 80,
  height = 28
}: EnhancedTrendChartProps) {
  if (data.length < 2) return null;

  // Transform data for Recharts
  const chartData = data.map((d, index) => {
    if (typeof d === "number") {
      return { 
        name: `Point ${index + 1}`, 
        score: d,
        label: undefined
      };
    }
    
    // Format term label (e.g., "T2 2024-25")
    const termPart = d.term ? d.term.split("-")[0] : undefined;
    const yearPart = d.academicYear || (d.term ? d.term.split("-").slice(1).join("-") : undefined);
    const label = termPart && yearPart ? `${termPart} ${yearPart}` : d.term;
    
    return {
      name: label || `Point ${index + 1}`,
      score: d.overallScore,
      label
    };
  });

  return (
    <div className={cn("relative", className)} style={{ width, height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart 
          data={chartData}
          margin={{ top: 2, right: 2, bottom: 2, left: 2 }}
        >
          <Line
            type="monotone"
            dataKey="score"
            stroke={color}
            strokeWidth={2}
            dot={{
              r: 2.5,
              fill: color,
              stroke: "#ffffff",
              strokeWidth: 1.5
            }}
            activeDot={{
              r: 4,
              fill: color,
              stroke: "#ffffff",
              strokeWidth: 2
            }}
            isAnimationActive={false}
          />
          <Tooltip
            content={<CustomTooltip />}
            cursor={{
              stroke: color,
              strokeWidth: 1,
              strokeDasharray: "3 3"
            }}
            animationDuration={0}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
