'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";

const COLORS = ['#2563eb', '#7c3aed', '#db2777', '#ea580c', '#16a34a'];

const chartConfig = {
  jumlah: {
    label: "Total",
  },
} satisfies ChartConfig;

interface Props {
  data: { posisi: string; _count: { posisi: number } }[];
}

export function ContractStatusChart({ data }: Props) {
  const chartData = data.map((item) => ({
    name: item.posisi,
    value: item._count.posisi,
  }));

  return (
    <Card className="border-none shadow-sm bg-white flex flex-col">
      <CardHeader className="items-center pb-0">
        <CardTitle className="text-lg">Komposisi Jabatan</CardTitle>
        <CardDescription>Persentase per kategori posisi</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer config={chartConfig} className="mx-auto aspect-square max-h-62.5">
          <PieChart>
            <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="name"
              innerRadius={60}
              strokeWidth={5}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Legend verticalAlign="bottom" height={36}/>
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}