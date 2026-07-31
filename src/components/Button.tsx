"use client";

import { type ButtonHTMLAttributes, type ReactNode } from "react";

const variants = {
  primary:
    "bg-gradient-to-br from-brand-600 to-brand-700 text-white shadow-lg shadow-brand-600/30 hover:from-brand-700 hover:to-brand-800 active:scale-[0.97] disabled:opacity-50 disabled:active:scale-100",
  secondary:
    "border border-slate-200 text-slate-600 hover:bg-slate-50 active:scale-[0.97] disabled:opacity-50 disabled:active:scale-100",
  danger:
    "bg-gradient-to-br from-red-600 to-red-700 text-white shadow-lg shadow-red-600/30 hover:from-red-700 hover:to-red-800 active:scale-[0.97] disabled:opacity-50 disabled:active:scale-100",
  ghost:
    "text-slate-500 hover:bg-slate-100 hover:text-slate-700 active:scale-[0.97] disabled:opacity-50 disabled:active:scale-100",
  outline:
    "border border-brand-200 bg-brand-50 text-brand-700 hover:bg-brand-100 active:scale-[0.97] disabled:opacity-50 disabled:active:scale-100",
};

const sizes = {
  sm: "px-3 py-1.5 text-xs gap-1.5",
  md: "px-4 py-2 text-sm gap-2",
  lg: "px-5 py-2.5 text-sm gap-2",
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
  loading?: boolean;
  children: ReactNode;
}

export default function Button({
  variant = "primary",
  size = "md",
  loading = false,
  children,
  className = "",
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center rounded-xl font-medium transition-all duration-200 ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      )}
      {children}
    </button>
  );
}
