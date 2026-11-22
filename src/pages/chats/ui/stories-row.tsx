import { useMemo, useState } from "react";

import { Plus } from "lucide-react";

import { UserAvatar, firstName, useMe, useUserMap } from "@/entities/user";

import type { StoryDTO } from "@/shared/api";
import { cn, useT } from "@/shared/lib";
import { Skeleton } from "@/shared/ui";

import { useStories } from "../api/stories";
import { PublishStorySheet } from "./publish-story-sheet";
import { StoryViewer } from "./story-viewer";

/** Лента статусов над списком чатов */
export function StoriesRow({ className }: { className?: string }) {
  const t = useT();
  const { data: stories, isLoading } = useStories();
  const { data: me } = useMe();
  const users = useUserMap();
  const [viewer, setViewer] = useState<{
    index: number;
    list: StoryDTO[];
  } | null>(null);
  const [publishOpen, setPublishOpen] = useState(false);

  const mine = stories?.find((s) => s.userId === me?.id);
  const others = useMemo(
    () => (stories ?? []).filter((s) => s.userId !== me?.id),
    [stories, me?.id],
  );

  return (
    <div
      className={cn(
        "flex gap-3.5 overflow-x-auto px-4 pb-3 pt-1 scrollbar-none",
        className,
      )}
    >
      <button
        type="button"
        onClick={() =>
          mine ? setViewer({ list: [mine], index: 0 }) : setPublishOpen(true)
        }
        className="flex w-[4.25rem] shrink-0 flex-col items-center gap-1"
      >
        <span className="relative">
          <UserAvatar
            user={me}
            size={4}
            ring={mine ? "seen" : "none"}
            className="transition-transform active:scale-95"
          />
          <span
            role="button"
            onClick={(e) => {
              e.stopPropagation();
              setPublishOpen(true);
            }}
            className="absolute -bottom-0.5 -right-0.5 flex size-[1.375rem] items-center justify-center rounded-full border-2 border-surface bg-primary text-white"
          >
            <Plus className="size-3.5" strokeWidth={3} />
          </span>
        </span>
        <span className="w-full truncate text-center text-[0.75rem] text-fg-2">
          {t.chats.myStatus}
        </span>
      </button>

      {isLoading
        ? Array.from({ length: 4 }, (_, i) => (
            <div
              key={i}
              className="flex w-[4.25rem] shrink-0 flex-col items-center gap-1.5"
            >
              <Skeleton className="size-16 rounded-full" />
              <Skeleton className="h-2.5 w-12" />
            </div>
          ))
        : others.map((s, i) => {
            const u = users.get(s.userId);
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => setViewer({ list: others, index: i })}
                className="flex w-[4.25rem] shrink-0 animate-fade-in flex-col items-center gap-1"
              >
                <UserAvatar
                  user={u}
                  size={4}
                  ring={s.seen ? "seen" : "unseen"}
                  withPresence
                  className="transition-transform active:scale-95"
                />
                <span className="w-full truncate text-center text-[0.75rem] text-fg-2">
                  {u ? firstName(u.name) : ""}
                </span>
              </button>
            );
          })}

      <StoryViewer
        stories={viewer?.list ?? []}
        startIndex={viewer ? viewer.index : null}
        meId={me?.id ?? ""}
        onClose={() => setViewer(null)}
      />
      <PublishStorySheet
        open={publishOpen}
        onClose={() => setPublishOpen(false)}
      />
    </div>
  );
}

/** Свёрнутые статусы рядом с заголовком при прокрутке списка */
export function StoriesMini() {
  const { data: stories } = useStories();
  const { data: me } = useMe();
  const users = useUserMap();
  const unseen = (stories ?? [])
    .filter((s) => s.userId !== me?.id && !s.seen)
    .slice(0, 3);
  if (!unseen.length) return null;
  return (
    <span className="mr-1.5 inline-flex animate-pop-in">
      {unseen.map((s, i) => (
        <span
          key={s.id}
          className="rounded-full ring-2 ring-bg"
          style={{ marginLeft: i ? -8 : 0, zIndex: 3 - i }}
        >
          <UserAvatar user={users.get(s.userId)} size={1.5} />
        </span>
      ))}
    </span>
  );
}
