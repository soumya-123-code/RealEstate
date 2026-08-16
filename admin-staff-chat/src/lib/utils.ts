import { clsx, type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function getRoleLabel(role: string): string {
  const map: Record<string, string> = {
    ADMIN: "Admin",
    STAFF: "Staff",
    AGENT: "Agent",
    USER: "Customer",
  };
  return map[role] || role;
}

export function getRoleColor(role: string): string {
  const map: Record<string, string> = {
    ADMIN: "bg-rose-100 text-rose-700",
    STAFF: "bg-violet-100 text-violet-700",
    AGENT: "bg-sky-100 text-sky-700",
    USER: "bg-emerald-100 text-emerald-700",
  };
  return map[role] || "bg-gray-100 text-gray-600";
}