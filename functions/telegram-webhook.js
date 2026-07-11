const MENU_KEYBOARD = {
  keyboard: [
    [
      { text: "📊 Վիճակագրություն" },
      { text: "📋 Հյուրերի ցանկ" }
    ],
    [
      { text: "✅ Մասնակցելու են" },
      { text: "❌ Չեն մասնակցելու" }
    ],
    [
      { text: "🔄 Թարմացնել" },
      { text: "ℹ️ Օգնություն" }
    ]
  ],
  resize_keyboard: true,
  is_persistent: true
};

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
      result.description ||
        "Telegram հաղորդագրությունը չհաջողվեց ուղարկել։"
    );
  }

  return result;
}

async function sendLongTelegramMessage(
  env,
  chatId,
  title,
  lines,
  replyMarkup = null
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
      replyMarkup
    );
  }
}

async function findEventByConnectionCode(
  env,
  connectionCode
) {
  const baseUrl = getSupabaseBaseUrl(env.SUPABASE_URL);

  const query = new URLSearchParams({
    connection_code: `eq.${connectionCode}`,
    is_active: "eq.true",
    select:
      "id,wedding_id,couple_names,telegram_chat_id,connection_code,expires_at"
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

    throw new Error(
      `Event lookup failed: ${response.status}`
    );
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
      "id,wedding_id,couple_names,telegram_chat_id,connection_code,expires_at",
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

    throw new Error(
      `Event chat lookup failed: ${response.status}`
    );
  }

  const events = JSON.parse(responseText);

  return events[0] || null;
}

async function saveTelegramChatId(
  env,
  eventDatabaseId,
  chatId
) {
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
      "Telegram chat save error:",
      response.status,
      responseText
    );

    throw new Error(
      `Telegram connection save failed: ${response.status}`
    );
  }
}

async function getEventResponses(
  env,
  eventDatabaseId
) {
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
      "Guest responses lookup error:",
      response.status,
      responseText
    );

    throw new Error(
      `Guest responses lookup failed: ${response.status}`
    );
  }

  return JSON.parse(responseText);
}

function isAttending(response) {
  return response.attendance === "Մենք կգանք";
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

function formatGuestLine(response, index) {
  const attending = isAttending(response);
  const icon = attending ? "✅" : "❌";

  const countText = attending
    ? ` — ${getGuestCount(response)} հյուր`
    : "";

  return `${index + 1}. ${icon} ${response.guest_name}${countText}`;
}

function buildStatisticsText(event, responses) {
  const attendingResponses = responses.filter(isAttending);

  const declinedResponses = responses.filter(
    (response) => !isAttending(response)
  );

  const totalGuests = attendingResponses.reduce(
    (total, response) => total + getGuestCount(response),
    0
  );

  return `
📊 Մասնակցության վիճակագրություն

🎉 ${event.couple_names}

📝 Ընդհանուր պատասխաններ՝ ${responses.length}
✅ Մասնակցելու են՝ ${attendingResponses.length} պատասխան
❌ Չեն մասնակցելու՝ ${declinedResponses.length} պատասխան
👥 Հաստատված հյուրերի թիվ՝ ${totalGuests}
`.trim();
}

async function sendStatistics(
  env,
  chatId,
  event,
  responses
) {
  await sendTelegramMessage(
    env,
    chatId,
    buildStatisticsText(event, responses),
    MENU_KEYBOARD
  );
}

async function sendAllGuests(
  env,
  chatId,
  event,
  responses
) {
  if (responses.length === 0) {
    await sendTelegramMessage(
      env,
      chatId,
      `📋 ${event.couple_names}

Դեռ հյուրերի պատասխաններ չկան։`,
      MENU_KEYBOARD
    );

    return;
  }

  const lines = responses.map(formatGuestLine);

  await sendLongTelegramMessage(
    env,
    chatId,
    `📋 Հյուրերի ցանկ

🎉 ${event.couple_names}
`,
    lines,
    MENU_KEYBOARD
  );
}

async function sendAttendingGuests(
  env,
  chatId,
  event,
  responses
) {
  const attendingResponses = responses.filter(isAttending);

  if (attendingResponses.length === 0) {
    await sendTelegramMessage(
      env,
      chatId,
      `✅ ${event.couple_names}

Դեռ հաստատված մասնակցություններ չկան։`,
      MENU_KEYBOARD
    );

    return;
  }

  const totalGuests = attendingResponses.reduce(
    (total, response) => total + getGuestCount(response),
    0
  );

  const lines = attendingResponses.map(formatGuestLine);

  await sendLongTelegramMessage(
    env,
    chatId,
    `✅ Մասնակցելու են

🎉 ${event.couple_names}
👥 Ընդհանուր՝ ${totalGuests} հյուր
`,
    lines,
    MENU_KEYBOARD
  );
}

async function sendDeclinedGuests(
  env,
  chatId,
  event,
  responses
) {
  const declinedResponses = responses.filter(
    (response) => !isAttending(response)
  );

  if (declinedResponses.length === 0) {
    await sendTelegramMessage(
      env,
      chatId,
      `❌ ${event.couple_names}

Մասնակցությունից հրաժարված պատասխաններ դեռ չկան։`,
      MENU_KEYBOARD
    );

    return;
  }

  const lines = declinedResponses.map(
    (response, index) =>
      `${index + 1}. ${response.guest_name}`
  );

  await sendLongTelegramMessage(
    env,
    chatId,
    `❌ Չեն մասնակցելու

🎉 ${event.couple_names}
`,
    lines,
    MENU_KEYBOARD
  );
}

async function sendWelcomeMessage(env, chatId) {
  const text = `
🎉 Բարի գալուստ Invite Bot

Այս bot-ի միջոցով կարող եք հետևել ձեր միջոցառման հրավերների պատասխաններին։

Սկսելու համար բացեք ձեզ ուղարկված հատուկ Telegram հղումը կամ գրեք՝

/start ՄԻԱՑՄԱՆ_ԿՈԴ

Օրինակ՝
/start OA2027

Միացնելուց հետո կարող եք տեսնել մասնակցության վիճակագրությունը, հյուրերի ցանկը և նոր պատասխանները։
`.trim();

  await sendTelegramMessage(env, chatId, text);
}

async function sendHelpMessage(env, chatId, event) {
  const text = `
ℹ️ Ինչպես օգտվել bot-ից

🎉 ${event.couple_names}

📊 Վիճակագրություն
Ցույց է տալիս ստացված պատասխանների և հաստատված հյուրերի քանակը։

📋 Հյուրերի ցանկ
Ցույց է տալիս միջոցառման բոլոր պատասխանները։

✅ Մասնակցելու են
Ցույց է տալիս մասնակցությունը հաստատած հյուրերին։

❌ Չեն մասնակցելու
Ցույց է տալիս մասնակցությունից հրաժարված հյուրերին։

🔄 Թարմացնել
Ցույց է տալիս վերջին վիճակագրությունը։

Կարող եք նաև օգտագործել՝

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
    MENU_KEYBOARD
  );
}

async function showMainMenu(env, chatId, event) {
  await sendTelegramMessage(
    env,
    chatId,
    `🎉 ${event.couple_names}

Բարի վերադարձ 👋

Ընտրեք անհրաժեշտ բաժինը ներքևի կոճակներից։`,
    MENU_KEYBOARD
  );
}

async function sendConnectedWelcome(
  env,
  chatId,
  event,
  responses
) {
  const statisticsText = buildStatisticsText(
    event,
    responses
  );

  const text = `
✅ Telegram հաշիվը հաջողությամբ միացվեց։

🎉 Միջոցառում՝ ${event.couple_names}

Այսուհետ հյուրերի նոր պատասխանները կստանաք այս bot-ում։

${statisticsText}

⬇️ Ընտրեք անհրաժեշտ բաժինը ներքևի կոճակներից։
`.trim();

  await sendTelegramMessage(
    env,
    chatId,
    text,
    MENU_KEYBOARD
  );
}

export async function onRequestPost(context) {
  const { request, env } = context;

  let chatId = null;

  try {
    if (
      !env.TELEGRAM_BOT_TOKEN ||
      !env.SUPABASE_URL ||
      !env.SUPABASE_SECRET_KEY
    ) {
      throw new Error(
        "Backend-ի environment variables-ը բացակայում են։"
      );
    }

    const update = await request.json();
    const message = update.message;

    if (!message?.chat) {
      return jsonResponse({
        success: true
      });
    }

    chatId = String(message.chat.id);
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
          await sendTelegramMessage(
            env,
            chatId,
            `❌ «${connectionCode}» կոդով ակտիվ միջոցառում չի գտնվել։`
          );

          return jsonResponse({
            success: true
          });
        }

        if (
          event.expires_at &&
          new Date(event.expires_at).getTime() <= Date.now()
        ) {
          await sendTelegramMessage(
            env,
            chatId,
            "❌ Այս միջոցառման համակարգի օգտագործման ժամկետն ավարտվել է։"
          );

          return jsonResponse({
            success: true
          });
        }

        await saveTelegramChatId(
          env,
          event.id,
          chatId
        );

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

        return jsonResponse({
          success: true
        });
      }

      const connectedEvent =
        await findEventByChatId(env, chatId);

      if (!connectedEvent) {
        await sendWelcomeMessage(env, chatId);

        return jsonResponse({
          success: true
        });
      }

      await showMainMenu(
        env,
        chatId,
        connectedEvent
      );

      return jsonResponse({
        success: true
      });
    }

    const event = await findEventByChatId(
      env,
      chatId
    );

    if (!event) {
      await sendWelcomeMessage(env, chatId);

      return jsonResponse({
        success: true
      });
    }

    if (
      event.expires_at &&
      new Date(event.expires_at).getTime() <= Date.now()
    ) {
      await sendTelegramMessage(
        env,
        chatId,
        "❌ Այս միջոցառման համակարգի օգտագործման ժամկետն ավարտվել է։"
      );

      return jsonResponse({
        success: true
      });
    }

    const responses = await getEventResponses(
      env,
      event.id
    );

    const normalizedText = text
      .replace(/@\w+$/i, "")
      .trim()
      .toLowerCase();

    if (
      normalizedText === "/stats" ||
      text === "📊 Վիճակագրություն" ||
      text === "🔄 Թարմացնել"
    ) {
      await sendStatistics(
        env,
        chatId,
        event,
        responses
      );
    } else if (
      normalizedText === "/list" ||
      text === "📋 Հյուրերի ցանկ"
    ) {
      await sendAllGuests(
        env,
        chatId,
        event,
        responses
      );
    } else if (
      normalizedText === "/attending" ||
      text === "✅ Մասնակցելու են"
    ) {
      await sendAttendingGuests(
        env,
        chatId,
        event,
        responses
      );
    } else if (
      normalizedText === "/declined" ||
      text === "❌ Չեն մասնակցելու"
    ) {
      await sendDeclinedGuests(
        env,
        chatId,
        event,
        responses
      );
    } else if (
      normalizedText === "/help" ||
      text === "ℹ️ Օգնություն"
    ) {
      await sendHelpMessage(
        env,
        chatId,
        event
      );
    } else {
      await showMainMenu(
        env,
        chatId,
        event
      );
    }

    return jsonResponse({
      success: true
    });
  } catch (error) {
    console.error("Telegram webhook error:", error);

    if (chatId) {
      try {
        await sendTelegramMessage(
          env,
          chatId,
          "❌ Տվյալները ստանալու ժամանակ սխալ տեղի ունեցավ։ Խնդրում ենք փորձել կրկին։"
        );
      } catch (telegramError) {
        console.error(
          "Could not send Telegram error message:",
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
    message: "Invite Bot webhook is working"
  });
}