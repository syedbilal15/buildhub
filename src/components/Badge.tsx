interface BadgeProps {
  variant?: "success" | "warning" | "danger" | "info" | "neutral";
  children: string;
}

const variantClasses: Record<string, string> = {
  success: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20",
  warning: "bg-amber-50 text-amber-700 ring-1 ring-amber-600/20",
  danger: "bg-red-50 text-red-700 ring-1 ring-red-600/20",
  info: "bg-blue-50 text-blue-700 ring-1 ring-blue-600/20",
  neutral: "bg-slate-100 text-slate-600 ring-1 ring-slate-400/20",
};

const statusMap: Record<string, keyof typeof variantClasses> = {
  active: "success",
  completed: "info",
  on_hold: "warning",
  available: "success",
  reserved: "warning",
  booked: "info",
  sold: "neutral",
  cancelled: "danger",
  pending: "warning",
  paid: "success",
  overdue: "danger",
  draft: "neutral",
};

export default function Badge({ variant, children }: BadgeProps) {
  const resolved = variant || statusMap[children.toLowerCase()] || "neutral";
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${variantClasses[resolved]}`}
    >
      {children.charAt(0).toUpperCase() + children.slice(1).replace(/_/g, " ")}
    </span>
  );
}
