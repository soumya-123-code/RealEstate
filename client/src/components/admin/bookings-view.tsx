"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAppStore } from "@/lib/store";
import { bookings as mockBookings, type BookingStatus } from "@/lib/mock-data";
import { Search, CalendarDays, User } from "lucide-react";

const statusVariant: Record<BookingStatus, "default" | "secondary" | "destructive" | "outline"> = {
  confirmed: "default",
  pending: "secondary",
  cancelled: "destructive",
  completed: "outline",
  "checked-in": "default",
};

const statusLabel: Record<BookingStatus, string> = {
  confirmed: "Confirmed",
  pending: "Pending",
  cancelled: "Cancelled",
  completed: "Completed",
  "checked-in": "Checked In",
};

function formatINR(amount: number): string {
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(1)} Cr`;
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)} L`;
  if (amount >= 1000) return `₹${(amount / 1000).toFixed(0)}K`;
  return `₹${amount}`;
}

export function BookingsView() {
  const { bookingSearch, setBookingSearch } = useAppStore();

  const filtered = mockBookings.filter((b) => {
    const term = bookingSearch.toLowerCase();
    return (
      b.id.toLowerCase().includes(term) ||
      b.propertyTitle.toLowerCase().includes(term) ||
      b.clientName.toLowerCase().includes(term) ||
      b.agentName.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Bookings</h1>
          <p className="text-sm text-muted-foreground">
            Manage property bookings and reservations ({filtered.length} total)
          </p>
        </div>
      </div>

      {/* Status Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {(["confirmed", "pending", "checked-in", "completed", "cancelled"] as BookingStatus[]).map(
          (status) => {
            const count = mockBookings.filter((b) => b.status === status).length;
            return (
              <Card key={status} className="p-3">
                <div className="flex items-center gap-2">
                  <div
                    className={`size-2.5 rounded-full ${
                      status === "confirmed" || status === "checked-in"
                        ? "bg-emerald-500"
                        : status === "pending"
                        ? "bg-amber-500"
                        : status === "completed"
                        ? "bg-sky-500"
                        : "bg-red-500"
                    }`}
                  />
                  <div>
                    <p className="text-lg font-bold">{count}</p>
                    <p className="text-[11px] text-muted-foreground">{statusLabel[status]}</p>
                  </div>
                </div>
              </Card>
            );
          }
        )}
      </div>

      {/* Table */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
            <CardTitle className="text-base">All Bookings</CardTitle>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
              <Input
                placeholder="Search bookings..."
                className="pl-8 h-9"
                value={bookingSearch}
                onChange={(e) => setBookingSearch(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="max-h-[500px] overflow-y-auto custom-scrollbar">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-20">ID</TableHead>
                  <TableHead>Property</TableHead>
                  <TableHead className="hidden md:table-cell">Client</TableHead>
                  <TableHead className="hidden lg:table-cell">Agent</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden sm:table-cell">Dates</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((booking) => (
                  <TableRow key={booking.id}>
                    <TableCell className="font-mono text-xs font-medium">
                      {booking.id}
                    </TableCell>
                    <TableCell>
                      <div className="max-w-[200px]">
                        <p className="text-sm font-medium truncate">{booking.propertyTitle}</p>
                        <p className="text-xs text-muted-foreground hidden sm:block">
                          {booking.propertyId}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <div className="flex items-center gap-2">
                        <div className="flex size-7 items-center justify-center rounded-full bg-muted text-xs font-medium">
                          {booking.clientName
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </div>
                        <span className="text-sm">{booking.clientName}</span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                      {booking.agentName}
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusVariant[booking.status]} className="text-xs">
                        {statusLabel[booking.status]}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-xs text-muted-foreground whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <CalendarDays className="size-3" />
                        {booking.checkIn}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-medium text-sm">
                      {formatINR(booking.totalAmount)}
                    </TableCell>
                    <TableCell>
                      <Select defaultValue={booking.status}>
                        <SelectTrigger className="w-20 h-7 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="confirmed">Confirm</SelectItem>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="completed">Complete</SelectItem>
                          <SelectItem value="cancelled">Cancel</SelectItem>
                        </SelectContent>
                      </Select>
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