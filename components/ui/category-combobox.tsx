"use client";

import * as React from "react";
import { Check, ChevronDown, Plus, Search, Tag, X } from "lucide-react";

interface CategoryComboboxProps {
  value: string;
  onChange: (val: string) => void;
  presets: string[];
  onAddCategory?: (newCat: string) => void;
  placeholder?: string;
  className?: string;
}

export function CategoryCombobox({
  value,
  onChange,
  presets,
  onAddCategory,
  placeholder = "Pilih atau ketik kategori baru (opsional)...",
  className = "",
}: CategoryComboboxProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const containerRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Close when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const filtered = presets.filter((p) =>
    p.toLowerCase().includes(search.toLowerCase())
  );

  const isExactMatch = presets.some(
    (p) => p.toLowerCase() === search.trim().toLowerCase()
  );

  const handleSelect = (category: string) => {
    onChange(category);
    if (category && onAddCategory && !presets.includes(category)) {
      onAddCategory(category);
    }
    setIsOpen(false);
    setSearch("");
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("");
  };

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      {/* Trigger Button */}
      <div
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-full flex items-center justify-between gap-2 px-3 py-2 bg-background hover:bg-muted/50 border border-border rounded-xl text-xs text-foreground transition-all shadow-2xs group cursor-pointer select-none focus-within:ring-2 focus-within:ring-primary/30"
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setIsOpen((prev) => !prev);
          }
        }}
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <Tag className={`w-3.5 h-3.5 shrink-0 ${value ? "text-primary" : "text-muted-foreground"}`} />
          <span className={`truncate ${value ? "font-semibold text-foreground" : "text-muted-foreground"}`}>
            {value || placeholder}
          </span>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {value && (
            <button
              type="button"
              onClick={handleClear}
              className="p-0.5 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              title="Kosongkan kategori"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <ChevronDown
            className={`w-4 h-4 text-muted-foreground group-hover:text-foreground transition-transform duration-200 ${
              isOpen ? "rotate-180 text-primary" : ""
            }`}
          />
        </div>
      </div>

      {/* Popover Content */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-1.5 w-full z-50 bg-popover/95 backdrop-blur-xl border border-border rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          {/* Search / Custom Input */}
          <div className="p-2 border-b border-border/80 bg-muted/30">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                ref={inputRef}
                type="text"
                placeholder="Cari atau ketik kategori baru..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && search.trim()) {
                    e.preventDefault();
                    handleSelect(search.trim());
                  }
                }}
                className="w-full pl-8 pr-7 py-1.5 bg-background rounded-xl border border-border/80 text-xs focus:outline-hidden focus:ring-1 focus:ring-primary/50 placeholder:text-muted-foreground"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {/* List of Categories */}
          <div className="max-h-60 overflow-y-auto p-1.5 space-y-0.5">
            {/* Option to create new custom if typed and not matching existing */}
            {search.trim() && !isExactMatch && (
              <button
                type="button"
                onClick={() => handleSelect(search.trim())}
                className="w-full flex items-center gap-2 p-2 rounded-xl text-left text-xs font-semibold text-primary bg-primary/10 hover:bg-primary/20 transition-colors border border-dashed border-primary/40 mb-1"
              >
                <Plus className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">
                  Gunakan & Simpan &quot;<strong>{search.trim()}</strong>&quot;
                </span>
              </button>
            )}

            {/* Clear selection option if value is currently selected */}
            {value && !search.trim() && (
              <button
                type="button"
                onClick={() => handleSelect("")}
                className="w-full flex items-center gap-2 p-2 rounded-xl text-left text-xs text-muted-foreground hover:bg-muted/70 transition-colors border border-dashed border-border/60 mb-1"
              >
                <X className="w-3.5 h-3.5 shrink-0 text-red-500" />
                <span>Tanpa Kategori (Kosongkan)</span>
              </button>
            )}

            {filtered.map((cat) => {
              const isSelected = value === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => handleSelect(cat)}
                  className={`w-full flex items-center justify-between p-2 rounded-xl text-left text-xs transition-all ${
                    isSelected
                      ? "bg-primary/15 text-primary font-bold border border-primary/30"
                      : "hover:bg-muted/70 text-foreground font-medium border border-transparent"
                  }`}
                >
                  <span className="truncate">{cat}</span>
                  {isSelected && <Check className="w-3.5 h-3.5 text-primary shrink-0 stroke-[2.5]" />}
                </button>
              );
            })}

            {filtered.length === 0 && !search.trim() && (
              <div className="py-4 text-center text-xs text-muted-foreground">
                Tidak ada kategori tersedia. Ketik nama kategori baru di atas.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
