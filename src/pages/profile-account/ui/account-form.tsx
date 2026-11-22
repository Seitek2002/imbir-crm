import { useRef, useState } from "react";

import { Camera, Check } from "lucide-react";

import {
  UserAvatar,
  useChangePassword,
  useMe,
  useUpdateMe,
} from "@/entities/user";

import { ApiError, type AvatarSpec, type Me } from "@/shared/api";
import { cn, compressImage, haptic, useT } from "@/shared/lib";
import { toast } from "@/shared/model";
import {
  Avatar,
  Button,
  PasswordField,
  Skeleton,
  TextField,
} from "@/shared/ui";

const PRESETS: AvatarSpec[] = [
  { kind: "emoji", emoji: "🦊", bg: "#ffe9dc" },
  { kind: "emoji", emoji: "🐼", bg: "#eeeeee" },
  { kind: "emoji", emoji: "👽", bg: "#e3f9e5" },
  { kind: "emoji", emoji: "🤖", bg: "#e6f0ff" },
  { kind: "emoji", emoji: "🥷", bg: "#e8e8ee" },
  { kind: "emoji", emoji: "🦄", bg: "#f6e8ff" },
  { kind: "emoji", emoji: "🐉", bg: "#e2f7ea" },
  { kind: "emoji", emoji: "🦉", bg: "#f3eadf" },
  { kind: "emoji", emoji: "😎", bg: "#fff1d6" },
  { kind: "emoji", emoji: "🥳", bg: "#ffe4f0" },
  { kind: "emoji", emoji: "👻", bg: "#f1e9ff" },
  { kind: "emoji", emoji: "🐱", bg: "#fff3c4" },
];

const sameAvatar = (a: AvatarSpec, b: AvatarSpec) =>
  JSON.stringify(a) === JSON.stringify(b);

export function AccountForm() {
  const { data: me } = useMe();
  if (!me) {
    return (
      <div className="flex flex-col items-center gap-4 p-6">
        <Skeleton className="size-24 rounded-full" />
        <Skeleton className="h-12 w-full rounded-2xl" />
        <Skeleton className="h-40 w-full rounded-2xl" />
      </div>
    );
  }
  // Форма монтируется с уже загруженным профилем — начальные значения из него
  return <AccountFormFields key={me.id} me={me} />;
}

function AccountFormFields({ me }: { me: Me }) {
  const t = useT();
  const update = useUpdateMe();
  const [name, setName] = useState(me.name);
  const [position, setPosition] = useState(me.position);
  const [avatar, setAvatar] = useState<AvatarSpec>(me.avatar);
  const [showInitials, setShowInitials] = useState(me.showInitials);
  const photoRef = useRef<HTMLInputElement>(null);

  const dirty =
    name.trim() !== me.name ||
    position.trim() !== me.position ||
    !sameAvatar(avatar, me.avatar) ||
    showInitials !== me.showInitials;

  const save = () =>
    update.mutate(
      { name: name.trim(), position: position.trim(), avatar, showInitials },
      {
        onSuccess: () => {
          haptic("success");
          toast.success(t.profile.saved);
        },
      },
    );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col items-center gap-3 pt-2">
        <button
          type="button"
          onClick={() => photoRef.current?.click()}
          className="group relative rounded-full"
        >
          <span
            key={JSON.stringify(avatar) + showInitials}
            className="block animate-pop-in"
          >
            <Avatar
              spec={avatar}
              name={name || me.name}
              size={6}
              showInitials={showInitials}
            />
          </span>
          <span className="absolute bottom-0 right-0 flex size-9 items-center justify-center rounded-full border-[3px] border-bg bg-primary text-white transition-transform group-active:scale-90">
            <Camera className="size-4" />
          </span>
        </button>
        <input
          ref={photoRef}
          type="file"
          accept="image/*"
          hidden
          onChange={async (e) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            if (!file) return;
            const { url } = await compressImage(file, 320, 0.85);
            setAvatar({ kind: "image", src: url });
            setShowInitials(false);
          }}
        />
        {avatar.kind === "image" && (
          <button
            type="button"
            onClick={() => setAvatar(PRESETS[5])}
            className="text-[0.8125rem] font-medium text-danger"
          >
            {t.profile.removePhoto}
          </button>
        )}
      </div>

      <div className="divide-y divide-separator overflow-hidden rounded-2xl bg-surface">
        <TextField
          bare
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t.profile.name}
          maxLength={60}
        />
        <TextField
          bare
          value={position}
          onChange={(e) => setPosition(e.target.value)}
          placeholder={t.profile.position}
          maxLength={60}
        />
        <TextField
          bare
          value={me.email}
          readOnly
          disabled
          className="opacity-60"
        />
      </div>

      <div className="rounded-2xl bg-surface p-4">
        <div className="text-[1rem] font-semibold">{t.profile.avatars}</div>
        <div className="text-[0.8125rem] text-fg-2">
          {t.profile.avatarsHint}
        </div>
        <div className="mt-3 grid grid-cols-6 gap-2.5">
          {PRESETS.map((p) => {
            const on = !showInitials && sameAvatar(p, avatar);
            return (
              <button
                key={JSON.stringify(p)}
                type="button"
                onClick={() => {
                  haptic("light");
                  setAvatar(p);
                  setShowInitials(false);
                }}
                className={cn(
                  "pressable relative aspect-square rounded-full p-[3px] transition-all duration-200",
                  on ? "ring-[2.5px] ring-primary" : "ring-0",
                )}
              >
                <Avatar spec={p} name="" size={2.75} className="size-full!" />
                {on && (
                  <span className="absolute -right-0.5 -top-0.5 flex size-4.5 animate-pop-in items-center justify-center rounded-full bg-primary text-white">
                    <Check className="size-3" strokeWidth={3.5} />
                  </span>
                )}
              </button>
            );
          })}
        </div>
        <button
          type="button"
          onClick={() => setShowInitials((v) => !v)}
          className={cn(
            "mt-4 text-[0.9375rem] font-medium",
            showInitials ? "text-fg-2" : "text-primary",
          )}
        >
          {t.profile.showInitials}
          {showInitials && (
            <Check className="ml-1 inline size-4 text-primary" />
          )}
        </button>
        <Button
          block
          className="mt-4"
          disabled={!dirty || !name.trim()}
          loading={update.isPending}
          onClick={save}
        >
          {t.profile.saveProfile}
        </Button>
      </div>

      <ChangePasswordCard />
      <div className="flex items-center gap-2 px-1 text-[0.8125rem] text-fg-3">
        <UserAvatar user={me} size={1.25} />
        {me.email}
      </div>
    </div>
  );
}

function ChangePasswordCard() {
  const t = useT();
  const change = useChangePassword();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [repeat, setRepeat] = useState("");
  const [error, setError] = useState<null | string>(null);

  const submit = () => {
    if (next.length < 6) return setError(t.profile.passwordShort);
    if (next !== repeat) return setError(t.profile.passwordMismatch);
    setError(null);
    change.mutate(
      { current, next },
      {
        onSuccess: () => {
          toast.success(t.profile.passwordUpdated);
          setCurrent("");
          setNext("");
          setRepeat("");
        },
        onError: (e) => {
          haptic("error");
          setError(
            e instanceof ApiError && e.code === "wrong_password"
              ? t.auth.invalid
              : t.common.error,
          );
        },
      },
    );
  };

  return (
    <div className="rounded-2xl bg-surface p-4">
      <div className="text-[1rem] font-semibold">
        {t.profile.changePassword}
      </div>
      <div className="text-[0.8125rem] text-fg-2">{t.profile.passwordHint}</div>
      <div className="mt-3 flex flex-col gap-2.5">
        <PasswordField
          value={current}
          onChange={(e) => setCurrent(e.target.value)}
          placeholder={t.profile.currentPassword}
        />
        <PasswordField
          value={next}
          onChange={(e) => setNext(e.target.value)}
          placeholder={t.profile.newPassword}
          autoComplete="new-password"
        />
        <PasswordField
          value={repeat}
          onChange={(e) => setRepeat(e.target.value)}
          placeholder={t.profile.repeatPassword}
          autoComplete="new-password"
        />
      </div>
      {error && (
        <p className="mt-2 animate-fade-in text-[0.8125rem] text-danger">
          {error}
        </p>
      )}
      <Button
        variant="outline"
        block
        className="mt-4"
        disabled={!current || !next || !repeat}
        loading={change.isPending}
        onClick={submit}
      >
        {t.profile.updatePassword}
      </Button>
    </div>
  );
}
