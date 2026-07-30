"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";

interface PaginationProps {
  current: number;
  total: number;
  onChange: (page: number) => void;
}

export default function Pagination({ current, total, onChange }: PaginationProps) {
  if (total <= 1) return null;

  const pages: (number | "...")[] = [];
  for (let i = 1; i <= total; i++) {
    if (i === 1 || i === total || (i >= current - 1 && i <= current + 1)) {
      pages.push(i);
    } else if (pages[pages.length - 1] !== "...") {
      pages.push("...");
    }
  }

  return (
    <div className="flex items-center justify-center gap-1">
      <motion.button
        onClick={() => onChange(current - 1)}
        disabled={current === 1}
        className="flex h-8 w-8 items-center justify-center rounded-lg text-text-secondary transition-colors hover:bg-surface-card hover:text-text-primary disabled:opacity-30 disabled:cursor-not-allowed"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <ChevronLeft size={15} />
      </motion.button>

      {pages.map((page, i) =>
        page === "..." ? (
          <span key={`ellipsis-${i}`} className="flex h-8 w-8 items-center justify-center text-xs text-text-secondary">...</span>
        ) : (
          <motion.button
            key={page}
            onClick={() => onChange(page)}
            className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs font-medium transition-colors ${
              page === current
                ? "bg-brand-600 text-white shadow-sm"
                : "text-text-secondary hover:bg-surface-card hover:text-text-primary"
            }`}
            whileHover={page !== current ? { scale: 1.05 } : undefined}
            whileTap={{ scale: 0.95 }}
          >
            {page}
          </motion.button>
        )
      )}

      <motion.button
        onClick={() => onChange(current + 1)}
        disabled={current === total}
        className="flex h-8 w-8 items-center justify-center rounded-lg text-text-secondary transition-colors hover:bg-surface-card hover:text-text-primary disabled:opacity-30 disabled:cursor-not-allowed"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <ChevronRight size={15} />
      </motion.button>
    </div>
  );
}
