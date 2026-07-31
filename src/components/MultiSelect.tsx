"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { ChevronDown, X, Search } from "lucide-react";

interface Option {
  value: number;
  label: string;
}

interface MultiSelectProps {
  options: Option[];
  selected: number[];
  onChange: (selected: number[]) => void;
  placeholder?: string;
  label?: string;
  error?: string;
}

export default function MultiSelect({
  options,
  selected,
  onChange,
  placeholder = "Select...",
  label,
  error,
}: MultiSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
  }, [open]);

  const filtered = useMemo(
    () =>
      query
        ? options.filter((o) => o.label.toLowerCase().includes(query.toLowerCase()))
        : options,
    [options, query]
  );

  const toggle = (value: number) => {
    if (selected.includes(value)) {
      onChange(selected.filter((v) => v !== value));
    } else {
      onChange([...selected, value]);
    }
  };

  const removeTag = (value: number, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(selected.filter((v) => v !== value));
  };

  const selectedLabels = selected
    .map((v) => options.find((o) => o.value === v)?.label)
    .filter(Boolean) as string[];

  return (
    <div ref={ref} className="space-y-1.5">
      {label && (
        <label className="block text-xs font-semibold text-slate-600">{label}</label>
      )}
      <div
        className={`relative rounded-xl border bg-white transition-all duration-200 focus-within:ring-2 ${
          error
            ? "border-red-300 focus-within:border-red-400 focus-within:ring-red-500/20"
            : "border-slate-200 focus-within:border-brand-400 focus-within:ring-brand-500/20"
        }`}
      >
        {/* Trigger / Tags area */}
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="flex min-h-[42px] w-full flex-wrap items-center gap-1.5 px-3 py-2 text-left"
        >
          {selected.length > 0 ? (
            selectedLabels.map((label, i) => (
              <span
                key={selected[i]}
                className="inline-flex items-center gap-1 rounded-lg bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700"
              >
                {label}
                <button
                  type="button"
                  onClick={(e) => removeTag(selected[i], e)}
                  className="rounded p-0.5 text-brand-500 hover:bg-brand-200 hover:text-brand-800"
                >
                  <X size={12} />
                </button>
              </span>
            ))
          ) : (
            <span className="text-sm text-slate-400">{placeholder}</span>
          )}
          <span className="ml-auto flex items-center">
            <ChevronDown
              size={16}
              className={`text-slate-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
            />
          </span>
        </button>

        {/* Dropdown */}
        {open && (
          <div className="absolute left-0 right-0 z-10 mt-1 rounded-xl border border-slate-200 bg-white shadow-lg">
            {/* Search */}
            <div className="relative border-b border-slate-100">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search units..."
                className="w-full rounded-t-xl border-0 py-2.5 pl-9 pr-3 text-sm text-slate-900 outline-none placeholder:text-slate-400"
              />
            </div>

            {/* Options */}
            <div className="max-h-52 overflow-y-auto py-1">
              {filtered.length === 0 ? (
                <div className="px-3 py-3 text-center text-sm text-slate-400">
                  {query ? "No matches found" : "No options available"}
                </div>
              ) : (
                filtered.map((opt) => {
                  const isSelected = selected.includes(opt.value);
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => toggle(opt.value)}
                      className={`flex w-full items-center gap-2.5 px-3 py-2 text-sm transition-colors ${
                        isSelected
                          ? "bg-brand-50 text-brand-800"
                          : "text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      <span
                        className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors ${
                          isSelected
                            ? "border-brand-500 bg-brand-500 text-white"
                            : "border-slate-300"
                        }`}
                      >
                        {isSelected && (
                          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </span>
                      {opt.label}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
