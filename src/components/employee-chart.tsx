'use client';

import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";

// Warna untuk tiap bar agar bervariasi
const COLORS = ['#2563eb', '#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe'];

const chartConfig = {
  count: {
    label: "Jumlah Karyawan",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig;

interface EmployeeChartProps {
  data: { posisi: string; _count: { posisi: number } }[];
}

export function EmployeeChart({ data }: EmployeeChartProps) {
  // Mapping data dari Prisma ke format Recharts
  const chartData = data.map((item) => ({
    posisi: item.posisi,
    jumlah: item._count.posisi,
  }));

  return (
    <Card className="border-none shadow-sm bg-white">
      <CardHeader>
        <CardTitle className="text-lg">Statistik Jabatan</CardTitle>
        <CardDescription>Jumlah karyawan aktif berdasarkan posisi</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-75 w-full">
          <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-slate-200" />
            <XAxis 
              dataKey="posisi" 
              fontSize={12} 
              tickLine={false} 
              axisLine={false}
              tickFormatter={(value) => value.substring(0, 5) + ".."} // Singkat jika terlalu panjang
            />
            <YAxis fontSize={12} tickLine={false} axisLine={false} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="jumlah" radius={[4, 4, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}