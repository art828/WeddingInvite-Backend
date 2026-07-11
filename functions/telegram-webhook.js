const MENU_KEYBOARD = {
  keyboard: [
    [
      { text: "📊 Վիճակագրություն" },
      { text: "📋 Հյուրերի ցանկ" }
    ],
    [
      { text: "👰 Հարսի կողմ" },
      { text: "🤵 Փեսայի կողմ" }
    ],
    [
      { text: "❌ Չեն գալու" },
      { text: "🔄 Թարմացնել" }
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
      result.description || "Telegram հաղորդագրությունը չուղարկվեց։"
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

async function findWeddingByConnectionCode(
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
      "Wedding connection lookup error:",
      response.status,
      responseText
    );

    throw new Error(
      `Wedding lookup failed: ${response.status}`
    );
  }

  const weddings = JSON.parse(responseText);

  return weddings[0] || null;
}

async function findWeddingByChatId(env, chatId) {
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
      "Wedding chat lookup error:",
      response.status,
      responseText
    );

    throw new Error(
      `Wedding chat lookup failed: ${response.status}`
    );
  }

  const weddings = JSON.parse(responseText);

  return weddings[0] || null;
}

async function saveTelegramChatId(
  env,
  weddingDatabaseId,
  chatId
) {
  const baseUrl = getSupabaseBaseUrl(env.SUPABASE_URL);

  const response = await fetch(
    `${baseUrl}/rest/v1/weddings?id=eq.${encodeURIComponent(
      weddingDatabaseId
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

async function getWeddingResponses(
  env,
  weddingDatabaseId
) {
  const baseUrl = getSupabaseBaseUrl(env.SUPABASE_URL);

  const query = new URLSearchParams({
    wedding_db_id: `eq.${weddingDatabaseId}`,
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
      "RSVP list error:",
      response.status,
      responseText
    );

    throw new Error(
      `RSVP list failed: ${response.status}`
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

async function sendStatistics(
  env,
  chatId,
  wedding,
  responses
) {
  const attendingResponses = responses.filter(isAttending);
  const declinedResponses = responses.filter(
    (response) => !isAttending(response)
  );

  const totalGuests = attendingResponses.reduce(
    (total, response) => total + getGuestCount(response),
    0
  );

  const brideGuests = attendingResponses
    .filter((response) => response.side === "Հարսի կողմ")
    .reduce(
      (total, response) => total + getGuestCount(response),
      0
    );

  const groomGuests = attendingResponses
    .filter((response) => response.side === "Փեսայի կողմ")
    .reduce(
      (total, response) => total + getGuestCount(response),
      0
    );

  const text = `
📊 RSVP վիճակագրություն

💍 ${wedding.couple_names}

📝 Ընդհանուր պատասխաններ՝ ${responses.length}
✅ Կգան՝ ${attendingResponses.length} պատասխան
👥 Կգան ընդհանուր՝ ${totalGuests} հյուր
❌ Չեն գալու՝ ${declinedResponses.length}

👰 Հարսի կողմից՝ ${brideGuests} հյուր
🤵 Փեսայի կողմից՝ ${groomGuests} հյուր
`.trim();

  await sendTelegramMessage(
    env,
    chatId,
    text,
    MENU_KEYBOARD
  );
}

async function sendAllGuests(
  env,
  chatId,
  wedding,
  responses
) {
  if (responses.length === 0) {
    await sendTelegramMessage(
      env,
      chatId,
      `📋 ${wedding.couple_names}\n\nԴեռ RSVP պատասխաններ չկան։`,
      MENU_KEYBOARD
    );

    return;
  }

  const lines = responses.map(formatGuestLine);

  await sendLongTelegramMessage(
    env,
    chatId,
    `📋 Հյուրերի ցանկ\n\n💍 ${wedding.couple_names}\n`,
    lines,
    MENU_KEYBOARD
  );
}

async function sendGuestsBySide(
  env,
  chatId,
  wedding,
  responses,
  side
) {
  const filteredResponses = responses.filter(
    (response) =>
      response.side === side && isAttending(response)
  );

  const sideIcon =
    side === "Հարսի կողմ" ? "👰" : "🤵";

  if (filteredResponses.length === 0) {
    await sendTelegramMessage(
      env,
      chatId,
      `${sideIcon} ${side}\n\nԴեռ եկող հյուրեր չկան։`,
      MENU_KEYBOARD
    );

    return;
  }

  const totalGuests = filteredResponses.reduce(
    (total, response) => total + getGuestCount(response),
    0
  );

  const lines = filteredResponses.map(formatGuestLine);

  await sendLongTelegramMessage(
    env,
    chatId,
    `${sideIcon} ${side}\n\nԸնդհանուր՝ ${totalGuests} հյուր\n`,
    lines,
    MENU_KEYBOARD
  );
}

async function sendDeclinedGuests(
  env,
  chatId,
  wedding,
  responses
) {
  const declinedResponses = responses.filter(
    (response) => !isAttending(response)
  );

  if (declinedResponses.length === 0) {
    await sendTelegramMessage(
      env,
      chatId,
      `❌ ${wedding.couple_names}\n\nՉգալու պատասխաններ դեռ չկան։`,
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
    `❌ Չեն գալու\n\n💍 ${wedding.couple_names}\n`,
    lines,
    MENU_KEYBOARD
  );
}

async function showMainMenu(env, chatId, wedding) {
  await sendTelegramMessage(
    env,
    chatId,
    `💍 ${wedding.couple_names}

Ընտրեք անհրաժեշտ բաժինը ներքևի կոճակներից։`,
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

    /*
      /start CONNECTION_CODE
    */
    if (text.startsWith("/start")) {
      const parts = text.split(/\s+/);
      const connectionCode = parts[1]
        ?.trim()
        .toUpperCase();

      if (connectionCode) {
        const wedding =
          await findWeddingByConnectionCode(
            env,
            connectionCode
          );

        if (!wedding) {
          await sendTelegramMessage(
            env,
            chatId,
            `❌ «${connectionCode}» կոդով ակտիվ հարսանիք չի գտնվել։`
          );

          return jsonResponse({
            success: true
          });
        }

        if (
          wedding.expires_at &&
          new Date(wedding.expires_at).getTime() <=
            Date.now()
        ) {
          await sendTelegramMessage(
            env,
            chatId,
            "❌ Այս հարսանիքի համակարգի ժամկետն ավարտվել է։"
          );

          return jsonResponse({
            success: true
          });
        }

        await saveTelegramChatId(
          env,
          wedding.id,
          chatId
        );

        await sendTelegramMessage(
          env,
          chatId,
          `✅ Telegram հաշիվը հաջողությամբ միացվեց։

💍 Հարսանիք՝ ${wedding.couple_names}

Այսուհետ RSVP պատասխանները կստանաք այս bot-ում։`,
          MENU_KEYBOARD
        );

        return jsonResponse({
          success: true
        });
      }

      const connectedWedding =
        await findWeddingByChatId(env, chatId);

      if (!connectedWedding) {
        await sendTelegramMessage(
          env,
          chatId,
          `Բարի գալուստ։

Telegram-ը միացնելու համար օգտագործեք ձեզ ուղարկված հատուկ հղումը։`
        );

        return jsonResponse({
          success: true
        });
      }

      await showMainMenu(
        env,
        chatId,
        connectedWedding
      );

      return jsonResponse({
        success: true
      });
    }

    const wedding = await findWeddingByChatId(
      env,
      chatId
    );

    if (!wedding) {
      await sendTelegramMessage(
        env,
        chatId,
        `❌ Ձեր Telegram հաշիվը դեռ որևէ հարսանիքի միացված չէ։

Օգտագործեք ձեզ ուղարկված հատուկ միացման հղումը։`
      );

      return jsonResponse({
        success: true
      });
    }

    if (
      wedding.expires_at &&
      new Date(wedding.expires_at).getTime() <= Date.now()
    ) {
      await sendTelegramMessage(
        env,
        chatId,
        "❌ Այս հարսանիքի համակարգի ժամկետն ավարտվել է։"
      );

      return jsonResponse({
        success: true
      });
    }

    const responses = await getWeddingResponses(
      env,
      wedding.id
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
        wedding,
        responses
      );
    } else if (
      normalizedText === "/list" ||
      text === "📋 Հյուրերի ցանկ"
    ) {
      await sendAllGuests(
        env,
        chatId,
        wedding,
        responses
      );
    } else if (
      normalizedText === "/bride" ||
      text === "👰 Հարսի կողմ"
    ) {
      await sendGuestsBySide(
        env,
        chatId,
        wedding,
        responses,
        "Հարսի կողմ"
      );
    } else if (
      normalizedText === "/groom" ||
      text === "🤵 Փեսայի կողմ"
    ) {
      await sendGuestsBySide(
        env,
        chatId,
        wedding,
        responses,
        "Փեսայի կողմ"
      );
    } else if (
      normalizedText === "/declined" ||
      text === "❌ Չեն գալու"
    ) {
      await sendDeclinedGuests(
        env,
        chatId,
        wedding,
        responses
      );
    } else if (
      normalizedText === "/menu" ||
      normalizedText === "/help"
    ) {
      await showMainMenu(
        env,
        chatId,
        wedding
      );
    } else {
      await showMainMenu(
        env,
        chatId,
        wedding
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
    message: "Telegram webhook v2 is working"
  });
}