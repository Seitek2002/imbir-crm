import { useMemo, useState } from "react";
import { useNavigate } from "react-router";

import {
  Bell,
  BellOff,
  CircleCheck,
  ImageIcon,
  Link2,
  LogOut,
  MessageCircle,
  Pin,
  PinOff,
} from "lucide-react";

import {
  useChat,
  useCreateChat,
  useLeaveChat,
  useUpdateChatState,
} from "@/entities/chat";
import { PlaceholderArt, useMessages } from "@/entities/message";
import { TaskCard, useTasks } from "@/entities/task";
import { UserAvatar, useUserMap, useUsers } from "@/entities/user";

import {
  cn,
  formatLastSeen,
  formatShortDate,
  haptic,
  useT,
} from "@/shared/lib";
import { useSession } from "@/shared/model";
import {
  Avatar,
  BackButton,
  ConfirmDialog,
  EmptyState,
  ListGroup,
  ListRow,
  Modal,
  NavBar,
  Screen,
  ScrollArea,
} from "@/shared/ui";

function RoundAction({
  icon,
  label,
  onClick,
  active,
}: {
  active?: boolean;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="pressable flex w-24 flex-col items-center gap-1.5"
    >
      <span
        className={cn(
          "flex size-12 items-center justify-center rounded-full transition-colors [&_svg]:size-[1.35rem]",
          active
            ? "bg-primary text-white"
            : "bg-surface text-primary shadow-soft",
        )}
      >
        {icon}
      </span>
      <span className="text-[0.75rem] font-medium text-primary">{label}</span>
    </button>
  );
}

export function ChatInfoPanel({ chatId }: { chatId: string }) {
  const t = useT();
  const navigate = useNavigate();
  const meId = useSession((s) => s.userId) ?? "";
  const { data: chat } = useChat(chatId);
  const { data: messages } = useMessages(chatId);
  const { data: allUsers } = useUsers();
  const users = useUserMap();
  const update = useUpdateChatState();
  const createChat = useCreateChat();
  const leave = useLeaveChat();
  const [sheet, setSheet] = useState<"links" | "media" | "tasks" | null>(null);
  const [leaveOpen, setLeaveOpen] = useState(false);
  const { data: teamTasks } = useTasks({ scope: "all", teamChatId: chatId });

  const media = useMemo(
    () =>
      (messages ?? []).filter(
        (m) => (m.kind === "image" || m.kind === "video") && m.attachment,
      ),
    [messages],
  );
  const links = useMemo(
    () =>
      (messages ?? []).flatMap((m) =>
        [
          ...(m.text + " " + (m.taskEvent?.text ?? "")).matchAll(
            /https?:\/\/[^\s]+/g,
          ),
        ].map((x) => ({ url: x[0], m })),
      ),
    [messages],
  );

  if (!chat) {
    return (
      <Screen>
        <NavBar
          title={t.chatInfo.title}
          left={<BackButton fallback="/chats" />}
        />
      </Screen>
    );
  }

  const peer = chat.peerId ? users.get(chat.peerId) : undefined;
  const members = (allUsers ?? []).filter((u) => chat.memberIds.includes(u.id));

  const toggle = (patch: { muted?: boolean; pinned?: boolean }) => {
    haptic("light");
    update.mutate({ id: chat.id, patch });
  };

  const openMember = (id: string) => {
    if (id === meId) return navigate("/profile");
    createChat.mutate(
      { kind: "direct", memberIds: [id] },
      { onSuccess: (c) => navigate(`/chats/${c.id}`) },
    );
  };

  return (
    <Screen>
      <NavBar
        title={t.chatInfo.title}
        left={<BackButton fallback={`/chats/${chatId}`} />}
      />
      <ScrollArea className="pb-10">
        <div className="flex animate-fade-up flex-col items-center px-6 pb-5 pt-3 text-center">
          <Avatar
            spec={chat.avatar}
            name={chat.title}
            size={6.5}
            online={peer ? peer.presence === "online" : undefined}
          />
          <h2 className="mt-3 text-[1.625rem] font-bold leading-tight">
            {chat.title}
          </h2>
          <p className="mt-0.5 text-[0.9375rem] text-fg-2">
            {peer
              ? peer.presence === "online"
                ? t.chats.online
                : formatLastSeen(peer.lastSeenAt)
              : chat.kind === "channel"
                ? `${t.chats.members(chat.membersCount)} · ${t.chats.systemChannel}`
                : t.chats.members(chat.membersCount)}
          </p>
          <div className="mt-5 flex justify-center gap-2">
            {peer && (
              <RoundAction
                icon={<MessageCircle />}
                label={t.chatInfo.message}
                onClick={() => navigate(`/chats/${chat.id}`)}
              />
            )}
            <RoundAction
              icon={chat.muted ? <Bell /> : <BellOff />}
              label={chat.muted ? t.chatInfo.unmute : t.chatInfo.mute}
              active={chat.muted}
              onClick={() => toggle({ muted: !chat.muted })}
            />
            <RoundAction
              icon={chat.pinned ? <PinOff /> : <Pin />}
              label={chat.pinned ? t.chatInfo.unpin : t.chatInfo.pin}
              active={chat.pinned}
              onClick={() => toggle({ pinned: !chat.pinned })}
            />
          </div>
        </div>

        {peer && (
          <ListGroup className="mb-4">
            <ListRow title={peer.email} subtitle={t.chatInfo.email} />
            <ListRow title={peer.position} subtitle={t.chatInfo.position} />
          </ListGroup>
        )}

        <ListGroup className="mb-5">
          <ListRow
            icon={<ImageIcon />}
            iconColor="#06ae72"
            title={t.chatInfo.media}
            value={media.length || undefined}
            chevron
            onClick={() => setSheet("media")}
          />
          <ListRow
            icon={<Link2 />}
            iconColor="#fc246c"
            title={t.chatInfo.links}
            value={links.length || undefined}
            chevron
            onClick={() => setSheet("links")}
          />
          <ListRow
            icon={<CircleCheck />}
            iconColor="#fc8400"
            title={t.chatInfo.tasks}
            value={teamTasks?.length || undefined}
            chevron
            onClick={() => setSheet("tasks")}
          />
        </ListGroup>

        {!peer && (
          <ListGroup
            header={t.chats.membersUpper(members.length)}
            className="mb-5"
          >
            {members.map((u) => (
              <ListRow
                key={u.id}
                leading={<UserAvatar user={u} size={2.5} withPresence />}
                title={
                  <>
                    {u.name}
                    {u.id === meId && (
                      <span className="text-fg-3"> · {t.chatInfo.you}</span>
                    )}
                  </>
                }
                subtitle={u.email}
                onClick={() => openMember(u.id)}
              />
            ))}
          </ListGroup>
        )}

        {chat.kind === "group" && (
          <ListGroup>
            <ListRow
              icon={<LogOut />}
              iconColor="#fc302a"
              title={t.chatInfo.leave}
              danger
              onClick={() => setLeaveOpen(true)}
            />
          </ListGroup>
        )}
      </ScrollArea>

      <Modal
        open={sheet === "media"}
        onClose={() => setSheet(null)}
        title={t.chatInfo.media}
        size="lg"
      >
        {media.length ? (
          <div className="grid grid-cols-3 gap-1">
            {media.map((m) => (
              <div
                key={m.id}
                className="aspect-square overflow-hidden rounded-lg"
              >
                {m.attachment?.url && m.kind === "image" ? (
                  <img
                    src={m.attachment.url}
                    alt=""
                    className="size-full object-cover"
                  />
                ) : (
                  <PlaceholderArt kind={m.attachment?.placeholder ?? "video"} />
                )}
              </div>
            ))}
          </div>
        ) : (
          <EmptyState icon={<ImageIcon />} title={t.chatInfo.noMedia} />
        )}
      </Modal>

      <Modal
        open={sheet === "links"}
        onClose={() => setSheet(null)}
        title={t.chatInfo.links}
      >
        {links.length ? (
          <div className="flex flex-col divide-y divide-separator">
            {links.map(({ url, m }, i) => (
              <a
                key={i}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 py-3"
              >
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
                  <Link2 className="size-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[0.9375rem] text-blue">
                    {url}
                  </span>
                  <span className="block text-[0.75rem] text-fg-3">
                    {users.get(m.authorId ?? "")?.name} ·{" "}
                    {formatShortDate(m.createdAt)}
                  </span>
                </span>
              </a>
            ))}
          </div>
        ) : (
          <EmptyState icon={<Link2 />} title={t.chatInfo.noLinks} />
        )}
      </Modal>

      <Modal
        open={sheet === "tasks"}
        onClose={() => setSheet(null)}
        title={t.chatInfo.tasks}
        size="lg"
      >
        {teamTasks?.length ? (
          <div className="flex flex-col gap-2.5">
            {teamTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                assignees={task.assigneeIds
                  .map((id) => users.get(id))
                  .filter((u) => u !== undefined)}
                onClick={() => {
                  setSheet(null);
                  navigate(`/tasks/${task.id}`);
                }}
              />
            ))}
          </div>
        ) : (
          <EmptyState icon={<CircleCheck />} title={t.chatInfo.noTasks} />
        )}
      </Modal>

      <ConfirmDialog
        open={leaveOpen}
        onClose={() => setLeaveOpen(false)}
        onConfirm={() =>
          leave.mutate(chat.id, {
            onSuccess: () => {
              setLeaveOpen(false);
              navigate("/chats", { replace: true });
            },
          })
        }
        loading={leave.isPending}
        icon={<LogOut />}
        title={t.chatInfo.leaveTitle}
        description={t.chatInfo.leaveText}
        confirmLabel={t.chatInfo.leave}
        cancelLabel={t.common.cancel}
        variant="danger"
      />
    </Screen>
  );
}
