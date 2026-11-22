import {
  type InputHTMLAttributes,
  type TextareaHTMLAttributes,
  forwardRef,
  useLayoutEffect,
  useRef,
  useState,
} from "react";

import { Eye, EyeOff, Search, X } from "lucide-react";

import { cn } from "../../lib/cn";

type FieldProps = InputHTMLAttributes<HTMLInputElement> & {
  /** Поле внутри карточки-группы (без собственного фона) */
  bare?: boolean;
  invalid?: boolean;
  trailing?: React.ReactNode;
};

export const TextField = forwardRef<HTMLInputElement, FieldProps>(
  function TextField({ className, invalid, bare, trailing, ...rest }, ref) {
    return (
      <div
        className={cn(
          "flex h-[3.25rem] items-center gap-2 px-4 transition-shadow",
          !bare &&
            "rounded-2xl bg-surface-2 focus-within:ring-2 focus-within:ring-primary/30",
          invalid && "ring-2 ring-danger/40",
          className,
        )}
      >
        <input
          ref={ref}
          className="h-full min-w-0 flex-1 bg-transparent text-[1.0625rem] text-fg outline-none placeholder:text-fg-3 lg:text-[0.975rem]"
          {...rest}
        />
        {trailing}
      </div>
    );
  },
);

export const PasswordField = forwardRef<
  HTMLInputElement,
  Omit<FieldProps, "trailing" | "type">
>(function PasswordField(props, ref) {
  const [visible, setVisible] = useState(false);
  return (
    <TextField
      ref={ref}
      type={visible ? "text" : "password"}
      autoComplete="current-password"
      {...props}
      trailing={
        <button
          type="button"
          tabIndex={-1}
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "hide" : "show"}
          className="pressable -mr-1 inline-flex size-9 items-center justify-center rounded-full text-fg-3 hover:text-fg-2"
        >
          {visible ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
        </button>
      }
    />
  );
});

type SearchProps = Omit<InputHTMLAttributes<HTMLInputElement>, "onChange"> & {
  cancelLabel?: string;
  onCancel?: () => void;
  onChange: (v: string) => void;
  value: string;
};

/**
 * Поиск в стиле iOS: пока поле пустое и не в фокусе, плейсхолдер с лупой
 * стоит по центру; в фокусе — уезжает влево и появляется «Отмена».
 */
export const SearchField = forwardRef<HTMLInputElement, SearchProps>(
  function SearchField(
    { value, onChange, onCancel, cancelLabel, className, placeholder, ...rest },
    ref,
  ) {
    const [focused, setFocused] = useState(false);
    const centered = !focused && !value;
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <label className="relative flex h-10 flex-1 items-center overflow-hidden rounded-full bg-surface-3/70 px-3 dark:bg-surface-2">
          <span
            className={cn(
              "pointer-events-none absolute flex items-center gap-1.5 text-fg-2 transition-all duration-300 ease-out-expo",
              centered ? "left-1/2 -translate-x-1/2" : "left-3 translate-x-0",
            )}
          >
            <Search className="size-[1.1rem]" strokeWidth={2.2} />
            {!value && (
              <span className="text-[1.0625rem] lg:text-[0.9375rem]">
                {placeholder}
              </span>
            )}
          </span>
          <input
            ref={ref}
            type="search"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            className="h-full w-full bg-transparent pl-7 pr-6 text-[1.0625rem] text-fg outline-none lg:text-[0.9375rem]"
            {...rest}
          />
          {value && (
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => onChange("")}
              className="absolute right-2 inline-flex size-5 animate-pop-in items-center justify-center rounded-full bg-fg-3 text-surface"
              aria-label="clear"
            >
              <X className="size-3.5" strokeWidth={3} />
            </button>
          )}
        </label>
        {onCancel && (focused || value) && (
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              onChange("");
              onCancel();
              (document.activeElement as HTMLElement | null)?.blur();
            }}
            className="animate-fade-in text-[1.0625rem] text-primary lg:text-[0.9375rem]"
          >
            {cancelLabel}
          </button>
        )}
      </div>
    );
  },
);

type AreaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  maxRows?: number;
};

/** Многострочное поле, растущее по содержимому */
export const AutoTextarea = forwardRef<HTMLTextAreaElement, AreaProps>(
  function AutoTextarea({ className, maxRows = 6, value, ...rest }, forwarded) {
    const inner = useRef<HTMLTextAreaElement | null>(null);
    useLayoutEffect(() => {
      const el = inner.current;
      if (!el) return;
      el.style.height = "auto";
      const line = parseFloat(getComputedStyle(el).lineHeight) || 22;
      el.style.height = `${Math.min(el.scrollHeight, line * maxRows + 16)}px`;
    }, [value, maxRows]);
    return (
      <textarea
        ref={(el) => {
          inner.current = el;
          if (typeof forwarded === "function") forwarded(el);
          else if (forwarded) forwarded.current = el;
        }}
        rows={1}
        value={value}
        className={cn(
          "resize-none bg-transparent outline-none placeholder:text-fg-3",
          className,
        )}
        {...rest}
      />
    );
  },
);
