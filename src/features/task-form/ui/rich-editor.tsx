import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";

import {
  Bold,
  Heading,
  Italic,
  Link2,
  List,
  ListOrdered,
  RemoveFormatting,
  Type,
  Underline,
} from "lucide-react";

import { cn, sanitizeHtml, useT } from "@/shared/lib";
import { Button, Modal, TextField } from "@/shared/ui";

export type RichEditorHandle = {
  appendText: (text: string) => void;
  focus: () => void;
  getHtml: () => string;
  setHtml: (html: string) => void;
};

type Props = {
  initialHtml: string;
  onChange: (html: string) => void;
  placeholder: string;
};

type Cmd =
  "bold" | "insertOrderedList" | "insertUnorderedList" | "italic" | "underline";

/**
 * Редактор описания задачи: contentEditable + execCommand.
 * Для демо этого достаточно; при подключении бэкенда разметка
 * проходит тот же sanitizeHtml, что и при рендере.
 */
export const RichEditor = forwardRef<RichEditorHandle, Props>(
  function RichEditor({ initialHtml, placeholder, onChange }, ref) {
    const t = useT();
    const el = useRef<HTMLDivElement>(null);
    const savedRange = useRef<null | Range>(null);
    const [active, setActive] = useState<Record<string, boolean>>({});
    const [empty, setEmpty] = useState(!initialHtml);
    const [linkOpen, setLinkOpen] = useState(false);
    const [link, setLink] = useState("https://");

    useEffect(() => {
      if (el.current) el.current.innerHTML = sanitizeHtml(initialHtml);
      // Только начальное значение — дальше редактор неуправляемый
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const emit = () => {
      const html = el.current?.innerHTML ?? "";
      setEmpty(!el.current?.textContent?.trim() && !/<(li|br)/.test(html));
      onChange(html);
    };

    useImperativeHandle(ref, () => ({
      appendText: (text) => {
        if (!el.current) return;
        const p = document.createElement("p");
        p.textContent = text;
        el.current.appendChild(p);
        emit();
      },
      getHtml: () => el.current?.innerHTML ?? "",
      setHtml: (html) => {
        if (el.current) el.current.innerHTML = sanitizeHtml(html);
        emit();
      },
      focus: () => el.current?.focus(),
    }));

    useEffect(() => {
      const update = () => {
        if (!el.current?.contains(document.getSelection()?.anchorNode ?? null))
          return;
        setActive({
          bold: document.queryCommandState("bold"),
          italic: document.queryCommandState("italic"),
          underline: document.queryCommandState("underline"),
          insertUnorderedList: document.queryCommandState(
            "insertUnorderedList",
          ),
          insertOrderedList: document.queryCommandState("insertOrderedList"),
          h3: document.queryCommandValue("formatBlock").toLowerCase() === "h3",
        });
      };
      document.addEventListener("selectionchange", update);
      return () => document.removeEventListener("selectionchange", update);
    }, []);

    const exec = (cmd: string, value?: string) => {
      el.current?.focus();
      document.execCommand(cmd, false, value);
      emit();
    };

    const tool = (
      key: string,
      icon: React.ReactNode,
      onClick: () => void,
      label: string,
    ) => (
      <button
        key={key}
        type="button"
        aria-label={label}
        title={label}
        onMouseDown={(e) => e.preventDefault()}
        onClick={onClick}
        className={cn(
          "pressable inline-flex size-9 items-center justify-center rounded-lg transition-colors [&_svg]:size-[1.15rem]",
          active[key]
            ? "bg-primary-soft text-primary"
            : "text-fg-2 pointer-fine:hover:bg-surface-3/60",
        )}
      >
        {icon}
      </button>
    );

    return (
      <div className="overflow-hidden rounded-2xl border border-separator bg-surface">
        <div className="flex flex-wrap items-center gap-0.5 border-b border-separator bg-surface-2/60 px-1.5 py-1">
          {tool("p", <Type />, () => exec("formatBlock", "<p>"), "Text")}
          {tool(
            "h3",
            <Heading />,
            () => exec("formatBlock", active.h3 ? "<p>" : "<h3>"),
            "Heading",
          )}
          <span className="mx-1 h-5 w-px bg-separator" />
          {(["bold", "italic", "underline"] as Cmd[]).map((c) =>
            tool(
              c,
              c === "bold" ? (
                <Bold />
              ) : c === "italic" ? (
                <Italic />
              ) : (
                <Underline />
              ),
              () => exec(c),
              c,
            ),
          )}
          <span className="mx-1 h-5 w-px bg-separator" />
          {tool(
            "insertUnorderedList",
            <List />,
            () => exec("insertUnorderedList"),
            "List",
          )}
          {tool(
            "insertOrderedList",
            <ListOrdered />,
            () => exec("insertOrderedList"),
            "Ordered list",
          )}
          {tool(
            "link",
            <Link2 />,
            () => {
              const sel = document.getSelection();
              savedRange.current =
                sel && sel.rangeCount ? sel.getRangeAt(0).cloneRange() : null;
              setLink("https://");
              setLinkOpen(true);
            },
            "Link",
          )}
          {tool(
            "clear",
            <RemoveFormatting />,
            () => exec("removeFormat"),
            "Clear",
          )}
        </div>
        <div className="relative">
          {empty && (
            <span className="pointer-events-none absolute left-4 top-3 text-[1rem] text-fg-3">
              {placeholder}
            </span>
          )}
          <div
            ref={el}
            contentEditable
            suppressContentEditableWarning
            onInput={emit}
            className="rich-text min-h-36 px-4 py-3 text-[1rem] leading-relaxed outline-none lg:text-[0.9375rem]"
          />
        </div>

        <Modal
          open={linkOpen}
          onClose={() => setLinkOpen(false)}
          title="Link"
          size="sm"
        >
          <form
            className="flex flex-col gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              setLinkOpen(false);
              el.current?.focus();
              const sel = document.getSelection();
              if (savedRange.current && sel) {
                sel.removeAllRanges();
                sel.addRange(savedRange.current);
              }
              if (/^(https?:|mailto:)/.test(link)) {
                if (sel && !sel.isCollapsed) exec("createLink", link);
                else
                  exec(
                    "insertHTML",
                    `<a href="${link.replace(/"/g, "")}">${link.replace(/[<>]/g, "")}</a>&nbsp;`,
                  );
              }
            }}
          >
            <TextField
              autoFocus
              value={link}
              onChange={(e) => setLink(e.target.value)}
            />
            <Button type="submit" block>
              {t.common.done}
            </Button>
          </form>
        </Modal>
      </div>
    );
  },
);
