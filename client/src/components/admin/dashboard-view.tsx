"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Bar, BarChart, XAxis, YAxis, Pie, PieChart, Cell } from "recharts";
import {
  Building2,
  CalendarCheck,
  Users,
  IndianRupee,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  Activity,
} from "lucide-react";
import {
  dashboardStats,
  monthlyRevenue,
  propertyTypeDistribution,
  recentActivity,
} from "@/lib/mock-data";

const revenueConfig: ChartConfig = {
  revenue: { label: "Revenue (₹)", color: "var(--color-chart-1)" },
};

const typeConfig: ChartConfig = {
  Apartment: { label: "Apartment", color: "var(--color-chart-1)" },
  Villa: { label: "Villa", color: "var(--color-chart-2)" },
  Plot: { label: "Plot", color: "var(--color-chart-3)" },
  Commercial: { label: "Commercial", color: "var(--color-chart-4)" },
  Penthouse: { label: "Penthouse", color: "var(--color-chart-5)" },
  Independent: { label: "Independent", color: "var(--color-primary)" },
};

const typeColors = [
  "var(--color-chart-1)",
  "var(--color-chart-2)",
  "var(--color-chart-3)",
  "var(--color-chart-4)",
  "var(--color-chart-5)",
  "var(--color-primary)",
];

function formatINR(amount: number): string {
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(1)} Cr`;
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)} L`;
  if (amount >= 1000) return `₹${(amount / 1000).toFixed(0)}K`;
  return `₹${amount}`;
}

function formatCompact(amount: number): string {
  if (amount >= 10000000) return `${(amount / 10000000).toFixed(1)} Cr`;
  if (amount >= 100000) return `${(amount / 100000).toFixed(0)} L`;
  if (amount >= 1000) return `${(amount / 1000).toFixed(0)}K`;
  return `${amount}`;
}

const statCards = [
  {
    title: "Total Properties",
    value: dashboardStats.totalProperties,
    change: dashboardStats.propertiesChange,
    icon: Building2,
    color: "text-emerald-600",
    bg: "bg-emerald-50 dark:bg-emerald-950/40",
  },
  {
    title: "Active Bookings",
    value: dashboardStats.activeBookings,
    change: dashboardStats.bookingsChange,
    icon: CalendarCheck,
    color: "text-amber-600",
    bg: "bg-amber-50 dark:bg-amber-950/40",
  },
  {
    title: "Total Users",
    value: dashboardStats.totalUsers,
    change: dashboardStats.usersChange,
    icon: Users,
    color: "text-sky-600",
    bg: "bg-sky-50 dark:bg-sky-950/40",
  },
  {
    title: "Total Revenue",
    value: formatINR(dashboardStats.revenue),
    change: dashboardStats.revenueChange,
    icon: IndianRupee,
    color: "text-rose-600",
    bg: "bg-rose-50 dark:bg-rose-950/40",
    isFormatted: true,
  },
];

const activityIcons: Record<string, string> = {
  booking: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400",
  property: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400",
  lead: "bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-400",
  payment: "bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-400",
  user: "bg-pink-100 text-pink-700 dark:bg-pink-950 dark:text-pink-400",
};

export function DashboardView() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Welcome back, Rajesh. Here&apos;s what&apos;s happening at Suretreaven.
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <Card key={stat.title} className="relative overflow-hidden">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    {stat.title}
                  </p>
                  <p className="text-2xl font-bold">{stat.value}</p>
                </div>
                <div className={`rounded-xl p-2.5 ${stat.bg}`}>
                  <stat.icon className={`size-5 ${stat.color}`} />
                </div>
              </div>
              <div className="mt-3 flex items-center gap-1.5">
                {stat.change >= 0 ? (
                  <TrendingUp className="size-3.5 text-emerald-600" />
                ) : (
                  <TrendingDown className="size-3.5 text-red-500" />
                )}
                <span
                  className={`text-xs font-medium ${
                    stat.change >= 0 ? "text-emerald-600" : "text-red-500"
                  }`}
                >
                  {stat.change >= 0 ? "+" : ""}
                  {stat.change}%
                </span>
                <span className="text-xs text-muted-foreground">vs last month</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Monthly Revenue</CardTitle>
            <CardDescription>Revenue trend for the last 6 months</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={revenueConfig} className="h-64 w-full">
              <BarChart data={monthlyRevenue} barSize={32}>
                <XAxis
                  dataKey="month"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => formatCompact(v)}
                  tickMargin={8}
                />
                <ChartTooltip
                  content={<ChartTooltipContent />}
                  formatter={(value) => formatINR(value as number)}
                />
                <Bar
                  dataKey="revenue"
                  fill="var(--color-chart-1)"
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Property Types</CardTitle>
            <CardDescription>Distribution by category</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <ChartContainer config={typeConfig} className="h-48 w-full">
              <PieChart>
                <ChartTooltip
                  content={<ChartTooltipContent nameKey="type" />}
                />
                <Pie
                  data={propertyTypeDistribution}
                  dataKey="count"
                  nameKey="type"
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={80}
                  paddingAngle={3}
                  strokeWidth={0}
                >
                  {propertyTypeDistribution.map((_, i) => (
                    <Cell key={i} fill={typeColors[i]} />
                  ))}
                </Pie>
              </PieChart>
            </ChartContainer>
            <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
              {propertyTypeDistribution.map((item, i) => (
                <div key={item.type} className="flex items-center gap-1.5">
                  <div
                    className="size-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: typeColors[i] }}
                  />
                  <span className="text-muted-foreground truncate">
                    {item.type} ({item.count})
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Activity className="size-4 text-primary" />
                Recent Activity
              </CardTitle>
              <CardDescription>Latest actions and updates</CardDescription>
            </div>
            <Badge variant="secondary" className="text-xs">
              Last 7 days
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="max-h-80 overflow-y-auto custom-scrollbar">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">Type</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead className="hidden sm:table-cell">Details</TableHead>
                  <TableHead className="text-right">Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentActivity.map((activity) => (
                  <TableRow key={activity.id}>
                    <TableCell>
                      <div
                        className={`flex size-8 items-center justify-center rounded-lg text-xs font-bold ${
                          activityIcons[activity.type] || "bg-gray-100"
                        }`}
                      >
                        <ArrowUpRight className="size-3.5" />
                      </div>
                    </TableCell>
                    <TableCell className="font-medium text-sm">
                      {activity.action}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-sm text-muted-foreground max-w-xs truncate">
                      {activity.detail}
                    </TableCell>
                    <TableCell className="text-right text-xs text-muted-foreground whitespace-nowrap">
                      {activity.time}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}