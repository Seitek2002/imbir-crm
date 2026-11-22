import { useNavigate } from "react-router";

/** Назад по истории, а если истории нет (открыли по ссылке) — на fallback */
export function useBack(fallback: string) {
  const navigate = useNavigate();
  return () => {
    const idx = (window.history.state as { idx?: number } | null)?.idx ?? 0;
    if (idx > 0) navigate(-1);
    else navigate(fallback, { replace: true });
  };
}
