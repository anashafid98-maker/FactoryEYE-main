// ZoomableChart.tsx
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface ZoomableChartProps {
  data: Array<Record<string, any>>;
  lines: Array<{ dataKey: string; color: string; name?: string; strokeDasharray?: string }>;
  xAxisDataKey: string;
  title: string;
}

export default function ZoomableChart({ data, lines, xAxisDataKey, title }: ZoomableChartProps) {
  return (
    <div className="bg-white p-4 rounded-lg shadow-md">
      <h3 className="font-bold mb-4">{title}</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={xAxisDataKey} />
            <YAxis />
            <Tooltip />
            {lines.map((line, i) => (
              <Line
                key={i}
                type="monotone"
                dataKey={line.dataKey}
                stroke={line.color}
                name={line.name}
                strokeDasharray={line.strokeDasharray}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}