import { cn } from "../../lib/cn";

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("skeleton rounded-md", className)} />;
}

/** Заглушка строки списка: аватар + две строки текста */
export function SkeletonRow({ avatar = true }: { avatar?: boolean }) {
  return (
    <div className="flex items-center gap-3 px-4 py-2.5">
      {avatar && <Skeleton className="size-[3.25rem] shrink-0 rounded-full" />}
      <div className="flex flex-1 flex-col gap-2">
        <Skeleton className="h-3.5 w-2/5" />
        <Skeleton className="h-3 w-4/5" />
      </div>
    </div>
  );
}

export function SkeletonList({
  rows = 6,
  avatar,
}: {
  avatar?: boolean;
  rows?: number;
}) {
  return (
    <div className="animate-fade-in">
      {Array.from({ length: rows }, (_, i) => (
        <SkeletonRow key={i} avatar={avatar} />
      ))}
    </div>
  );
}
