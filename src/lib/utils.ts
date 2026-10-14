import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amountInKobo: number): string {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 2,
  }).format(amountInKobo / 100);
}

export function formatDate(date: string | Date, format: "short" | "long" | "relative" = "short"): string {
  const d = typeof date === "string" ? new Date(date) : date;
  if (format === "relative") {
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} mins ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return d.toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" });
  }
  if (format === "long") {
    return d.toLocaleDateString("en-NG", {
      day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit",
    });
  }
  return d.toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" });
}

export function generateId(prefix: string): string {
  const num = Math.floor(10000 + Math.random() * 90000);
  return `${prefix}-${num}`;
}

export function maskPhone(phone: string): string {
  if (phone.length < 6) return phone;
  return phone.slice(0, 4) + "****" + phone.slice(-3);
}

export function maskEmail(email: string): string {
  const [name, domain] = email.split("@");
  if (!domain) return email;
  const masked = name.slice(0, 2) + "***";
  return `${masked}@${domain}`;
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function getStatusColor(status: string): { bg: string; text: string; dot: string } {
  const s = status.toLowerCase();
  if (["active", "completed", "verified", "safe", "approved", "succeeded", "resolved", "on"].includes(s))
    return { bg: "bg-status-success-bg", text: "text-status-success", dot: "bg-status-success" };
  if (["pending", "in transit", "in progress", "processing", "under review", "waiting"].includes(s))
    return { bg: "bg-status-warning-bg", text: "text-status-warning", dot: "bg-status-warning" };
  if (["banned", "suspended", "failed", "rejected", "danger", "critical", "urgent", "flag", "off", "restricted", "cancelled"].includes(s))
    return { bg: "bg-status-danger-bg", text: "text-status-danger", dot: "bg-status-danger" };
  if (["inactive", "draft", "new", "open"].includes(s))
    return { bg: "bg-gray-100", text: "text-gray-600", dot: "bg-gray-400" };
  return { bg: "bg-status-info-bg", text: "text-status-info", dot: "bg-status-info" };
}
