import { useState } from "react";

import { cn } from "@/shared/lib";

const GROUPS: { emojis: string[]; icon: string }[] = [
  {
    icon: "😀",
    emojis:
      "😀 😃 😄 😁 😆 😅 😂 🤣 😊 😇 🙂 😉 😍 🥰 😘 😋 😜 🤪 😎 🤩 🥳 😏 😒 😞 😔 😟 😕 🙁 😣 😫 😩 🥺 😢 😭 😤 😠 😡 🤯 😳 🥵 🥶 😱 😨 😰 🤗 🤔 🫡 🤭 🤫 😶 😐 😑 😬 🙄 😯 😴 🤤 😪 😵 🤐 🥴 🤢 🤮 🤧 😷 🤒 🤕".split(
        " ",
      ),
  },
  {
    icon: "👍",
    emojis:
      "👍 👎 👌 🤌 ✌️ 🤞 🤟 🤘 🤙 👈 👉 👆 👇 ☝️ ✋ 🤚 🖐 🖖 👋 🤝 🙏 ✍️ 💪 👏 🙌 👐 🤲 🫶 ❤️ 🧡 💛 💚 💙 💜 🖤 🤍 💔 ❣️ 💯 🔥 ✨ ⭐ 🌟 💫 ⚡ 💥 🎉 🎊".split(
        " ",
      ),
  },
  {
    icon: "💼",
    emojis:
      "💼 📁 📂 🗂 📅 📆 🗓 📇 📈 📉 📊 📋 📌 📍 📎 🖇 📏 📐 ✂️ 🗃 🗄 🗑 🔒 🔓 🔑 💡 🔦 💻 🖥 ⌨️ 🖱 📱 ☎️ 📞 📟 📠 📺 📷 📸 🎥 🎬 🎧 🎤 ☕ 🍕 🍔 🍩 🍪 🚀 🛠 ⚙️ 🧩 ✅ ❌ ⚠️ ❓ ❗".split(
        " ",
      ),
  },
];

/** Компактная панель эмодзи для поля ввода */
export function EmojiPicker({ onPick }: { onPick: (e: string) => void }) {
  const [group, setGroup] = useState(0);
  return (
    <div className="flex w-full flex-col">
      <div className="flex gap-1 border-b border-separator px-2 pb-2">
        {GROUPS.map((g, i) => (
          <button
            key={g.icon}
            type="button"
            onClick={() => setGroup(i)}
            className={cn(
              "pressable flex size-9 items-center justify-center rounded-xl text-xl transition-colors",
              i === group ? "bg-primary-soft" : "opacity-60",
            )}
          >
            {g.icon}
          </button>
        ))}
      </div>
      <div
        key={group}
        className="grid h-56 animate-fade-in grid-cols-8 content-start gap-0.5 overflow-y-auto p-2 lg:grid-cols-9"
      >
        {GROUPS[group].emojis.map((e) => (
          <button
            key={e}
            type="button"
            onMouseDown={(ev) => ev.preventDefault()}
            onClick={() => onPick(e)}
            className="flex aspect-square items-center justify-center rounded-lg text-[1.6rem] transition-transform active:scale-125 pointer-fine:hover:bg-surface-2"
          >
            {e}
          </button>
        ))}
      </div>
    </div>
  );
}
