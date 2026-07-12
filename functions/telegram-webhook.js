const TRANSLATIONS = {
  hy: {
    buttons: {
      stats: "📊 Վիճակագրություն",
      list: "📋 Հյուրերի ցանկ",
      attending: "✅ Մասնակցելու են",
      declined: "❌ Չեն մասնակցելու",
      refresh: "🔄 Թարմացնել",
      help: "ℹ️ Օգնություն"
    },

    welcomeTitle: "🎉 Բարի գալուստ Invite Bot",
    welcomeText:
      "Այս bot-ի միջոցով կարող եք հետևել ձեր միջոցառման հրավերների պատասխաններին։",
    startInstruction:
      "Սկսելու համար օգտագործեք ձեզ ուղարկված հատուկ հղումը կամ գրեք՝",
    startExample: "/start ՄԻԱՑՄԱՆ_ԿՈԴ",

    connected: "✅ Telegram հաշիվը հաջողությամբ միացվեց։",
    event: "🎉 Միջոցառում",
    connectedInfo:
      "Այսուհետ հյուրերի նոր պատասխանները կստանաք այս bot-ում։",
    chooseSection: "Ընտրեք անհրաժեշտ բաժինը ներքևի կոճակներից։",
    welcomeBack: "Բարի վերադարձ 👋",

    invalidCode: "կոդով ակտիվ միջոցառում չի գտնվել։",
    expired: "❌ Այս միջոցառման օգտագործման ժամկետն ավարտվել է։",
    notConnected:
      "❌ Ձեր Telegram հաշիվը դեռ որևէ միջոցառման միացված չէ։",

    statsTitle: "📊 Մասնակցության վիճակագրություն",
    totalResponses: "📝 Ընդհանուր պատասխաններ",
    attendingResponses: "✅ Մասնակցելու են",
    totalGuests: "👥 Հաստատված հյուրերի թիվ",
    declinedResponses: "❌ Չեն մասնակցելու",

    guestListTitle: "📋 Հյուրերի ցանկ",
    noResponses: "Դեռ հյուրերի պատասխաններ չկան։",
    attendingTitle: "✅ Մասնակցելու են",
    noAttending: "Դեռ հաստատված մասնակցություններ չկան։",
    declinedTitle: "❌ Չեն մասնակցելու",
    noDeclined: "Մասնակցությունից հրաժարված պատասխաններ դեռ չկան։",
    guestsTotal: "Ընդհանուր",
    guestWord: "հյուր",

    helpTitle: "ℹ️ Ինչպես օգտվել bot-ից",
    helpStats:
      "📊 Վիճակագրություն — ցույց է տալիս պատասխանների և հաստատված հյուրերի քանակը։",
    helpList:
      "📋 Հյուրերի ցանկ — ցույց է տալիս միջոցառման բոլոր պատասխանները։",
    helpAttending:
      "✅ Մասնակցելու են — ցույց է տալիս մասնակցությունը հաստատած հյուրերին։",
    helpDeclined:
      "❌ Չեն մասնակցելու — ցույց է տալիս հրաժարված պատասխանները։",
    helpRefresh:
      "🔄 Թարմացնել — ցույց է տալիս վերջին վիճակագրությունը։",

    genericError:
      "❌ Տվյալները ստանալու ժամանակ սխալ տեղի ունեցավ։ Խնդրում ենք փորձել կրկին։"
  },

  ru: {
    buttons: {
      stats: "📊 Статистика",
      list: "📋 Список гостей",
      attending: "✅ Будут участвовать",
      declined: "❌ Не будут участвовать",
      refresh: "🔄 Обновить",
      help: "ℹ️ Помощь"
    },

    welcomeTitle: "🎉 Добро пожаловать в Invite Bot",
    welcomeText:
      "С помощью этого бота вы можете отслеживать ответы гостей на приглашение.",
    startInstruction:
      "Для начала используйте специальную ссылку или отправьте:",
    startExample: "/start КОД_ПОДКЛЮЧЕНИЯ",

    connected: "✅ Telegram успешно подключён.",
    event: "🎉 Мероприятие",
    connectedInfo:
      "Теперь новые ответы гостей будут приходить в этот бот.",
    chooseSection: "Выберите нужный раздел с помощью кнопок ниже.",
    welcomeBack: "С возвращением 👋",

    invalidCode: "— активное мероприятие с таким кодом не найдено.",
    expired: "❌ Срок действия этого мероприятия истёк.",
    notConnected:
      "❌ Ваш Telegram ещё не подключён ни к одному мероприятию.",

    statsTitle: "📊 Статистика участия",
    totalResponses: "📝 Всего ответов",
    attendingResponses: "✅ Будут участвовать",
    totalGuests: "👥 Подтверждённое количество гостей",
    declinedResponses: "❌ Не будут участвовать",

    guestListTitle: "📋 Список гостей",
    noResponses: "Ответов от гостей пока нет.",
    attendingTitle: "✅ Будут участвовать",
    noAttending: "Подтверждённых участников пока нет.",
    declinedTitle: "❌ Не будут участвовать",
    noDeclined: "Отказов от участия пока нет.",
    guestsTotal: "Всего",
    guestWord: "гостей",

    helpTitle: "ℹ️ Как пользоваться ботом",
    helpStats:
      "📊 Статистика — показывает количество ответов и подтверждённых гостей.",
    helpList:
      "📋 Список гостей — показывает все ответы по мероприятию.",
    helpAttending:
      "✅ Будут участвовать — показывает подтвердивших участие гостей.",
    helpDeclined:
      "❌ Не будут участвовать — показывает отказавшихся гостей.",
    helpRefresh:
      "🔄 Обновить — показывает актуальную статистику.",

    genericError:
      "❌ При получении данных произошла ошибка. Попробуйте ещё раз."
  },

  en: {
    buttons: {
      stats: "📊 Statistics",
      list: "📋 Guest list",
      attending: "✅ Attending",
      declined: "❌ Not attending",
      refresh: "🔄 Refresh",
      help: "ℹ️ Help"
    },

    welcomeTitle: "🎉 Welcome to Invite Bot",
    welcomeText:
      "This bot helps you track guest responses for your event.",
    startInstruction:
      "To begin, use your special connection link or send:",
    startExample: "/start CONNECTION_CODE",

    connected: "✅ Telegram was connected successfully.",
    event: "🎉 Event",
    connectedInfo:
      "New guest responses will now be delivered to this bot.",
    chooseSection: "Choose a section using the buttons below.",
    welcomeBack: "Welcome back 👋",

    invalidCode: "— no active event was found with this code.",
    expired: "❌ This event has expired.",
    notConnected:
      "❌ Your Telegram account is not connected to an event yet.",

    statsTitle: "📊 Attendance statistics",
    totalResponses: "📝 Total responses",
    attendingResponses: "✅ Attending",
    totalGuests: "👥 Confirmed guests",
    declinedResponses: "❌ Not attending",

    guestListTitle: "📋 Guest list",
    noResponses: "There are no guest responses yet.",
    attendingTitle: "✅ Attending",
    noAttending: "There are no confirmed guests yet.",
    declinedTitle: "❌ Not attending",
    noDeclined: "There are no declined responses yet.",
    guestsTotal: "Total",
    guestWord: "guests",

    helpTitle: "ℹ️ How to use the bot",
    helpStats:
      "📊 Statistics — shows response and confirmed guest totals.",
    helpList:
      "📋 Guest list — shows all responses for the event.",
    helpAttending:
      "✅ Attending — shows guests who confirmed attendance.",
    helpDeclined:
      "❌ Not attending — shows guests who declined.",
    helpRefresh:
      "🔄 Refresh — shows the latest statistics.",

    genericError:
      "❌ An error occurred while loading the data. Please try again."
  }
};

function normalizeLanguage(language) {
  if (language === "ru" || language === "en" || language === "hy") {
    return language;
  }

  return "hy";
}

function getTranslation(language) {
  return TRANSLATIONS[normalizeLanguage(language)];
}

function createMenu(language) {
  const t = getTranslation(language);

  return {
    keyboard: [
      [
        { text: t.buttons.stats },
        { text: t.buttons.list }
      ],
      [
        { text: t.buttons.attending },
        { text: t.buttons.declined }
      ],
      [
        { text: t.buttons.refresh },
        { text: t.buttons.help }
      ]
    ],
    resize_keyboard: true,
    is_persistent: true
  };
}

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=UTF-8"
    }
  });
}

function getSupabaseBaseUrl(url) {
  return url
    .replace(/\/rest\/v1\/?$/i, "")
    .replace(/\/+$/, "");
}

function getSupabaseHeaders(env, extraHeaders = {}) {
  return {
    apikey: env.SUPABASE_SECRET_KEY,
    Accept: "application/json",
    ...extraHeaders
  };
}

async function sendTelegramMessage(
  env,
  chatId,
  text,
  replyMarkup = null
) {
  const payload = {
    chat_id: chatId,
    text
  };

  if (replyMarkup) {
    payload.reply_markup = replyMarkup;
  }

  const response = await fetch(
    `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    }
  );

  const result = await response.json();

  if (!response.ok || !result.ok) {
    console.error("Telegram send error:", result);

    throw new Error(
      result.description || "Telegram message could not be sent."
    );
  }

  return result;
}

async function sendLongTelegramMessage(
  env,
  chatId,
  title,
  lines,
  language
) {
  const maxLength = 3500;
  let currentText = title;

  for (const line of lines) {
    const nextText = `${currentText}\n${line}`;

    if (nextText.length > maxLength) {
      await sendTelegramMessage(env, chatId, currentText);
      currentText = line;
    } else {
      currentText = nextText;
    }
  }

  if (currentText.trim()) {
    await sendTelegramMessage(
      env,
      chatId,
      currentText,
      createMenu(language)
    );
  }
}

async function findEventByConnectionCode(env, connectionCode) {
  const baseUrl = getSupabaseBaseUrl(env.SUPABASE_URL);

  const query = new URLSearchParams({
    connection_code: `eq.${connectionCode}`,
    is_active: "eq.true",
    select:
      "id,wedding_id,couple_names,telegram_chat_id,connection_code,expires_at,language"
  });

  const response = await fetch(
    `${baseUrl}/rest/v1/weddings?${query.toString()}`,
    {
      method: "GET",
      headers: getSupabaseHeaders(env)
    }
  );

  const responseText = await response.text();

  if (!response.ok) {
    console.error(
      "Event connection lookup error:",
      response.status,
      responseText
    );

    throw new Error(`Event lookup failed: ${response.status}`);
  }

  const events = JSON.parse(responseText);

  return events[0] || null;
}

async function findEventByChatId(env, chatId) {
  const baseUrl = getSupabaseBaseUrl(env.SUPABASE_URL);

  const query = new URLSearchParams({
    telegram_chat_id: `eq.${chatId}`,
    is_active: "eq.true",
    select:
      "id,wedding_id,couple_names,telegram_chat_id,connection_code,expires_at,language",
    order: "created_at.desc",
    limit: "1"
  });

  const response = await fetch(
    `${baseUrl}/rest/v1/weddings?${query.toString()}`,
    {
      method: "GET",
      headers: getSupabaseHeaders(env)
    }
  );

  const responseText = await response.text();

  if (!response.ok) {
    console.error(
      "Event chat lookup error:",
      response.status,
      responseText
    );

    throw new Error(`Event chat lookup failed: ${response.status}`);
  }

  const events = JSON.parse(responseText);

  return events[0] || null;
}

async function saveTelegramChatId(env, eventDatabaseId, chatId) {
  const baseUrl = getSupabaseBaseUrl(env.SUPABASE_URL);

  const response = await fetch(
    `${baseUrl}/rest/v1/weddings?id=eq.${encodeURIComponent(
      eventDatabaseId
    )}`,
    {
      method: "PATCH",
      headers: getSupabaseHeaders(env, {
        "Content-Type": "application/json",
        Prefer: "return=minimal"
      }),
      body: JSON.stringify({
        telegram_chat_id: chatId
      })
    }
  );

  const responseText = await response.text();

  if (!response.ok) {
    console.error(
      "Telegram connection save error:",
      response.status,
      responseText
    );

    throw new Error(
      `Telegram connection save failed: ${response.status}`
    );
  }
}

async function getEventResponses(env, eventDatabaseId) {
  const baseUrl = getSupabaseBaseUrl(env.SUPABASE_URL);

  const query = new URLSearchParams({
    wedding_db_id: `eq.${eventDatabaseId}`,
    select:
      "id,guest_name,side,attendance,guests,message,created_at",
    order: "created_at.asc"
  });

  const response = await fetch(
    `${baseUrl}/rest/v1/rsvp_responses?${query.toString()}`,
    {
      method: "GET",
      headers: getSupabaseHeaders(env)
    }
  );

  const responseText = await response.text();

  if (!response.ok) {
    console.error(
      "Responses lookup error:",
      response.status,
      responseText
    );

    throw new Error(
      `Responses lookup failed: ${response.status}`
    );
  }

  return JSON.parse(responseText);
}

function isAttending(response) {
  const value = String(response.attendance || "")
    .trim()
    .toLowerCase();

  const acceptedValues = [
    "մենք կգանք",
    "կգամ",
    "мы придём",
    "мы придем",
    "я приду",
    "будем участвовать",
    "will attend",
    "we will attend",
    "i will attend",
    "attending",
    "yes"
  ];

  return acceptedValues.includes(value);
}

function getGuestCount(response) {
  if (!isAttending(response)) {
    return 0;
  }

  return Math.max(
    Number.parseInt(response.guests, 10) || 1,
    1
  );
}

function formatGuestLine(response, index, language) {
  const t = getTranslation(language);
  const attending = isAttending(response);
  const icon = attending ? "✅" : "❌";

  const countText = attending
    ? ` — ${getGuestCount(response)} ${t.guestWord}`
    : "";

  return `${index + 1}. ${icon} ${response.guest_name}${countText}`;
}

function buildStatisticsText(event, responses) {
  const language = normalizeLanguage(event.language);
  const t = getTranslation(language);

  const attendingResponses = responses.filter(isAttending);

  const declinedResponses = responses.filter(
    (response) => !isAttending(response)
  );

  const totalGuests = attendingResponses.reduce(
    (total, response) => total + getGuestCount(response),
    0
  );

  const brideGuests = attendingResponses
    .filter(
      (response) =>
        String(response.side || "").trim() === "Հարսի կողմ"
    )
    .reduce(
      (total, response) => total + getGuestCount(response),
      0
    );

  const groomGuests = attendingResponses
    .filter(
      (response) =>
        String(response.side || "").trim() === "Փեսայի կողմ"
    )
    .reduce(
      (total, response) => total + getGuestCount(response),
      0
    );

  const hasSideData = responses.some(
    (response) =>
      String(response.side || "").trim() !== ""
  );

  const lines = [
    t.statsTitle,
    "",
    `${t.event}՝ ${event.couple_names}`,
    "",
    `${t.totalResponses}՝ ${responses.length}`,
    `${t.attendingResponses}՝ ${attendingResponses.length}`,
    `${t.totalGuests}՝ ${totalGuests}`,
    `${t.declinedResponses}՝ ${declinedResponses.length}`
  ];

  if (hasSideData) {
    lines.push("");

    if (language === "hy") {
      lines.push(`👰 Հարսի կողմից՝ ${brideGuests} հյուր`);
      lines.push(`🤵 Փեսայի կողմից՝ ${groomGuests} հյուր`);
    } else if (language === "ru") {
      lines.push(`👰 Со стороны невесты: ${brideGuests}`);
      lines.push(`🤵 Со стороны жениха: ${groomGuests}`);
    } else {
      lines.push(`👰 Bride's side: ${brideGuests}`);
      lines.push(`🤵 Groom's side: ${groomGuests}`);
    }
  }

  return lines.join("\n");
}

async function sendStatistics(env, chatId, event, responses) {
  const language = normalizeLanguage(event.language);

  await sendTelegramMessage(
    env,
    chatId,
    buildStatisticsText(event, responses),
    createMenu(language)
  );
}

async function sendAllGuests(env, chatId, event, responses) {
  const language = normalizeLanguage(event.language);
  const t = getTranslation(language);

  if (responses.length === 0) {
    await sendTelegramMessage(
      env,
      chatId,
      `${t.guestListTitle}

${t.event}՝ ${event.couple_names}

${t.noResponses}`,
      createMenu(language)
    );

    return;
  }

  const lines = responses.map((response, index) =>
    formatGuestLine(response, index, language)
  );

  await sendLongTelegramMessage(
    env,
    chatId,
    `${t.guestListTitle}

${t.event}՝ ${event.couple_names}
`,
    lines,
    language
  );
}

async function sendAttendingGuests(env, chatId, event, responses) {
  const language = normalizeLanguage(event.language);
  const t = getTranslation(language);

  const attendingResponses = responses.filter(isAttending);

  if (attendingResponses.length === 0) {
    await sendTelegramMessage(
      env,
      chatId,
      `${t.attendingTitle}

${t.event}՝ ${event.couple_names}

${t.noAttending}`,
      createMenu(language)
    );

    return;
  }

  const totalGuests = attendingResponses.reduce(
    (total, response) => total + getGuestCount(response),
    0
  );

  const lines = attendingResponses.map((response, index) =>
    formatGuestLine(response, index, language)
  );

  await sendLongTelegramMessage(
    env,
    chatId,
    `${t.attendingTitle}

${t.event}՝ ${event.couple_names}
${t.guestsTotal}՝ ${totalGuests} ${t.guestWord}
`,
    lines,
    language
  );
}

async function sendDeclinedGuests(env, chatId, event, responses) {
  const language = normalizeLanguage(event.language);
  const t = getTranslation(language);

  const declinedResponses = responses.filter(
    (response) => !isAttending(response)
  );

  if (declinedResponses.length === 0) {
    await sendTelegramMessage(
      env,
      chatId,
      `${t.declinedTitle}

${t.event}՝ ${event.couple_names}

${t.noDeclined}`,
      createMenu(language)
    );

    return;
  }

  const lines = declinedResponses.map(
    (response, index) => `${index + 1}. ${response.guest_name}`
  );

  await sendLongTelegramMessage(
    env,
    chatId,
    `${t.declinedTitle}

${t.event}՝ ${event.couple_names}
`,
    lines,
    language
  );
}

async function sendHelpMessage(env, chatId, event) {
  const language = normalizeLanguage(event.language);
  const t = getTranslation(language);

  const text = `
${t.helpTitle}

${t.event}՝ ${event.couple_names}

${t.helpStats}

${t.helpList}

${t.helpAttending}

${t.helpDeclined}

${t.helpRefresh}

/stats
/list
/attending
/declined
/menu
/help
`.trim();

  await sendTelegramMessage(
    env,
    chatId,
    text,
    createMenu(language)
  );
}

async function sendWelcomeMessage(
  env,
  chatId,
  telegramLanguageCode
) {
  const language = normalizeLanguage(
    String(telegramLanguageCode || "").slice(0, 2)
  );

  const t = getTranslation(language);

  const text = `
${t.welcomeTitle}

${t.welcomeText}

${t.startInstruction}

/start CODE

${t.startExample}
`.trim();

  await sendTelegramMessage(env, chatId, text);
}

async function showMainMenu(env, chatId, event) {
  const language = normalizeLanguage(event.language);
  const t = getTranslation(language);

  await sendTelegramMessage(
    env,
    chatId,
    `${t.event}՝ ${event.couple_names}

${t.welcomeBack}

${t.chooseSection}`,
    createMenu(language)
  );
}

async function sendConnectedWelcome(env, chatId, event, responses) {
  const language = normalizeLanguage(event.language);
  const t = getTranslation(language);

  const text = `
${t.connected}

${t.event}՝ ${event.couple_names}

${t.connectedInfo}

${buildStatisticsText(event, responses)}

⬇️ ${t.chooseSection}
`.trim();

  await sendTelegramMessage(
    env,
    chatId,
    text,
    createMenu(language)
  );
}

export async function onRequestPost(context) {
  const { request, env } = context;

  let chatId = null;
  let currentLanguage = "hy";

  try {
    if (
      !env.TELEGRAM_BOT_TOKEN ||
      !env.SUPABASE_URL ||
      !env.SUPABASE_SECRET_KEY
    ) {
      throw new Error(
        "Backend environment variables are missing."
      );
    }

    const update = await request.json();
    const message = update.message;

    if (!message?.chat) {
      return jsonResponse({ success: true });
    }

    chatId = String(message.chat.id);

    const telegramLanguageCode =
      message.from?.language_code || "hy";

    const text = message.text?.trim() || "";

    if (text.startsWith("/start")) {
      const parts = text.split(/\s+/);

      const connectionCode = parts[1]
        ?.trim()
        .toUpperCase();

      if (connectionCode) {
        const event = await findEventByConnectionCode(
          env,
          connectionCode
        );

        if (!event) {
          const fallbackLanguage = normalizeLanguage(
            telegramLanguageCode.slice(0, 2)
          );

          const t = getTranslation(fallbackLanguage);

          await sendTelegramMessage(
            env,
            chatId,
            `❌ «${connectionCode}» ${t.invalidCode}`
          );

          return jsonResponse({ success: true });
        }

        currentLanguage = normalizeLanguage(event.language);
        const t = getTranslation(currentLanguage);

        if (
          event.expires_at &&
          new Date(event.expires_at).getTime() <= Date.now()
        ) {
          await sendTelegramMessage(
            env,
            chatId,
            t.expired
          );

          return jsonResponse({ success: true });
        }

        await saveTelegramChatId(env, event.id, chatId);

        const responses = await getEventResponses(
          env,
          event.id
        );

        await sendConnectedWelcome(
          env,
          chatId,
          event,
          responses
        );

        return jsonResponse({ success: true });
      }

      const connectedEvent = await findEventByChatId(
        env,
        chatId
      );

      if (!connectedEvent) {
        await sendWelcomeMessage(
          env,
          chatId,
          telegramLanguageCode
        );

        return jsonResponse({ success: true });
      }

      currentLanguage = normalizeLanguage(
        connectedEvent.language
      );

      await showMainMenu(
        env,
        chatId,
        connectedEvent
      );

      return jsonResponse({ success: true });
    }

    const event = await findEventByChatId(env, chatId);

    if (!event) {
      await sendWelcomeMessage(
        env,
        chatId,
        telegramLanguageCode
      );

      return jsonResponse({ success: true });
    }

    currentLanguage = normalizeLanguage(event.language);
    const t = getTranslation(currentLanguage);

    if (
      event.expires_at &&
      new Date(event.expires_at).getTime() <= Date.now()
    ) {
      await sendTelegramMessage(env, chatId, t.expired);

      return jsonResponse({ success: true });
    }

    const responses = await getEventResponses(
      env,
      event.id
    );

    const normalizedText = text
      .replace(/@\w+$/i, "")
      .trim()
      .toLowerCase();

    const menu = createMenu(currentLanguage);
    const buttons = t.buttons;

    if (
      normalizedText === "/stats" ||
      text === buttons.stats ||
      text === buttons.refresh
    ) {
      await sendStatistics(
        env,
        chatId,
        event,
        responses
      );
    } else if (
      normalizedText === "/list" ||
      text === buttons.list
    ) {
      await sendAllGuests(
        env,
        chatId,
        event,
        responses
      );
    } else if (
      normalizedText === "/attending" ||
      text === buttons.attending
    ) {
      await sendAttendingGuests(
        env,
        chatId,
        event,
        responses
      );
    } else if (
      normalizedText === "/declined" ||
      text === buttons.declined
    ) {
      await sendDeclinedGuests(
        env,
        chatId,
        event,
        responses
      );
    } else if (
      normalizedText === "/help" ||
      text === buttons.help
    ) {
      await sendHelpMessage(
        env,
        chatId,
        event
      );
    } else if (normalizedText === "/menu") {
      await showMainMenu(env, chatId, event);
    } else {
      await sendTelegramMessage(
        env,
        chatId,
        t.chooseSection,
        menu
      );
    }

    return jsonResponse({ success: true });
  } catch (error) {
    console.error("Telegram webhook error:", error);

    if (chatId) {
      try {
        const t = getTranslation(currentLanguage);

        await sendTelegramMessage(
          env,
          chatId,
          t.genericError
        );
      } catch (telegramError) {
        console.error(
          "Could not send Telegram error:",
          telegramError
        );
      }
    }

    return jsonResponse({
      success: false,
      error: error.message
    });
  }
}

export function onRequestGet() {
  return jsonResponse({
    success: true,
    message: "Multilingual Invite Bot webhook is working"
  });
}``