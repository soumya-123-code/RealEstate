"use client";

import { useState } from "react";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { users as mockUsers, type UserRole } from "@/lib/mock-data";
import {
  Shield,
  UserCog,
  Headphones,
  UserCircle,
  Plus,
  MoreHorizontal,
  Mail,
  Phone,
  Calendar,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const roleIcons: Record<UserRole, React.ElementType> = {
  admin: Shield,
  staff: UserCog,
  agent: Headphones,
  customer: UserCircle,
};

const roleColors: Record<UserRole, string> = {
  admin: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400",
  staff: "bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-400",
  agent: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400",
  customer: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400",
};

const roleVariant: Record<UserRole, "default" | "secondary" | "outline"> = {
  admin: "default",
  staff: "secondary",
  agent: "outline",
  customer: "outline",
};

export function UsersView() {
  const [addOpen, setAddOpen] = useState(false);

  const staffUsers = mockUsers.filter((u) => u.role !== "customer");
  const customerUsers = mockUsers.filter((u) => u.role === "customer");

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Users & Staff</h1>
          <p className="text-sm text-muted-foreground">
            Manage team members and customer accounts
          </p>
        </div>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="size-4" /> Add User
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New User</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Full Name</Label>
                <Input placeholder="Enter full name" />
              </div>
              <div className="grid gap-2">
                <Label>Email</Label>
                <Input type="email" placeholder="user@email.com" />
              </div>
              <div className="grid gap-2">
                <Label>Phone</Label>
                <Input placeholder="+91 XXXXX XXXXX" />
              </div>
              <div className="grid gap-2">
                <Label>Role</Label>
                <Select>
                  <SelectTrigger><SelectValue placeholder="Select role" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="staff">Staff</SelectItem>
                    <SelectItem value="agent">Agent</SelectItem>
                    <SelectItem value="customer">Customer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
              <Button onClick={() => setAddOpen(false)}>Add User</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Staff Cards */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Team Members</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {staffUsers.map((user) => {
            const Icon = roleIcons[user.role];
            return (
              <Card key={user.id} className="relative overflow-hidden">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex size-11 items-center justify-center rounded-xl ${roleColors[user.role]} font-bold text-sm`}
                      >
                        {user.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .slice(0, 2)}
                      </div>
                      <div>
                        <h3 className="font-semibold text-sm">{user.name}</h3>
                        <Badge variant={roleVariant[user.role]} className="text-[10px] mt-0.5 capitalize">
                          <Icon className="size-3 mr-1" />
                          {user.role}
                        </Badge>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="size-7">
                          <MoreHorizontal className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>Edit Profile</DropdownMenuItem>
                        <DropdownMenuItem>View Activity</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <div className="mt-4 space-y-2">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Mail className="size-3" />
                      <span className="truncate">{user.email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Phone className="size-3" />
                      {user.phone}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar className="size-3" />
                      Joined {user.joinDate}
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t flex gap-3 text-xs">
                    {user.properties !== undefined && (
                      <span className="text-muted-foreground">
                        <span className="font-semibold text-foreground">{user.properties}</span> Properties
                      </span>
                    )}
                    {user.bookings !== undefined && (
                      <span className="text-muted-foreground">
                        <span className="font-semibold text-foreground">{user.bookings}</span> Bookings
                      </span>
                    )}
                  </div>
                  <div className="absolute top-3 right-3 sm:hidden" />
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Customer Table */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Customers</h2>
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead className="hidden sm:table-cell">Email</TableHead>
                  <TableHead className="hidden md:table-cell">Phone</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden md:table-cell">Joined</TableHead>
                  <TableHead>Bookings</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customerUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex size-8 items-center justify-center rounded-full bg-muted text-xs font-bold">
                          {user.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{user.name}</p>
                          <p className="text-xs text-muted-foreground sm:hidden">{user.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
                      {user.email}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                      {user.phone}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={user.status === "active" ? "default" : "secondary"}
                        className="text-xs"
                      >
                        {user.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                      {user.joinDate}
                    </TableCell>
                    <TableCell className="font-medium text-sm">
                      {user.bookings || 0}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}