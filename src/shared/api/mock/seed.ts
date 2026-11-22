import { BRAND, DEMO_PASSWORD } from "../../config/brand";
import type {
  Attachment,
  AvatarSpec,
  Presence,
  Role,
  TaskEvent,
} from "../types";
import type {
  ChatRow,
  ChatUserState,
  CommentRow,
  DB,
  MessageRow,
  NotificationRow,
  StoryRow,
  TaskRow,
  UserRow,
} from "./db";

/**
 * Демо-данные: выдуманная сеть кофеен. Люди, переписка, задачи и файлы придуманы.
 * Сайт публичный, поэтому не переносите сюда данные из референсов и рабочих чатов.
 *
 * Время считается от первого запуска, поэтому «Сегодня/Вчера» всегда актуальны.
 */

const MIN = 60_000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

export const ME_ID = "u_aiperi";

export function createSeed(now: Date): DB {
  const t0 = now.getTime();
  const ago = (ms: number) => new Date(t0 - ms).toISOString();
  /** Прошедший день в конкретное время: dayAt(3, "10:30") */
  const dayAt = (daysAgo: number, hhmm: string) => {
    const d = new Date(t0 - daysAgo * DAY);
    const [h, m] = hhmm.split(":").map(Number);
    d.setHours(h, m, 0, 0);
    return d.toISOString();
  };
  const inDays = (days: number) => {
    const d = new Date(t0 + days * DAY);
    d.setHours(15, 0, 0, 0);
    return d.toISOString();
  };

  /* ── Отделы ──────────────────────────────────────────────────────────── */

  const departments = [
    { id: "d_marketing", name: "Маркетинг" },
    { id: "d_dev", name: "Разработка" },
    { id: "d_design", name: "Дизайн" },
    { id: "d_sales", name: "Продажи" },
    { id: "d_logistics", name: "Логистика" },
    { id: "d_finance", name: "Бухгалтерия" },
    { id: "d_legal", name: "Юридический отдел" },
    { id: "d_hr", name: "HR" },
    { id: "d_support", name: "Поддержка" },
    { id: "d_content", name: "Контент" },
  ];

  /* ── Сотрудники ──────────────────────────────────────────────────────── */

  const emoji = (e: string, bg: string): AvatarSpec => ({
    kind: "emoji",
    emoji: e,
    bg,
  });
  const initials = (color: string): AvatarSpec => ({ kind: "initials", color });

  type U = [
    id: string,
    name: string,
    handle: string,
    position: string,
    avatar: AvatarSpec,
    dept: string,
    presence: Presence,
    role?: Role,
  ];

  const people: U[] = [
    [
      ME_ID,
      "Айпери",
      "aiperi",
      "Продуктовый дизайнер",
      emoji("🦊", "#ffe9dc"),
      "d_design",
      "online",
    ],
    [
      "u_azamat",
      "Азамат",
      "azamat",
      "Управляющий сетью",
      emoji("😎", "#fff1d6"),
      "d_sales",
      "online",
      "manager",
    ],
    [
      "u_cholpon",
      "Чолпон",
      "cholpon",
      "Офис-менеджер",
      initials("#fc246c"),
      "d_hr",
      "online",
    ],
    [
      "u_system",
      "Администратор",
      "admin",
      "Администратор системы",
      emoji("🤖", "#e6f0ff"),
      "d_dev",
      "offline",
      "admin",
    ],
    [
      "u_bakyt",
      "Бакыт",
      "bakyt",
      "Бариста-тренер",
      emoji("🐼", "#eeeeee"),
      "d_support",
      "offline",
    ],
    [
      "u_vera",
      "Вера",
      "vera",
      "Маркетолог",
      initials("#6c42fc"),
      "d_marketing",
      "online",
    ],
    [
      "u_kirill",
      "Кирилл",
      "kirill",
      "Редактор",
      initials("#fc8400"),
      "d_content",
      "online",
    ],
    [
      "u_saltanat",
      "Салтанат",
      "saltanat",
      "Финансист",
      initials("#06ae72"),
      "d_finance",
      "online",
    ],
    [
      "u_ilya",
      "Илья",
      "ilya",
      "Веб-разработчик",
      emoji("🐱", "#fff3c4"),
      "d_dev",
      "online",
    ],
    [
      "u_arsen",
      "Арсен",
      "arsen",
      "Системный инженер",
      initials("#3c7efc"),
      "d_dev",
      "offline",
    ],
    [
      "u_dinara",
      "Динара",
      "dinara",
      "Менеджер по закупкам",
      initials("#18baba"),
      "d_logistics",
      "online",
    ],
    [
      "u_ulan",
      "Улан",
      "ulan",
      "Водитель-экспедитор",
      initials("#fc302a"),
      "d_logistics",
      "offline",
    ],
    [
      "u_gulnara",
      "Гульнара",
      "gulnara",
      "Рекрутер",
      emoji("🥳", "#ffe4f0"),
      "d_hr",
      "offline",
    ],
    [
      "u_oleg",
      "Олег",
      "oleg",
      "Инженер по качеству",
      initials("#5856d6"),
      "d_dev",
      "offline",
    ],
    [
      "u_polina",
      "Полина",
      "polina",
      "Иллюстратор",
      emoji("🦉", "#f3eadf"),
      "d_design",
      "online",
    ],
    [
      "u_askar",
      "Аскар",
      "askar",
      "Старший бариста",
      initials("#06ae72"),
      "d_support",
      "offline",
    ],
    [
      "u_nina",
      "Нина",
      "nina",
      "Специалист по договорам",
      initials("#5856d6"),
      "d_legal",
      "offline",
    ],
    [
      "u_tilek",
      "Тилек",
      "tilek",
      "Корпоративные продажи",
      emoji("🐉", "#e2f7ea"),
      "d_sales",
      "offline",
    ],
    [
      "u_sofia",
      "София",
      "sofia",
      "Фотограф",
      emoji("👻", "#f1e9ff"),
      "d_content",
      "offline",
    ],
    [
      "u_roman",
      "Роман",
      "roman",
      "Координатор проектов",
      initials("#3c7efc"),
      "d_marketing",
      "online",
      "manager",
    ],
  ];

  const users: UserRow[] = people.map(
    (
      [id, name, handle, position, avatar, departmentId, presence, role],
      i,
    ) => ({
      id,
      name,
      handle,
      email: `${handle}@${BRAND.domain}`,
      position,
      avatar,
      showInitials: false,
      role: role ?? "member",
      presence,
      lastSeenAt:
        presence === "online" ? ago(0) : ago((i % 5) * 3 * HOUR + 40 * MIN),
      departmentId,
      password: DEMO_PASSWORD,
      mutedDepartmentIds: id === ME_ID ? ["d_finance", "d_legal", "d_hr"] : [],
    }),
  );
  const allIds = users.map((u) => u.id);

  /* ── Чаты ────────────────────────────────────────────────────────────── */

  const group = (
    id: string,
    title: string,
    handle: string,
    memberIds: string[],
    avatar: AvatarSpec = { kind: "group" },
    extra: Partial<ChatRow> = {},
  ): ChatRow => ({
    id,
    kind: "group",
    title,
    handle,
    avatar,
    memberIds,
    readOnly: false,
    createdAt: ago(120 * DAY),
    createdBy: "u_system",
    ...extra,
  });
  const direct = (id: string, peer: string, createdDaysAgo = 60): ChatRow => ({
    id,
    kind: "direct",
    title: "",
    handle: null,
    avatar: { kind: "group" },
    memberIds: [ME_ID, peer],
    readOnly: false,
    createdAt: ago(createdDaysAgo * DAY),
    createdBy: ME_ID,
  });

  const chats: ChatRow[] = [
    group(
      "c_daily",
      "Daily",
      "daily",
      allIds,
      { kind: "group" },
      { kind: "channel", readOnly: true },
    ),
    group("c_marketing", "Маркетинг", "маркетинг", [
      ME_ID,
      "u_azamat",
      "u_vera",
      "u_kirill",
      "u_polina",
      "u_sofia",
      "u_roman",
      "u_tilek",
      "u_cholpon",
      "u_ilya",
    ]),
    group(
      "c_site",
      "Сайт и приложение",
      "сайт",
      [
        ME_ID,
        "u_ilya",
        "u_arsen",
        "u_oleg",
        "u_roman",
        "u_system",
        "u_polina",
        "u_askar",
      ],
      { kind: "brand" },
    ),
    group("c_all", "Вся команда", "команда", allIds, {
      kind: "color",
      color: "#18baba",
    }),
    group(
      "c_opening",
      "Открытие кофейни",
      "открытие",
      [
        ME_ID,
        "u_azamat",
        "u_dinara",
        "u_ulan",
        "u_bakyt",
        "u_gulnara",
        "u_saltanat",
        "u_nina",
        "u_askar",
      ],
      { kind: "group", color: "#fc8400" },
    ),
    direct("c_ilya", "u_ilya"),
    direct("c_polina", "u_polina"),
    group(
      "c_training",
      "Обучение бариста",
      "обучение",
      [ME_ID, "u_bakyt", "u_askar", "u_gulnara"],
      { kind: "group", color: "#6c42fc" },
    ),
    direct("c_kirill", "u_kirill"),
    direct("c_system", "u_system", 90),
    direct("c_askar", "u_askar", 4),
  ];

  /* ── Сообщения ───────────────────────────────────────────────────────── */

  const messages: MessageRow[] = [];
  let seq = 0;
  const msg = (
    chatId: string,
    authorId: null | string,
    createdAt: string,
    text: string,
    extra: Partial<MessageRow> = {},
  ) => {
    const row: MessageRow = {
      id: `m${++seq}`,
      chatId,
      authorId,
      kind: "text",
      text,
      createdAt,
      replyToId: null,
      attachment: null,
      call: null,
      taskEvent: null,
      pinned: false,
      deleted: false,
      clientId: null,
      ...extra,
    };
    messages.push(row);
    return row;
  };
  let attSeq = 0;
  const att = (a: Omit<Attachment, "id">): Attachment => ({
    id: `a${++attSeq}`,
    ...a,
  });
  const image = (
    placeholder: string,
    name: string,
    width: number,
    height: number,
  ): Partial<MessageRow> => ({
    kind: "image",
    attachment: att({
      name,
      mime: "image/jpeg",
      size: 240_000,
      width,
      height,
      placeholder,
    }),
  });
  const file = (
    name: string,
    size: number,
    mime = "application/pdf",
  ): Partial<MessageRow> => ({
    kind: "file",
    attachment: att({ name, mime, size }),
  });
  const video = (name: string, durationSec: number): Partial<MessageRow> => ({
    kind: "video",
    attachment: att({
      name,
      mime: "video/mp4",
      size: durationSec * 180_000,
      durationSec,
      placeholder: "video",
    }),
  });
  const call = (durationSec: number): Partial<MessageRow> => ({
    kind: "call",
    call: { durationSec, video: true },
  });
  const event = (
    task: TaskRow,
    icon: TaskEvent["icon"],
    text: string,
  ): Partial<MessageRow> => ({
    kind: "task_event",
    taskEvent: { taskId: task.id, icon, title: task.title, text },
  });

  /* ── Задачи ──────────────────────────────────────────────────────────── */

  const tasks: TaskRow[] = [];
  const task = (
    id: string,
    title: string,
    status: TaskRow["status"],
    priority: TaskRow["priority"],
    assigneeIds: string[],
    extra: Partial<TaskRow> = {},
  ) => {
    const createdAt =
      extra.createdAt ??
      ago((tasks.length % 9) * DAY + 3 * DAY + tasks.length * HOUR);
    const row: TaskRow = {
      id,
      title,
      descriptionHtml: "",
      status,
      priority,
      creatorId: "u_roman",
      assigneeIds,
      assignAll: false,
      teamChatId: "c_marketing",
      dueAt: null,
      tags: [],
      files: [],
      createdAt,
      updatedAt: createdAt,
      ...extra,
    };
    tasks.push(row);
    return row;
  };

  const tMenu = task(
    "t_menu",
    "Зимнее меню",
    "in_progress",
    "urgent",
    [ME_ID, "u_vera", "u_kirill", "u_polina", "u_bakyt", "u_sofia"],
    {
      creatorId: "u_azamat",
      dueAt: inDays(1),
      tags: ["зима"],
      descriptionHtml: [
        "<h3>1. Состав меню</h3>",
        "<p>Пять сезонных напитков и три десерта. У каждого — короткое описание, объём и цена.</p>",
        "<ul><li>имбирный латте;</li><li>облепиховый чай;</li><li>какао с апельсином;</li><li>раф с корицей;</li><li>пряный фильтр.</li></ul>",
        "<h3>2. Носители</h3>",
        "<p>Настольное меню, экран над кассой, сторис и баннер на сайте.</p>",
        "<h3>3. Порядок работы</h3>",
        "<ol><li>Дегустация</li><li>Фотосъёмка</li><li>Макеты</li><li>Печать</li><li>Запуск</li></ol>",
      ].join(""),
    },
  );
  const tPreorder = task(
    "t_preorder",
    "Предзаказ напитка ко времени",
    "backlog",
    "urgent",
    [ME_ID, "u_ilya", "u_arsen", "u_oleg"],
    {
      teamChatId: "c_site",
      tags: ["сайт"],
      descriptionHtml:
        "<p>Гость выбирает кофейню и время, бариста видит заказ за десять минут до выдачи.</p>",
    },
  );
  const tMap = task(
    "t_map",
    "Карта кофеен с часами работы",
    "review",
    "high",
    [ME_ID, "u_ilya"],
    {
      teamChatId: "c_site",
      dueAt: inDays(-3),
      tags: ["сайт"],
    },
  );
  const tSign = task(
    "t_sign",
    "Макет вывески для новой точки",
    "todo",
    "high",
    [ME_ID, "u_polina"],
    {
      creatorId: "u_azamat",
      teamChatId: "c_opening",
      dueAt: inDays(6),
      tags: ["открытие"],
    },
  );
  const tSuppliers = task(
    "t_suppliers",
    "Сравнить поставщиков стаканов",
    "todo",
    "medium",
    [ME_ID, "u_dinara"],
    {
      creatorId: "u_dinara",
      teamChatId: "c_opening",
      dueAt: inDays(4),
    },
  );
  task(
    "t_photo",
    "Съёмка десертов",
    "in_progress",
    "high",
    [ME_ID, "u_sofia"],
    { dueAt: inDays(2), tags: ["фото"] },
  );
  task(
    "t_loyalty",
    "Карта гостя: десятый кофе в подарок",
    "backlog",
    "medium",
    [ME_ID, "u_vera", "u_tilek"],
  );
  task(
    "t_cups",
    "Иллюстрации для стаканов",
    "in_progress",
    "medium",
    [ME_ID, "u_polina"],
    { dueAt: inDays(-12) },
  );
  task(
    "t_allergens",
    "Значки аллергенов в меню",
    "todo",
    "high",
    [ME_ID, "u_bakyt"],
    { dueAt: inDays(3), creatorId: ME_ID },
  );
  task(
    "t_newsletter",
    "Письмо постоянным гостям",
    "review",
    "low",
    [ME_ID, "u_kirill"],
    { dueAt: inDays(5) },
  );
  task(
    "t_handbook",
    "Памятка для новых бариста",
    "todo",
    "low",
    [ME_ID, "u_bakyt", "u_gulnara"],
    {
      creatorId: ME_ID,
      teamChatId: "c_training",
      dueAt: inDays(11),
    },
  );
  task(
    "t_catering",
    "Презентация кофе-брейков для офисов",
    "backlog",
    "medium",
    [ME_ID, "u_tilek"],
  );
  task("t_playlist", "Плейлист для зала", "todo", "low", [ME_ID, "u_askar"]);
  task("t_inventory", "Инвентаризация витрин", "todo", "medium", [], {
    assignAll: true,
    creatorId: "u_bakyt",
    teamChatId: "c_training",
    dueAt: inDays(8),
  });
  const tFooter = task(
    "t_footer",
    "Обновить адреса на сайте",
    "done",
    "high",
    [ME_ID, "u_ilya"],
    { teamChatId: "c_site" },
  );
  task("t_badges", "Бейджи для сотрудников", "done", "low", [
    ME_ID,
    "u_cholpon",
  ]);
  task("t_stickers", "Стикерпак с зерном", "done", "medium", [
    ME_ID,
    "u_polina",
  ]);
  task("t_autumn", "Итоги осеннего меню", "done", "medium", [ME_ID, "u_vera"]);
  task("t_window", "Оформление окон", "done", "medium", [ME_ID]);
  task("t_prices", "Новые ценники", "done", "high", [ME_ID, "u_saltanat"]);
  task("t_wifi", "Табличка с Wi-Fi", "done", "low", [ME_ID]);
  task("t_uniform", "Эскиз фартука", "done", "medium", [ME_ID]);
  task("t_boxes", "Коробка для круассанов", "done", "medium", [
    ME_ID,
    "u_dinara",
  ]);
  task(
    "t_lease",
    "Продлить аренду склада",
    "todo",
    "medium",
    ["u_nina", "u_azamat"],
    { creatorId: "u_azamat", dueAt: inDays(7) },
  );
  task(
    "t_budget",
    "Бюджет на квартал",
    "in_progress",
    "medium",
    ["u_saltanat"],
    { creatorId: "u_azamat", dueAt: inDays(9) },
  );
  task(
    "t_route",
    "Маршрут утренней доставки",
    "todo",
    "medium",
    ["u_ulan", "u_dinara"],
    { creatorId: "u_dinara", dueAt: inDays(10) },
  );

  /* ── Комментарии и канал Daily ───────────────────────────────────────── */

  const comments: CommentRow[] = [];
  let cSeq = 0;
  // Комментарий к задаче дублируется событием в Daily — как это делает сервер
  const comment = (
    task: TaskRow,
    authorId: string,
    createdAt: string,
    text: string,
  ) => {
    comments.push({
      id: `cm${++cSeq}`,
      taskId: task.id,
      authorId,
      text,
      createdAt,
      replyToId: null,
      pinned: false,
    });
    msg("c_daily", authorId, createdAt, "", event(task, "comment", text));
  };

  msg(
    "c_daily",
    "u_dinara",
    dayAt(3, "10:20"),
    "",
    event(tSuppliers, "calendar", `→ ${tSuppliers.dueAt?.slice(0, 10)}`),
  );
  msg(
    "c_daily",
    "u_azamat",
    dayAt(3, "11:05"),
    "",
    event(tSign, "created", "Исполнители: Айпери, Полина"),
  );
  comment(
    tPreorder,
    "u_arsen",
    dayAt(2, "14:15"),
    "Сначала проверю, успевает ли касса получать заказы заранее.",
  );
  comment(
    tMap,
    "u_ilya",
    dayAt(2, "16:40"),
    "Часы работы готовы, осталось показать праздничные дни.",
  );
  msg(
    "c_daily",
    "u_ilya",
    dayAt(1, "12:10"),
    "",
    event(tFooter, "status", "В работе → Готово"),
  );
  comment(
    tMenu,
    "u_bakyt",
    dayAt(1, "15:30"),
    "После дегустации предлагаю уменьшить сироп в рафе: получается слишком сладко.",
  );
  comment(
    tMenu,
    "u_azamat",
    ago(4 * HOUR),
    "Согласен. Покажите макет с новыми ценами до планёрки.",
  );
  comment(
    tMenu,
    ME_ID,
    ago(20 * MIN),
    "Макет готов, жду финальное фото какао ☕",
  );

  /* ── Маркетинг ───────────────────────────────────────────────────────── */

  const plan = msg(
    "c_marketing",
    "u_vera",
    dayAt(9, "10:00"),
    "Собираем идеи для зимнего меню, пишите сюда",
  );
  const idea = msg(
    "c_marketing",
    "u_kirill",
    dayAt(9, "10:12"),
    "Можно назвать серию «Согревает»",
    { replyToId: plan.id },
  );
  msg("c_marketing", "u_vera", dayAt(9, "10:14"), "Берём 🔥", {
    replyToId: idea.id,
  });
  msg(
    "c_marketing",
    "u_azamat",
    dayAt(2, "09:30"),
    "@Айпери сможешь показать первый макет в среду?",
  );
  msg("c_marketing", ME_ID, dayAt(2, "09:42"), "Да, принесу два варианта");
  msg(
    "c_marketing",
    "u_sofia",
    ago(5 * HOUR),
    "Отобрала двенадцать кадров для меню",
  );
  msg(
    "c_marketing",
    "u_polina",
    ago(3 * HOUR),
    "Баннер со скидкой на зерно",
    image("ads", "banner-beans.jpg", 1080, 1080),
  );
  msg(
    "c_marketing",
    "u_vera",
    ago(90 * MIN),
    "Отлично, ставлю публикацию на утро",
  );

  /* ── Сайт и приложение ───────────────────────────────────────────────── */

  msg(
    "c_site",
    "u_oleg",
    dayAt(1, "11:25"),
    "На маленьких экранах кнопка брони уезжает вниз",
  );
  msg(
    "c_site",
    "u_ilya",
    dayAt(1, "11:50"),
    "Нашёл причину, выкачу после обеда",
  );
  msg(
    "c_site",
    "u_oleg",
    ago(7 * HOUR),
    "Проверил на трёх телефонах, теперь ровно",
  );
  const bugHours = msg(
    "c_site",
    "u_askar",
    ago(5 * HOUR),
    "Гости спрашивают, почему на карте мы закрываемся в восемь",
  );
  const bugLast = msg(
    "c_site",
    "u_roman",
    ago(2 * HOUR),
    "Добавьте, пожалуйста, вечерние часы для выходных",
  );

  /* ── Вся команда ─────────────────────────────────────────────────────── */

  msg(
    "c_all",
    "u_cholpon",
    dayAt(3, "09:00"),
    "Доброе утро! В пятницу общая дегустация в пять ☕",
  );
  msg(
    "c_all",
    "u_gulnara",
    dayAt(3, "09:20"),
    "У нас пополнение: две стажёрки в кофейне у парка",
  );
  msg(
    "c_all",
    ME_ID,
    ago(3 * HOUR),
    "Выложила макеты бейджей, проверьте свои имена",
  );

  /* ── Открытие кофейни ────────────────────────────────────────────────── */

  msg(
    "c_opening",
    "u_dinara",
    dayAt(2, "13:00"),
    "Мебель обещают привезти к понедельнику",
  );
  msg(
    "c_opening",
    "u_saltanat",
    ago(8 * HOUR),
    "",
    file("smeta-otkrytie.xlsx", 52_000, "application/vnd.ms-excel"),
  );
  msg(
    "c_opening",
    "u_azamat",
    ago(6 * HOUR),
    "Смету принял, по свету возьмём второй вариант",
  );

  /* ── Илья ────────────────────────────────────────────────────────────── */

  msg(
    "c_ilya",
    ME_ID,
    dayAt(6, "12:00"),
    "",
    image("receipt", "check-maket.jpg", 800, 1300),
  );
  msg(
    "c_ilya",
    ME_ID,
    dayAt(6, "12:01"),
    "",
    file("guideline-demo.pdf", 310_000),
  );
  msg("c_ilya", ME_ID, dayAt(6, "12:05"), "", video("prototype-demo.mp4", 95));
  const question = msg(
    "c_ilya",
    "u_ilya",
    dayAt(5, "15:10"),
    "В предзаказе время выбирается списком или колесом?",
  );
  msg(
    "c_ilya",
    ME_ID,
    dayAt(5, "15:18"),
    "Списком: ближайшие шесть слотов, остальные по кнопке «Позже». Так гостю не придётся крутить весь день.",
    { replyToId: question.id },
  );
  msg(
    "c_ilya",
    "u_ilya",
    dayAt(4, "10:30"),
    "",
    image("screenshot", "preorder-screen.png", 1400, 900),
  );
  msg("c_ilya", ME_ID, dayAt(4, "10:34"), "Выглядит чисто 👌");
  msg(
    "c_ilya",
    "u_ilya",
    dayAt(3, "17:00"),
    "",
    image("coffee", "latte-test.jpg", 900, 1200),
  );
  msg(
    "c_ilya",
    "u_ilya",
    dayAt(3, "17:01"),
    "Заодно протестировал имбирный латте",
  );

  /* ── Полина: записи звонков ──────────────────────────────────────────── */

  msg("c_polina", ME_ID, dayAt(11, "14:00"), "", call(418));
  msg(
    "c_polina",
    ME_ID,
    dayAt(11, "14:08"),
    "Запись звонка (видео)",
    video("demo-call-01.webm", 418),
  );
  msg("c_polina", "u_polina", dayAt(11, "16:20"), "", call(182));
  msg(
    "c_polina",
    "u_polina",
    dayAt(11, "16:24"),
    "Пришлю эскизы вывески завтра",
  );

  /* ── Остальные ───────────────────────────────────────────────────────── */

  msg(
    "c_training",
    "u_bakyt",
    dayAt(18, "08:40"),
    "Разбор настройки помола",
    video("grinder-lesson.mp4", 64),
  );
  msg(
    "c_kirill",
    "u_kirill",
    dayAt(2, "18:00"),
    "Отправил описания напитков, посмотришь?",
  );
  msg("c_kirill", ME_ID, dayAt(2, "18:05"), "Утром первым делом");
  msg("c_kirill", "u_kirill", dayAt(2, "18:06"), "👍");
  msg(
    "c_system",
    "u_system",
    dayAt(30, "09:00"),
    "Добро пожаловать! Это демонстрационная рабочая среда.",
  );
  msg(
    "c_system",
    "u_system",
    dayAt(30, "09:01"),
    "",
    image("clipboard", "welcome.png", 1400, 900),
  );

  messages.sort((a, b) => a.createdAt.localeCompare(b.createdAt));

  /* ── Персональное состояние чатов ────────────────────────────────────── */

  const st = (s: Partial<ChatUserState> = {}): ChatUserState => ({
    pinned: false,
    muted: false,
    archived: false,
    deleted: false,
    lastReadAt: ago(0),
    ...s,
  });
  const chatState: DB["chatState"] = {
    [ME_ID]: {
      c_daily: st({ pinned: true }),
      c_marketing: st({ pinned: true }),
      c_site: st({ lastReadAt: ago(6 * HOUR) }),
      c_training: st({ muted: true }),
    },
  };
  // В общем чате коллеги ещё не прочитали моё последнее сообщение — галочка одна
  for (const id of allIds) {
    if (id === ME_ID) continue;
    chatState[id] = { c_all: st({ lastReadAt: ago(DAY) }) };
  }

  /* ── Уведомления ─────────────────────────────────────────────────────── */

  let nSeq = 0;
  const notif = (
    n: Omit<NotificationRow, "id" | "userId">,
  ): NotificationRow => ({
    id: `n${++nSeq}`,
    userId: ME_ID,
    ...n,
  });
  const notifications: NotificationRow[] = [
    notif({
      kind: "message",
      title: "Сайт и приложение",
      body: `Роман: ${bugLast.text}`,
      createdAt: bugLast.createdAt,
      read: false,
      link: "/chats/c_site",
      actorId: "u_roman",
      chatId: "c_site",
    }),
    notif({
      kind: "comment",
      title: tMenu.title,
      body: "Азамат: Согласен. Покажите макет с новыми ценами до планёрки.",
      createdAt: ago(4 * HOUR),
      read: true,
      link: "/tasks/t_menu",
      actorId: "u_azamat",
      chatId: null,
    }),
    notif({
      kind: "message",
      title: "Сайт и приложение",
      body: `Аскар: ${bugHours.text}`,
      createdAt: bugHours.createdAt,
      read: true,
      link: "/chats/c_site",
      actorId: "u_askar",
      chatId: "c_site",
    }),
    notif({
      kind: "digest",
      title: "Лента дня",
      body: `🔄 ${tFooter.title}: В работе → Готово`,
      createdAt: dayAt(1, "12:10"),
      read: true,
      link: "/chats/c_daily",
      actorId: "u_ilya",
      chatId: "c_daily",
    }),
    notif({
      kind: "mention",
      title: "Маркетинг",
      body: "Азамат: @Айпери сможешь показать первый макет в среду?",
      createdAt: dayAt(2, "09:30"),
      read: true,
      link: "/chats/c_marketing",
      actorId: "u_azamat",
      chatId: "c_marketing",
    }),
    notif({
      kind: "task",
      title: "Новая задача",
      body: `Азамат назначил вам «${tSign.title}»`,
      createdAt: dayAt(3, "11:05"),
      read: true,
      link: "/tasks/t_sign",
      actorId: "u_azamat",
      chatId: null,
    }),
  ];

  /* ── Статусы (stories) ───────────────────────────────────────────────── */

  const stories: StoryRow[] = [
    {
      id: "s1",
      userId: "u_kirill",
      text: "Придумываю имена напиткам",
      emoji: "✍️",
      bg: "sunset",
      createdAt: ago(3 * HOUR),
      seenBy: [],
    },
    {
      id: "s2",
      userId: "u_saltanat",
      text: "Считаю бюджет, на связи вечером",
      emoji: "📊",
      bg: "mint",
      createdAt: ago(5 * HOUR),
      seenBy: [],
    },
    {
      id: "s3",
      userId: "u_vera",
      text: "Готовим зимний запуск",
      emoji: "🚀",
      bg: "violet",
      createdAt: ago(7 * HOUR),
      seenBy: [],
    },
    {
      id: "s4",
      userId: "u_bakyt",
      text: "Весь день на дегустации",
      emoji: "☕",
      bg: "ocean",
      createdAt: ago(9 * HOUR),
      seenBy: [ME_ID],
    },
    {
      id: "s5",
      userId: "u_sofia",
      text: "Снимаю десерты, не ем их",
      emoji: "📸",
      bg: "peach",
      createdAt: ago(10 * HOUR),
      seenBy: [],
    },
  ];

  return {
    version: 4,
    seededAt: ago(0),
    users,
    departments,
    chats,
    chatState,
    messages,
    tasks,
    comments,
    notifications,
    stories,
    sessions: {},
  };
}
