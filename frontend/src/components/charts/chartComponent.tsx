import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface ChartProps {
  data: Array<Record<string, number | string>>;
  dataKeys: string[];
  colors: string[];
  title?: string;
  nameLegend?: string[];
  isDashed?: boolean[];
  unit?: string;
}

const ChartComponent: React.FC<ChartProps> = ({
  data,
  dataKeys,
  colors,
  title = '',
  nameLegend = [],
  isDashed = [],
}) => {
  return (
    <div className="chart-container">
      {title && <h4 className="text-center font-medium mb-4">{title}</h4>}
      <ResponsiveContainer width="100%" height={400}>
        <LineChart
          data={data}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="time" 
            tick={{ fontSize: 12 }}
            tickFormatter={(time) => time.split(':').slice(0, 2).join(':')}
          />
          <YAxis />
          <Tooltip 
            contentStyle={{ backgroundColor: '#fff', borderRadius: '6px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}
            formatter={(value: number, name: string) => {
              const metric = nameLegend.find(m => m.includes(name.split('.')[0]));
              const unit = metric?.match(/\(([^)]+)\)/)?.[1] || '';
              return [`${value} ${unit}`, name];
            }}
            labelFormatter={(label) => `Heure: ${label}`}
          />
          <Legend 
            formatter={(value) => {
              return nameLegend.find(m => m.includes(value)) || value;
            }}
          />
          {dataKeys.map((key, index) => (
            <Line
              key={key}
              type="monotone"
              dataKey={key}
              stroke={colors[index % colors.length]}
              strokeDasharray={isDashed[index] ? '5 5' : undefined}
              name={nameLegend[index] || key}
              activeDot={{ r: 6 }}
              dot={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ChartComponent;