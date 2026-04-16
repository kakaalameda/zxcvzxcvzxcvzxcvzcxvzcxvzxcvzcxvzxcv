"use client";

import { ChevronDown } from "lucide-react";
import { useEffect, useEffectEvent, useId, useRef, useState } from "react";

export interface SearchableDropdownOption {
  code: number;
  name: string;
}

interface SearchableDropdownProps {
  label: string;
  value: string;
  placeholder: string;
  onValueChange: (value: string) => void;
  onSelect: (option: SearchableDropdownOption) => void;
  loadOptions: (query: string) => Promise<SearchableDropdownOption[]>;
  disabled?: boolean;
  error?: string;
  helperText?: string;
  emptyText?: string;
  className?: string;
}

export function SearchableDropdown({
  label,
  value,
  placeholder,
  onValueChange,
  onSelect,
  loadOptions,
  disabled = false,
  error,
  helperText,
  emptyText = "Không có kết quả phù hợp.",
  className,
}: SearchableDropdownProps) {
  const listboxId = useId();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const requestIdRef = useRef(0);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [options, setOptions] = useState<SearchableDropdownOption[]>([]);

  const loadOptionsEvent = useEffectEvent(loadOptions);

  useEffect(() => {
    if (!isOpen || disabled) {
      return;
    }

    const currentRequestId = ++requestIdRef.current;
    const timeoutId = window.setTimeout(async () => {
      setIsLoading(true);

      try {
        const nextOptions = await loadOptionsEvent(value.trim());
        if (currentRequestId === requestIdRef.current) {
          setOptions(nextOptions);
        }
      } catch {
        if (currentRequestId === requestIdRef.current) {
          setOptions([]);
        }
      } finally {
        if (currentRequestId === requestIdRef.current) {
          setIsLoading(false);
        }
      }
    }, 180);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [disabled, isOpen, value]);

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
    };
  }, []);

  return (
    <div ref={containerRef} className={className}>
      <label className="mb-1.5 block font-heading size-kicker-xs font-semibold uppercase tracking-[0.18em] text-store-muted">
        {label}
      </label>
      <div className="relative">
        <input
          value={value}
          placeholder={placeholder}
          disabled={disabled}
          autoComplete="off"
          onFocus={() => setIsOpen(true)}
          onChange={(event) => {
            onValueChange(event.target.value);
            setIsOpen(true);
          }}
          className={[
            "w-full rounded-[22px] border bg-white px-4 py-3.5 pr-11 size-copy text-[#111111] outline-none transition-colors placeholder:text-store-muted/70",
            disabled
              ? "cursor-not-allowed border-[var(--border)] bg-[var(--surface)] text-store-muted/60"
              : error
                ? "border-red-400 focus:border-red-400"
                : "border-[var(--border)] focus:border-store-blue",
          ].join(" ")}
        />

        <button
          type="button"
          disabled={disabled}
          onClick={() => {
            if (!disabled) {
              setIsOpen((current) => !current);
            }
          }}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-store-muted"
          aria-label={`Open ${label.toLowerCase()} options`}
        >
          {isLoading ? (
            <span className="block h-4 w-4 rounded-full border-2 border-store-blue/20 border-t-store-blue animate-spin" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </button>

        {isOpen ? (
          <div
            id={listboxId}
            role="listbox"
            className="absolute z-30 mt-2 max-h-60 w-full overflow-y-auto rounded-[24px] border border-[var(--border)] bg-white shadow-[0_24px_80px_rgba(17,17,17,0.12)]"
          >
            {isLoading ? (
              <div className="px-4 py-3 text-sm text-store-muted">Đang tìm...</div>
            ) : options.length ? (
              options.map((option) => (
                <button
                  key={option.code}
                  type="button"
                  onClick={() => {
                    onSelect(option);
                    setIsOpen(false);
                  }}
                  className="block w-full border-b border-[var(--border)] px-4 py-3 text-left text-sm text-[#111111] transition-colors hover:bg-store-blue-soft last:border-b-0"
                >
                  {option.name}
                </button>
              ))
            ) : (
              <div className="px-4 py-3 text-sm text-store-muted">{emptyText}</div>
            )}
          </div>
        ) : null}
      </div>

      {error ? (
        <p className="mt-1.5 text-sm text-red-500">{error}</p>
      ) : helperText ? (
        <p className="mt-1.5 text-sm text-store-muted">{helperText}</p>
      ) : null}
    </div>
  );
}
