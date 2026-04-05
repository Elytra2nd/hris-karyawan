'use client';

import { Bar, BarChart, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const COLORS = ['#1e40af', '#2563eb', '#3b82f6', '#60a5fa', '#93c5fd'];

// Pastikan ada kata 'export' sebelum 'function RegionChart'
export function RegionChart({ data, title = "Sebaran Cabang" }: { data: any[], title?: string }) {
  const chartData = data.map(item => ({
    name: item.cabang || item.region,
    total: item._count?.cabang || item._count?.region || 0
  }));

  return (
    <Card className="border-none shadow-sm bg-white h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="h-45">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} layout="vertical" margin={{ left: -15, right: 10 }}>
            <XAxis type="number" hide />
            <YAxis 
              dataKey="name" 
              type="category" 
              fontSize={9} 
              width={80} 
              axisLine={false} 
              tickLine={false}
              className="font-semibold text-slate-600" 
            />
            <Tooltip cursor={{fill: '#f8fafc'}} />
            <Bar dataKey="total" radius={[0, 4, 4, 0]} barSize={15}>
              {chartData.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}