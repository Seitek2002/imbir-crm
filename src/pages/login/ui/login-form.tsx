import { type FormEvent, useState } from "react";

import { useForgotPassword, useLogin } from "@/entities/session";

import { BRAND, DEMO_PASSWORD } from "@/shared/config";
import { cn, haptic, useT } from "@/shared/lib";
import { toast, useSettings } from "@/shared/model";
import {
  Button,
  Logo,
  Modal,
  PasswordField,
  TextField,
  Toggle,
  Wordmark,
} from "@/shared/ui";

import { TermsSheet } from "./terms-sheet";

export function LoginForm() {
  const t = useT();
  const language = useSettings((s) => s.language);
  const setLanguage = useSettings((s) => s.setLanguage);
  const [email, setEmail] = useState(`aiperi@${BRAND.domain}`);
  const [password, setPassword] = useState(DEMO_PASSWORD);
  const [remember, setRemember] = useState(true);
  const [accepted, setAccepted] = useState(true);
  const [termsOpen, setTermsOpen] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);
  const [error, setError] = useState<null | string>(null);
  const [shake, setShake] = useState(0);
  const login = useLogin();

  const fail = (msg: string) => {
    setError(msg);
    setShake((n) => n + 1);
    haptic("error");
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!accepted) return fail(t.auth.mustAccept);
    setError(null);
    login.mutate(
      { email, password, remember },
      {
        onSuccess: () => haptic("success"),
        onError: () => fail(t.auth.invalid),
      },
    );
  };

  return (
    <div className="relative flex min-h-full flex-col">
      <div className="flex justify-end px-4 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <button
          type="button"
          onClick={() => setLanguage(language === "ru" ? "en" : "ru")}
          className="pressable h-9 min-w-12 rounded-full bg-surface px-3 text-[0.875rem] font-semibold text-fg-2 shadow-soft"
        >
          {language === "ru" ? "EN" : "RU"}
        </button>
      </div>

      <form
        onSubmit={submit}
        className="mx-auto flex w-full max-w-md flex-1 flex-col px-5 pb-8"
      >
        <div className="mt-4 flex animate-fade-up flex-col items-center gap-3 lg:mt-0">
          <Logo
            size={4.25}
            className="shadow-[0_14px_30px_-12px_rgb(252_36_108/0.7)]"
          />
          <Wordmark />
        </div>

        <h1 className="mt-10 animate-fade-up text-[2.125rem] font-bold tracking-tight [animation-delay:40ms]">
          {t.auth.title}
        </h1>
        <p className="animate-fade-up text-[1rem] text-fg-2 [animation-delay:70ms]">
          {t.auth.subtitle}
        </p>

        <div
          key={shake}
          className={cn(
            "mt-5 animate-fade-up divide-y divide-separator overflow-hidden rounded-2xl bg-surface shadow-soft [animation-delay:100ms]",
            shake > 0 && "animate-shake",
          )}
        >
          <TextField
            bare
            type="email"
            inputMode="email"
            autoComplete="username"
            placeholder={t.auth.email}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <PasswordField
            bare
            placeholder={t.auth.password}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <div className="mt-2 flex h-6 items-center justify-between">
          <span
            className={cn(
              "text-[0.875rem] text-danger transition-opacity",
              error ? "opacity-100" : "opacity-0",
            )}
          >
            {error}
          </span>
          <button
            type="button"
            onClick={() => setForgotOpen(true)}
            className="text-[0.9375rem] font-medium text-primary"
          >
            {t.auth.forgot}
          </button>
        </div>

        <div className="mt-3 animate-fade-up divide-y divide-separator overflow-hidden rounded-2xl bg-surface shadow-soft [animation-delay:130ms]">
          <label className="flex h-14 items-center justify-between px-4">
            <span className="text-[1.0625rem] lg:text-[0.975rem]">
              {t.auth.remember}
            </span>
            <Toggle
              checked={remember}
              onChange={setRemember}
              label={t.auth.remember}
            />
          </label>
          <div className="flex min-h-14 items-center justify-between px-4 py-2">
            <div>
              <div className="text-[1.0625rem] lg:text-[0.975rem]">
                {t.auth.acceptTerms}
              </div>
              <button
                type="button"
                onClick={() => setTermsOpen(true)}
                className="text-[0.8125rem] font-medium text-primary"
              >
                {t.auth.read}
              </button>
            </div>
            <Toggle
              checked={accepted}
              onChange={setAccepted}
              label={t.auth.acceptTerms}
            />
          </div>
        </div>

        <Button
          type="submit"
          block
          loading={login.isPending}
          className="mt-6 animate-fade-up [animation-delay:160ms]"
        >
          {t.auth.submit}
        </Button>
        <p className="mt-4 text-center text-[0.8125rem] text-fg-3">
          {t.auth.demoHint}
        </p>
      </form>

      <TermsSheet
        open={termsOpen}
        onClose={() => setTermsOpen(false)}
        onAccept={() => setAccepted(true)}
      />
      <ForgotPasswordModal
        open={forgotOpen}
        onClose={() => setForgotOpen(false)}
        initialEmail={email}
      />
    </div>
  );
}

function ForgotPasswordModal({
  open,
  onClose,
  initialEmail,
}: {
  initialEmail: string;
  onClose: () => void;
  open: boolean;
}) {
  const t = useT();
  const [email, setEmail] = useState(initialEmail);
  const forgot = useForgotPassword();
  return (
    <Modal open={open} onClose={onClose} title={t.auth.forgotTitle} size="sm">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          forgot.mutate(email, {
            onSuccess: () => {
              toast.success(t.auth.forgotSent(email));
              onClose();
            },
            onError: () => toast.error(t.auth.invalid),
          });
        }}
        className="flex flex-col gap-4 pt-1"
      >
        <p className="text-[0.9375rem] text-fg-2">{t.auth.forgotText}</p>
        <TextField
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t.auth.email}
        />
        <Button type="submit" block loading={forgot.isPending}>
          {t.auth.forgotSend}
        </Button>
      </form>
    </Modal>
  );
}
