import { useEffect, useRef, useState } from "react";

import {
  ArrowUp,
  Camera,
  FileText,
  Image as ImageIcon,
  ListTodo,
  Mic,
  Paperclip,
  Reply,
  Smile,
  X,
} from "lucide-react";

import { useDrafts } from "@/entities/chat";
import { useSendMessage } from "@/entities/message";

import type { MessageKind, SendMessageInput } from "@/shared/api";
import {
  cn,
  fileToAttachment,
  formatDuration,
  haptic,
  uid,
  useIsDesktop,
  useT,
} from "@/shared/lib";
import { toast } from "@/shared/model";
import { ActionSheet, AutoTextarea } from "@/shared/ui";

import { useVoiceRecorder } from "../lib/use-voice-recorder";
import { EmojiPicker } from "./emoji-picker";

export type ReplyTarget = { id: string; name: string; text: string };

type Props = {
  chatId: string;
  meId: string;
  onCancelReply: () => void;
  onCreateTask?: () => void;
  onSent?: () => void;
  replyTo: null | ReplyTarget;
};

export function Composer({
  chatId,
  meId,
  replyTo,
  onCancelReply,
  onSent,
  onCreateTask,
}: Props) {
  const t = useT();
  const isDesktop = useIsDesktop();
  const setDraft = useDrafts((s) => s.setDraft);
  // Экран чата пересоздаётся при смене чата (key), поэтому черновик берём один раз
  const [text, setText] = useState(
    () => useDrafts.getState().drafts[chatId] ?? "",
  );
  const [attachOpen, setAttachOpen] = useState(false);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const mediaRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const send = useSendMessage(chatId, meId);
  const voice = useVoiceRecorder();

  // Черновик сохраняем с небольшой задержкой
  useEffect(() => {
    const id = window.setTimeout(() => setDraft(chatId, text), 300);
    return () => window.clearTimeout(id);
  }, [chatId, text, setDraft]);

  useEffect(() => {
    if (replyTo && isDesktop) inputRef.current?.focus();
  }, [replyTo, isDesktop]);

  const dispatch = (input: SendMessageInput) => {
    send.mutate({
      ...input,
      clientId: uid("tmp"),
      replyToId: replyTo?.id ?? null,
    });
    onCancelReply();
    haptic("light");
    onSent?.();
  };

  const submitText = () => {
    const value = text.trim();
    if (!value) return;
    dispatch({ text: value, kind: "text" });
    setText("");
    setDraft(chatId, "");
  };

  const onFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    for (const file of Array.from(files).slice(0, 6)) {
      try {
        const { kind, attachment } = await fileToAttachment(file);
        dispatch({ text: "", kind, attachment });
      } catch {
        toast.error(t.common.error);
      }
    }
  };

  const startVoice = async () => {
    try {
      haptic("medium");
      await voice.start();
    } catch {
      toast.error(t.chats.micDenied);
    }
  };

  const sendVoice = async () => {
    const res = await voice.stop();
    if (!res) return;
    dispatch({
      text: "",
      kind: "voice" as MessageKind,
      attachment: {
        id: uid("a"),
        name: "voice.webm",
        mime: res.mime,
        size: res.size,
        url: res.url,
        durationSec: res.durationSec,
      },
    });
  };

  const hasText = text.trim().length > 0;

  return (
    <div className="relative z-10 shrink-0">
      {replyTo && (
        <div className="glass flex animate-[fade-up_220ms_var(--ease-out-expo)] items-center gap-3 border-t border-separator px-4 py-2">
          <Reply className="size-5 shrink-0 text-primary" />
          <div className="min-w-0 flex-1 border-l-2 border-primary pl-2.5">
            <div className="truncate text-[0.8125rem] font-semibold text-primary">
              {t.chats.replyTo(replyTo.name)}
            </div>
            <div className="truncate text-[0.8125rem] text-fg-2">
              {replyTo.text || t.chats.attachment}
            </div>
          </div>
          <button
            type="button"
            onClick={onCancelReply}
            className="pressable p-1 text-fg-3"
            aria-label={t.common.cancel}
          >
            <X className="size-5" />
          </button>
        </div>
      )}

      <div
        className={cn(
          "glass flex items-end gap-2 border-t border-separator px-2.5 pt-2",
          emojiOpen && !isDesktop
            ? "pb-2"
            : "pb-[max(0.5rem,env(safe-area-inset-bottom))]",
        )}
      >
        {voice.recording ? (
          <div className="flex h-11 flex-1 animate-fade-in items-center gap-3 pl-2">
            <span className="size-3 rounded-full bg-danger [animation:record-pulse_1.2s_infinite]" />
            <span className="font-medium tabular-nums">
              {formatDuration(voice.elapsed)}
            </span>
            <span className="text-fg-2">{t.chats.recording}…</span>
            <button
              type="button"
              onClick={voice.cancel}
              className="ml-auto mr-1 font-medium text-primary"
            >
              {t.chats.tapToCancel}
            </button>
          </div>
        ) : (
          <>
            <button
              type="button"
              onClick={() => setAttachOpen(true)}
              aria-label={t.chats.attachment}
              className="pressable mb-0.5 inline-flex size-10 shrink-0 items-center justify-center rounded-full text-fg-2 pointer-fine:hover:text-primary"
            >
              <Paperclip className="size-6" />
            </button>
            <div className="flex min-h-11 flex-1 items-end rounded-[1.375rem] border border-separator bg-surface pl-4 pr-1.5 dark:bg-surface-2">
              <AutoTextarea
                ref={inputRef}
                value={text}
                maxRows={isDesktop ? 10 : 6}
                placeholder={t.chats.messagePlaceholder}
                onChange={(e) => setText(e.target.value)}
                onFocus={() => !isDesktop && setEmojiOpen(false)}
                onKeyDown={(e) => {
                  if (
                    isDesktop &&
                    e.key === "Enter" &&
                    !e.shiftKey &&
                    !e.nativeEvent.isComposing
                  ) {
                    e.preventDefault();
                    submitText();
                  }
                  if (e.key === "Escape" && replyTo) onCancelReply();
                }}
                className="max-h-60 flex-1 py-[0.6rem] text-[1.0625rem] leading-[1.4] lg:text-[0.9375rem]"
              />
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  if (!emojiOpen && !isDesktop) inputRef.current?.blur();
                  setEmojiOpen((v) => !v);
                }}
                aria-label="emoji"
                className={cn(
                  "pressable mb-[0.3rem] inline-flex size-8 shrink-0 items-center justify-center rounded-full transition-colors",
                  emojiOpen
                    ? "text-primary"
                    : "text-fg-3 pointer-fine:hover:text-fg-2",
                )}
              >
                <Smile className="size-6" />
              </button>
            </div>
          </>
        )}

        {/* Микрофон ↔ отправка: плавная смена при появлении текста */}
        <div className="relative mb-0.5 size-10 shrink-0">
          <button
            type="button"
            onClick={voice.recording ? sendVoice : submitText}
            aria-label="send"
            className={cn(
              "absolute inset-0 inline-flex items-center justify-center rounded-full bg-primary text-white shadow-[0_6px_14px_-6px_rgb(252_36_108/0.7)] transition-all duration-300 ease-spring active:scale-90",
              hasText || voice.recording
                ? "scale-100 opacity-100"
                : "pointer-events-none scale-50 opacity-0",
            )}
          >
            <ArrowUp className="size-5" strokeWidth={2.6} />
          </button>
          <button
            type="button"
            onClick={startVoice}
            aria-label={t.chats.voice}
            className={cn(
              "absolute inset-0 inline-flex items-center justify-center rounded-full text-fg-2 transition-all duration-300 ease-spring pointer-fine:hover:text-primary",
              hasText || voice.recording
                ? "pointer-events-none scale-50 opacity-0"
                : "scale-100 opacity-100",
            )}
          >
            <Mic className="size-6" />
          </button>
        </div>
      </div>

      {emojiOpen &&
        (isDesktop ? (
          <div className="popover absolute bottom-full right-14 mb-2 w-[22rem] overflow-hidden rounded-2xl border border-separator bg-elevated pt-2 shadow-float">
            <EmojiPicker onPick={(e) => setText((v) => v + e)} />
          </div>
        ) : (
          <div className="glass animate-[fade-up_240ms_var(--ease-out-expo)] pb-safe pt-2">
            <EmojiPicker onPick={(e) => setText((v) => v + e)} />
          </div>
        ))}

      <input
        ref={mediaRef}
        type="file"
        accept="image/*,video/*"
        multiple
        hidden
        onChange={(e) => {
          void onFiles(e.target.files);
          e.target.value = "";
        }}
      />
      <input
        ref={fileRef}
        type="file"
        multiple
        hidden
        onChange={(e) => {
          void onFiles(e.target.files);
          e.target.value = "";
        }}
      />
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        hidden
        onChange={(e) => {
          void onFiles(e.target.files);
          e.target.value = "";
        }}
      />

      <ActionSheet
        open={attachOpen}
        onClose={() => setAttachOpen(false)}
        cancelLabel={t.common.cancel}
        options={[
          {
            label: t.chats.attachPhoto,
            icon: <ImageIcon />,
            onSelect: () => mediaRef.current?.click(),
          },
          {
            label: t.chats.attachFile,
            icon: <FileText />,
            onSelect: () => fileRef.current?.click(),
          },
          ...(!isDesktop
            ? [
                {
                  label: t.chats.attachCamera,
                  icon: <Camera />,
                  onSelect: () => cameraRef.current?.click(),
                },
              ]
            : []),
          ...(onCreateTask
            ? [
                {
                  label: t.chats.attachTask,
                  icon: <ListTodo />,
                  onSelect: onCreateTask,
                },
              ]
            : []),
        ]}
      />
    </div>
  );
}
