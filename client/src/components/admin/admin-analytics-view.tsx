"use client";

import { useEffect, useState } from "react";
import { admin } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig,
} from "@/components/ui/chart";
import { Bar, BarChart, XAxis, YAxis, Line, LineChart, CartesianGrid, ResponsiveContainer, Area, AreaChart } from "recharts";
import { IndianRupee, TrendingUp, Users, CalendarCheck, ArrowUpRight, ArrowDownRight } from "lucide-react";

const revenueConfig: ChartConfig = {
  revenue: { label: "Revenue (₹)", color: "var(--color-chart-1)" },
};
const bookingConfig: ChartConfig = {
  bookings: { label: "Bookings", color: "var(--color-chart-2)" },
};
const leadConfig: ChartConfig = {
  leads: { label: "Leads", color: "var(--color-chart-5)" },
};

export function AdminAnalyticsView() {
  const [data, setData] = useState<{ revenueData: { month: string; revenue: number }[]; bookingsData: { month: string; bookings: number }[]; leadsData: { month: string; leads: number }[] } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    admin.analytics().then((d) => { setData(d); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const formatCurrency = (v: number) => `₹${(v / 100000).toFixed(1)}L`;

  if (loading) return <div className="space-y-4">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-40 rounded-xl" />)}</div>;
  if (!data) return <p className="text-muted-foreground">Failed to load analytics</p>;

  const totalRevenue = data.revenueData.reduce((s, d) => s + d.revenue, 0);
  const totalBookings = data.bookingsData.reduce((s, d) => s + d.bookings, 0);
  const totalLeads = data.leadsData.reduce((s, d) => s + d.leads, 0);
  const convRate = totalBookings > 0 ? ((totalBookings / totalLeads) * 100).toFixed(1) : "0";

  const metrics = [
    { label: "Total Revenue", value: formatCurrency(totalRevenue), change: "+22.4%", up: true, icon: IndianRupee },
    { label: "Total Bookings", value: totalBookings.toString(), change: "+8.3%", up: true, icon: CalendarCheck },
    { label: "Total Leads", value: totalLeads.toString(), change: "+15.0%", up: true, icon: Users },
    { label: "Conversion Rate", value: `${convRate}%`, change: "+2.1%", up: true, icon: TrendingUp },
  ];

  return (
    <div className="space-y-6">
      <div><h2 className="text-lg font-semibold">Analytics</h2><p className="text-sm text-muted-foreground">Business performance overview</p></div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((m) => (
          <Card key={m.label} className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <m.icon className="size-4" />
                </div>
                <span className={`flex items-center gap-0.5 text-xs font-medium ${m.up ? "text-emerald-600" : "text-red-600"}`}>
                  {m.up ? <ArrowUpRight className="size-3" /> : <ArrowDownRight className="size-3" />}
                  {m.change}
                </span>
              </div>
              <div className="text-xl font-bold">{m.value}</div>
              <div className="text-xs text-muted-foreground">{m.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-4">
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2"><CardTitle className="text-sm">Revenue Trend</CardTitle></CardHeader>
          <CardContent>
            <ChartContainer config={revenueConfig} className="h-64 w-full">
              <AreaChart data={data.revenueData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `₹${(v / 100000).toFixed(0)}L`} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area type="monotone" dataKey="revenue" stroke="var(--color-chart-1)" fill="var(--color-chart-1)" fillOpacity={0.15} strokeWidth={2} />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2"><CardTitle className="text-sm">Bookings vs Leads</CardTitle></CardHeader>
          <CardContent>
            <ChartContainer config={bookingConfig} className="h-64 w-full">
              <BarChart data={data.bookingsData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="bookings" fill="var(--color-chart-2)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2"><CardTitle className="text-sm">Lead Generation</CardTitle></CardHeader>
        <CardContent>
          <ChartContainer config={leadConfig} className="h-48 w-full">
            <LineChart data={data.leadsData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Line type="monotone" dataKey="leads" stroke="var(--color-chart-5)" strokeWidth={2} dot={{ fill: "var(--color-chart-5)", r: 4 }} />
            </LineChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
}