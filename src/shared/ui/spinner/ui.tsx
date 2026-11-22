import { cn } from "../../lib/cn";

/** Индикатор активности в стиле iOS: 8 «лепестков», вращение шагами */
export function Spinner({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={cn("size-5 animate-[spin_0.8s_steps(8)_infinite]", className)}
      aria-hidden
    >
      {Array.from({ length: 8 }, (_, i) => (
        <rect
          key={i}
          x="11"
          y="2"
          width="2"
          height="6"
          rx="1"
          fill="currentColor"
          opacity={0.25 + (i / 8) * 0.75}
          transform={`rotate(${i * 45} 12 12)`}
        />
      ))}
    </svg>
  );
}
