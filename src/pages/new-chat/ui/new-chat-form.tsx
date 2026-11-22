import { useMemo, useState } from "react";

import { Check, RefreshCw, User, UsersRound } from "lucide-react";

import { useCreateChat } from "@/entities/chat";
import { UserAvatar, useUsers } from "@/entities/user";

import { cn, haptic, useT } from "@/shared/lib";
import { toast } from "@/shared/model";
import { Button, SearchField, SkeletonList, TextField } from "@/shared/ui";

type Props = {
  initialMode?: "direct" | "group";
  meId: string;
  onCreated: (chatId: string) => void;
  onModeChange?: (mode: "direct" | "group") => void;
};

export function NewChatForm({
  meId,
  initialMode = "group",
  onCreated,
  onModeChange,
}: Props) {
  const t = useT();
  const { data: users, isLoading } = useUsers();
  const create = useCreateChat();
  const [mode, setMode] = useState(initialMode);
  const [title, setTitle] = useState("");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<string[]>([]);

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (users ?? [])
      .filter((u) => u.id !== meId)
      .filter(
        (u) =>
          !q ||
          u.name.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q),
      );
  }, [users, query, meId]);

  const switchMode = () => {
    const next = mode === "group" ? "direct" : "group";
    haptic("light");
    setMode(next);
    onModeChange?.(next);
  };

  const pick = (id: string) => {
    if (mode === "direct") {
      create.mutate(
        { kind: "direct", memberIds: [id] },
        { onSuccess: (chat) => onCreated(chat.id) },
      );
      return;
    }
    haptic("light");
    setSelected((s) =>
      s.includes(id) ? s.filter((x) => x !== id) : [...s, id],
    );
  };

  const submit = () => {
    if (!title.trim()) return toast.error(t.newChat.needName);
    if (!selected.length) return toast.error(t.newChat.needMembers);
    create.mutate(
      { kind: "group", title: title.trim(), memberIds: selected },
      {
        onSuccess: (chat) => {
          toast.success(t.chats.groupCreated(chat.title));
          onCreated(chat.id);
        },
      },
    );
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="scroll-area min-h-0 flex-1 pb-28">
        <div className="mx-4 mt-1 overflow-hidden rounded-2xl bg-surface">
          <button
            type="button"
            onClick={switchMode}
            className="flex w-full items-center gap-3 px-4 py-3 text-left active:bg-surface-2 pointer-fine:hover:bg-surface-2/70"
          >
            <span className="flex size-11 items-center justify-center rounded-full bg-primary-soft text-primary">
              {mode === "group" ? (
                <User className="size-5" />
              ) : (
                <UsersRound className="size-5" />
              )}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[1.0625rem] font-semibold text-primary">
                {mode === "group" ? t.newChat.personal : t.newChat.groupMode}
              </span>
              <span className="block truncate text-[0.8125rem] text-fg-2">
                {mode === "group"
                  ? t.newChat.personalHint
                  : t.newChat.groupHint}
              </span>
            </span>
            <RefreshCw className="size-5 text-primary transition-transform duration-500 active:rotate-180" />
          </button>
        </div>

        {mode === "group" && (
          <div className="mx-4 mt-3 animate-fade-in">
            <TextField
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t.newChat.groupName}
              className="bg-surface"
              maxLength={60}
            />
          </div>
        )}

        <div className="mx-4 mt-3">
          <SearchField
            value={query}
            onChange={setQuery}
            placeholder={t.common.search}
          />
        </div>

        {mode === "group" && selected.length > 0 && (
          <div className="mx-4 mt-3 flex animate-fade-in gap-2 overflow-x-auto scrollbar-none">
            {selected.map((id) => {
              const u = users?.find((x) => x.id === id);
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => pick(id)}
                  className="flex w-14 shrink-0 animate-pop-in flex-col items-center gap-1"
                >
                  <UserAvatar user={u} size={2.75} />
                  <span className="w-full truncate text-center text-[0.6875rem] text-fg-2">
                    {u?.name}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        <div className="mx-4 mt-3 overflow-hidden rounded-2xl bg-surface">
          {isLoading ? (
            <SkeletonList rows={6} />
          ) : (
            list.map((u) => {
              const on = selected.includes(u.id);
              return (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => pick(u.id)}
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors active:bg-surface-2 pointer-fine:hover:bg-surface-2/70"
                >
                  <UserAvatar user={u} size={2.75} withPresence />
                  <span className="min-w-0 flex-1 border-b border-separator pb-2.5 pt-1">
                    <span className="block truncate text-[1.0625rem] font-medium lg:text-[0.975rem]">
                      {u.name}
                    </span>
                    <span className="block truncate text-[0.8125rem] text-fg-2">
                      {u.email}
                    </span>
                  </span>
                  {mode === "group" && (
                    <span
                      className={cn(
                        "flex size-6 shrink-0 items-center justify-center rounded-full border-[1.5px] transition-all duration-200",
                        on
                          ? "border-primary bg-primary text-white"
                          : "border-fg-3",
                      )}
                    >
                      {on && (
                        <Check
                          className="size-3.5 animate-pop-in"
                          strokeWidth={3.2}
                        />
                      )}
                    </span>
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>

      {mode === "group" && (
        <div className="absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-bg via-bg/95 to-transparent px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-6">
          <Button block onClick={submit} loading={create.isPending}>
            {t.newChat.createGroup}
            {selected.length > 0 && (
              <span className="opacity-80">· {selected.length}</span>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
