import { BRAND } from "../../config/brand";
import { cn } from "../../lib/cn";

type Props = { className?: string; round?: boolean; size?: number };

/** Логотип: розовая плашка со «сложенным» в две строки названием */
export function Logo({ size = 4, round, className }: Props) {
  return (
    <span
      className={cn(
        "relative inline-flex shrink-0 select-none flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-[#ff3d7f] to-[#f01a62] font-black italic leading-[0.82] text-white",
        round ? "rounded-full" : "rounded-[22%]",
        className,
      )}
      style={{
        width: `${size}rem`,
        height: `${size}rem`,
        fontSize: `${size * 0.3}rem`,
      }}
      aria-label={BRAND.name}
    >
      <span className="-ml-[6%] tracking-[-0.04em]">{BRAND.logoTop}</span>
      <span className="ml-[6%] tracking-[-0.04em]">{BRAND.logoBottom}</span>
    </span>
  );
}

export function Wordmark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "text-[0.8125rem] font-semibold tracking-[0.18em] text-fg",
        className,
      )}
    >
      {BRAND.wordmark}
    </span>
  );
}
