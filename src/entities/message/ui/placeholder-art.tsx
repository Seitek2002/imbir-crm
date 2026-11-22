import { cn } from "@/shared/lib";

/**
 * Нарисованные «фотографии» для демо-данных — чтобы лента выглядела живой
 * без внешних картинок и сети. Загруженные пользователем фото показываются как есть.
 */
export function PlaceholderArt({
  kind,
  className,
}: {
  className?: string;
  kind: string;
}) {
  const base = cn("relative size-full overflow-hidden", className);
  switch (kind) {
    case "coffee":
      return (
        <div
          className={cn(
            base,
            "bg-[linear-gradient(160deg,#7a8b5a_0%,#4b5a35_45%,#c9a27a_46%,#8a6440_100%)]",
          )}
        >
          <div className="absolute left-1/2 top-[52%] aspect-square w-[64%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#efe7dc] shadow-[0_12px_30px_rgb(0_0_0/0.35)]">
            <div className="absolute inset-[12%] rounded-full bg-[radial-gradient(circle_at_50%_45%,#f4e2c6_0%,#c7905a_38%,#8b5a2f_70%)]">
              <div className="absolute left-1/2 top-[34%] h-[34%] w-[30%] -translate-x-1/2 rounded-[50%_50%_45%_45%] bg-[#f6ead8]/90" />
            </div>
          </div>
          <div className="absolute bottom-[10%] left-[8%] h-[14%] w-[84%] rounded-2xl bg-[#d8b48a]/70" />
        </div>
      );
    case "receipt":
      return (
        <div
          className={cn(
            base,
            "flex items-start justify-center bg-[#e9ecef] p-[8%]",
          )}
        >
          <div className="w-full rounded-lg bg-white p-[7%] shadow-md">
            <div className="mb-[6%] flex items-center gap-[5%] rounded-md bg-[#6c42fc] p-[5%] text-white">
              <span className="flex aspect-square w-[16%] items-center justify-center rounded bg-white/25 text-[0.55rem] font-bold">
                M
              </span>
              <span className="text-[0.6rem] font-semibold leading-tight">
                Кофейня
                <br />
                «Демо»
              </span>
            </div>
            {[70, 90, 60, 85, 50].map((w, i) => (
              <div key={i} className="mb-[5%] flex justify-between gap-2">
                <span
                  className="h-1.5 rounded bg-[#dfe3e8]"
                  style={{ width: `${w * 0.6}%` }}
                />
                <span className="h-1.5 w-[18%] rounded bg-[#dfe3e8]" />
              </div>
            ))}
            <div className="mt-[8%] flex items-center justify-between rounded-md bg-[#f1edff] p-[5%]">
              <span className="text-[0.55rem] text-[#6c42fc]">ИТОГО</span>
              <span className="text-[0.75rem] font-bold text-[#6c42fc]">
                640 сом
              </span>
            </div>
            <div className="mx-auto mt-[8%] grid w-[38%] grid-cols-5 gap-[2px]">
              {Array.from({ length: 25 }, (_, i) => (
                <span
                  key={i}
                  className={cn(
                    "aspect-square",
                    (i * 7) % 3 ? "bg-[#1c1c22]" : "bg-transparent",
                  )}
                />
              ))}
            </div>
          </div>
        </div>
      );
    case "screenshot":
    case "clipboard":
      return (
        <div
          className={cn(
            base,
            "flex bg-[#eef2f5]",
            kind === "clipboard" && "bg-[#dfe8ec]",
          )}
        >
          <div className="w-[9%] bg-[#1c1d24]">
            <div className="mx-auto mt-[40%] aspect-square w-[60%] rounded bg-[#fc246c]" />
            {[0, 1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="mx-auto mt-[45%] aspect-square w-[42%] rounded bg-white/25"
              />
            ))}
          </div>
          <div className="w-[30%] border-r border-black/5 bg-white p-[2%]">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="mb-[8%] flex items-center gap-[6%]">
                <span className="aspect-square w-[18%] rounded-full bg-[#fde0ea]" />
                <span className="h-1.5 flex-1 rounded bg-[#e5e7eb]" />
              </div>
            ))}
          </div>
          <div className="flex flex-1 flex-col justify-end gap-[4%] p-[3%]">
            <span className="h-[10%] w-[55%] rounded-lg bg-white" />
            <span className="h-[14%] w-[48%] self-end rounded-lg bg-[#dafbc0]" />
            <span className="h-[9%] w-[40%] rounded-lg bg-white" />
            <span className="h-[12%] w-[60%] self-end rounded-lg bg-[#dafbc0]" />
            <span className="mt-[3%] h-[9%] rounded-full bg-white" />
          </div>
        </div>
      );
    case "ads":
      return (
        <div
          className={cn(base, "bg-[linear-gradient(135deg,#fc246c,#fc8400)]")}
        >
          <div className="absolute -right-[15%] -top-[15%] size-[70%] rounded-full bg-white/15" />
          <div className="absolute -bottom-[20%] -left-[10%] size-[60%] rounded-full bg-black/10" />
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
            <span className="text-[0.7rem] font-semibold uppercase tracking-[0.3em] opacity-90">
              Black Friday
            </span>
            <span className="text-[2.6rem] font-black italic leading-none">
              −30%
            </span>
            <span className="mt-1 rounded-full bg-white px-3 py-0.5 text-[0.65rem] font-bold text-[#fc246c]">
              до 30 ноября
            </span>
          </div>
        </div>
      );
    default:
      return (
        <div
          className={cn(base, "bg-[linear-gradient(140deg,#2b2d3a,#0f1016)]")}
        />
      );
  }
}
