import { useState } from "react";

import { cn, haptic, useT } from "@/shared/lib";
import { toast } from "@/shared/model";
import { Button, Modal } from "@/shared/ui";

import { usePublishStory } from "../api/stories";
import { STORY_BACKGROUNDS, STORY_BG_KEYS } from "../config/story-backgrounds";

const EMOJIS = [
  "✨",
  "🚀",
  "☕",
  "🎯",
  "📊",
  "🎨",
  "🔥",
  "🏖️",
  "🤒",
  "🎧",
  "📞",
  "💻",
];

export function PublishStorySheet({
  open,
  onClose,
}: {
  onClose: () => void;
  open: boolean;
}) {
  const t = useT();
  const [text, setText] = useState("");
  const [emoji, setEmoji] = useState(EMOJIS[0]);
  const [bg, setBg] = useState(STORY_BG_KEYS[0]);
  const publish = usePublishStory();

  const submit = () => {
    if (!text.trim()) return;
    publish.mutate(
      { text: text.trim(), emoji, bg },
      {
        onSuccess: () => {
          haptic("success");
          toast.success(t.stories.published);
          setText("");
          onClose();
        },
      },
    );
  };

  return (
    <Modal open={open} onClose={onClose} title={t.stories.add} size="md">
      <div className="flex flex-col gap-4">
        <div
          className="flex aspect-[4/3] flex-col items-center justify-center rounded-2xl p-6 text-center text-white shadow-soft transition-[background] duration-500"
          style={{ background: STORY_BACKGROUNDS[bg] }}
        >
          <span key={emoji} className="animate-pop-in text-6xl">
            {emoji}
          </span>
          <p className="mt-3 line-clamp-3 text-xl font-bold">
            {text || t.stories.placeholder}
          </p>
        </div>

        <input
          autoFocus
          value={text}
          maxLength={80}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder={t.stories.placeholder}
          className="h-12 rounded-2xl bg-surface-2 px-4 text-[1.0625rem] outline-none focus:ring-2 focus:ring-primary/30"
        />

        <div className="flex flex-wrap gap-1.5">
          {EMOJIS.map((e) => (
            <button
              key={e}
              type="button"
              onClick={() => setEmoji(e)}
              className={cn(
                "pressable flex size-10 items-center justify-center rounded-xl text-2xl transition-colors",
                e === emoji
                  ? "bg-primary-soft ring-2 ring-primary/40"
                  : "bg-surface-2",
              )}
            >
              {e}
            </button>
          ))}
        </div>

        <div className="flex gap-2.5">
          {STORY_BG_KEYS.map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => setBg(k)}
              aria-label={k}
              className={cn(
                "pressable size-9 rounded-full transition-transform",
                k === bg &&
                  "scale-110 ring-[3px] ring-primary/40 ring-offset-2 ring-offset-elevated",
              )}
              style={{ background: STORY_BACKGROUNDS[k] }}
            />
          ))}
        </div>

        <p className="text-[0.8125rem] text-fg-2">{t.stories.expires}</p>
        <Button
          block
          onClick={submit}
          loading={publish.isPending}
          disabled={!text.trim()}
        >
          {t.stories.publish}
        </Button>
      </div>
    </Modal>
  );
}
