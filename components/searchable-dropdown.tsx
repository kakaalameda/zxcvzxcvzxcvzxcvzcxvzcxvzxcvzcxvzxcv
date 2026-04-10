"use client";

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
  emptyText = "Khong co ket qua phu hop.",
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
      <label className="block font-heading text-[0.72rem] tracking-[0.18em] uppercase text-white/40 font-bold mb-1.5">
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
            "w-full bg-brand-gray-mid border text-white font-heading text-[0.9rem] tracking-wide px-3.5 py-3 pr-10 outline-none transition-colors duration-200 placeholder:text-white/30",
            disabled
              ? "border-white/10 text-white/25 cursor-not-allowed"
              : error
                ? "border-red-400/70 focus:border-red-400"
                : "border-white/15 focus:border-gold-500/40",
          ].join(" ")}
        />
        <button
          type="button"
          onClick={() => {
            if (!disabled) {
              setIsOpen((current) => !current);
            }
          }}
          disabled={disabled}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-white/35"
          aria-label={`Open ${label.toLowerCase()} options`}
        >
          {isLoading ? (
            <span className="block h-4 w-4 rounded-full border-2 border-white/15 border-t-gold-500 animate-spin" />
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="h-4 w-4">
              <path d="M6 9l6 6 6-6" />
            </svg>
          )}
        </button>

        {isOpen ? (
          <div
            id={listboxId}
            role="listbox"
            className="absolute z-30 mt-1 max-h-60 w-full overflow-y-auto rounded-none border border-white/10 bg-black shadow-[0_14px_40px_rgba(0,0,0,0.45)]"
          >
            {isLoading ? (
              <div className="px-3.5 py-3 text-[0.76rem] font-heading tracking-wide text-white/45">
                Dang tim...
              </div>
            ) : options.length ? (
              options.map((option) => (
                <button
                  key={option.code}
                  type="button"
                  onClick={() => {
                    onSelect(option);
                    setIsOpen(false);
                  }}
                  className="block w-full border-b border-white/[0.06] px-3.5 py-3 text-left font-heading text-[0.84rem] tracking-wide text-white/80 transition-colors hover:bg-gold-500/10 hover:text-gold-500 last:border-b-0"
                >
                  {option.name}
                </button>
              ))
            ) : (
              <div className="px-3.5 py-3 text-[0.76rem] font-heading tracking-wide text-white/45">
                {emptyText}
              </div>
            )}
          </div>
        ) : null}
      </div>
      {error ? (
        <p className="mt-1 font-heading text-[0.68rem] text-red-400 tracking-wide">
          {error}
        </p>
      ) : helperText ? (
        <p className="mt-1 font-heading text-[0.68rem] text-white/45 tracking-wide">
          {helperText}
        </p>
      ) : null}
    </div>
  );
}
