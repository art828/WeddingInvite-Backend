const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type"
};

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=UTF-8",
      ...corsHeaders
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

function hasFormValue(value) {
  return (
    value !== undefined &&
    value !== null &&
    String(value).trim() !== ""
  );
}

function normalizeAttendance(value) {
  return String(value || "").trim().toLowerCase();
}

function isAttendingValue(value) {
  const normalized = normalizeAttendance(value);

  return [
    "մենք կգանք",
    "կգամ",
    "մասնակցելու ենք",
    "мы придём",
    "мы придем",
    "я приду",
    "будем участвовать",
    "will attend",
    "we will attend",
    "i will attend",
    "attending",
    "yes"
  ].includes(normalized);
}

async function sendTelegramMessage(env, chatId, text) {
  const response = await fetch(
    `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        chat_id: chatId,
        text
      })
    }
  );

  const result = await response.json();

  if (!response.ok || !result.ok) {
    console.error("Telegram error:", result);

    throw new Error(
      result.description ||
        "Telegram հաղորդագրությունը չհաջողվեց ուղարկել։"
    );
  }
}

export async function onRequestPost(context) {
  const { request, env } = context;

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

    const data = await request.json();

    const eventId = data.weddingId?.trim();
    const name = data.name?.trim();
    const attendance = data.attendance?.trim();

    const side = hasFormValue(data.side)
      ? String(data.side).trim()
      : "";

    const message = hasFormValue(data.message)
      ? String(data.message).trim()
      : null;

    const guestsFieldExists = hasFormValue(data.guests);

    const localPhone = String(data.phone || "")
      .replace(/\D/g, "");

    if (!/^[1-9]\d{7}$/.test(localPhone)) {
      return jsonResponse(
        {
          success: false,
          message:
            "Հեռախոսահամարը պետք է բաղկացած լինի 8 թվից՝ առանց սկզբի 0-ի։"
        },
        400
      );
    }

    const normalizedPhone = `374${localPhone}`;

    if (!eventId || !name || !attendance) {
      return jsonResponse(
        {
          success: false,
          message: "Լրացրեք բոլոր պարտադիր դաշտերը։"
        },
        400
      );
    }

    if (name.length > 150) {
      return jsonResponse(
        {
          success: false,
          message: "Անունը չափազանց երկար է։"
        },
        400
      );
    }

    if (message && message.length > 1000) {
      return jsonResponse(
        {
          success: false,
          message: "Մեկնաբանությունը չափազանց երկար է։"
        },
        400
      );
    }

    const isAttending = isAttendingValue(attendance);

    const guestCount = isAttending
      ? Math.min(
          Math.max(
            Number.parseInt(data.guests, 10) || 1,
            1
          ),
          20
        )
      : 0;

    const baseUrl = getSupabaseBaseUrl(
      env.SUPABASE_URL
    );

    const eventQuery = new URLSearchParams({
      wedding_id: `eq.${eventId}`,
      is_active: "eq.true",
      select:
        "id,wedding_id,couple_names,telegram_chat_id,expires_at,language"
    });

    const eventResponse = await fetch(
      `${baseUrl}/rest/v1/weddings?${eventQuery.toString()}`,
      {
        method: "GET",
        headers: getSupabaseHeaders(env)
      }
    );

    const eventResponseText =
      await eventResponse.text();

    if (!eventResponse.ok) {
      console.error(
        "Event lookup error:",
        eventResponse.status,
        eventResponseText
      );

      return jsonResponse(
        {
          success: false,
          message:
            "Միջոցառման տվյալները չհաջողվեց ստանալ։"
        },
        500
      );
    }

    let events;

    try {
      events = JSON.parse(eventResponseText);
    } catch {
      console.error(
        "Invalid Supabase event response:",
        eventResponseText
      );

      return jsonResponse(
        {
          success: false,
          message:
            "Տվյալների բազան սխալ պատասխան է վերադարձրել։"
        },
        500
      );
    }

    const event = events[0];

    if (!event) {
      return jsonResponse(
        {
          success: false,
          message:
            "Միջոցառումը չի գտնվել կամ ակտիվ չէ։"
        },
        404
      );
    }

    if (
      event.expires_at &&
      new Date(event.expires_at).getTime() <=
        Date.now()
    ) {
      return jsonResponse(
        {
          success: false,
          message:
            "Այս հրավիրատոմսի պատասխանների ընդունման ժամկետն ավարտվել է։"
        },
        410
      );
    }

    if (!event.telegram_chat_id) {
      return jsonResponse(
        {
          success: false,
          message:
            "Միջոցառման կազմակերպիչը դեռ չի միացրել Telegram bot-ը։"
        },
        409
      );
    }

    const existingQuery = new URLSearchParams({
      wedding_db_id: `eq.${event.id}`,
      phone: `eq.${normalizedPhone}`,
      select:
        "id,guest_name,attendance,guests,side,message",
      limit: "1"
    });

    const existingResponse = await fetch(
      `${baseUrl}/rest/v1/rsvp_responses?${existingQuery.toString()}`,
      {
        method: "GET",
        headers: getSupabaseHeaders(env)
      }
    );

    const existingResponseText =
      await existingResponse.text();

    if (!existingResponse.ok) {
      console.error(
        "Existing response lookup error:",
        existingResponse.status,
        existingResponseText
      );

      return jsonResponse(
        {
          success: false,
          message:
            "Չհաջողվեց ստուգել նախորդ պատասխանը։"
        },
        500
      );
    }

    let existingResponses;

    try {
      existingResponses = JSON.parse(
        existingResponseText
      );
    } catch {
      console.error(
        "Invalid existing response JSON:",
        existingResponseText
      );

      return jsonResponse(
        {
          success: false,
          message:
            "Տվյալների բազան սխալ պատասխան է վերադարձրել։"
        },
        500
      );
    }

    const previousResponse =
      existingResponses[0] || null;

    const upsertPayload = {
      wedding_db_id: event.id,
      wedding_id: event.wedding_id,
      guest_name: name,
      phone: normalizedPhone,
      attendance,
      guests: guestCount,
      updated_at: new Date().toISOString()
    };

    if (side) {
      upsertPayload.side = side;
    } else {
      upsertPayload.side = "";
    }

    if (message) {
      upsertPayload.message = message;
    } else {
      upsertPayload.message = null;
    }

    const upsertResponse = await fetch(
      `${baseUrl}/rest/v1/rsvp_responses?on_conflict=wedding_db_id,phone`,
      {
        method: "POST",
        headers: getSupabaseHeaders(env, {
          "Content-Type": "application/json",
          Prefer:
            "resolution=merge-duplicates,return=representation"
        }),
        body: JSON.stringify(upsertPayload)
      }
    );

    const upsertResponseText =
      await upsertResponse.text();

    if (!upsertResponse.ok) {
      console.error(
        "Guest response upsert error:",
        upsertResponse.status,
        upsertResponseText
      );

      return jsonResponse(
        {
          success: false,
          message:
            "Ձեր պատասխանը չհաջողվեց պահպանել։"
        },
        500
      );
    }

    const formattedPhone =
      `+374 ${localPhone.slice(0, 2)} ` +
      `${localPhone.slice(2, 5)} ` +
      `${localPhone.slice(5)}`;

    let telegramMessage;

    if (previousResponse) {
      const telegramLines = [
        "♻️ Հյուրի պատասխանը թարմացվեց",
        "",
        `🎉 Միջոցառում՝ ${event.couple_names}`,
        `👤 Հյուր՝ ${name}`,
        `📞 Հեռախոս՝ ${formattedPhone}`
      ];

      if (side) {
        telegramLines.push(`🏷 Խումբ՝ ${side}`);
      }

      telegramLines.push("");
      telegramLines.push("Նախորդ պատասխան՝");
      telegramLines.push(
        previousResponse.attendance || "-"
      );

      if (
        Number(previousResponse.guests) > 0
      ) {
        telegramLines.push(
          `👥 ${previousResponse.guests} հյուր`
        );
      }

      telegramLines.push("");
      telegramLines.push("Նոր պատասխան՝");
      telegramLines.push(attendance);

      if (
        isAttending &&
        guestsFieldExists
      ) {
        telegramLines.push(
          `👥 ${guestCount} հյուր`
        );
      }

      if (message) {
        telegramLines.push("");
        telegramLines.push(
          `💬 Մեկնաբանություն՝ ${message}`
        );
      }

      telegramMessage = telegramLines.join("\n");
    } else {
      const telegramLines = [
        "📩 Նոր պատասխան",
        "",
        `🎉 Միջոցառում՝ ${event.couple_names}`,
        `👤 Հյուր՝ ${name}`,
        `📞 Հեռախոս՝ ${formattedPhone}`
      ];

      if (side) {
        telegramLines.push(`🏷 Խումբ՝ ${side}`);
      }

      telegramLines.push(
        `✅ Պատասխան՝ ${attendance}`
      );

      if (
        isAttending &&
        guestsFieldExists
      ) {
        telegramLines.push(
          `👥 Հյուրերի թիվ՝ ${guestCount}`
        );
      }

      if (message) {
        telegramLines.push(
          `💬 Մեկնաբանություն՝ ${message}`
        );
      }

      telegramMessage = telegramLines.join("\n");
    }

    try {
      await sendTelegramMessage(
        env,
        event.telegram_chat_id,
        telegramMessage
      );
    } catch (telegramError) {
      console.error(
        "Telegram delivery error:",
        telegramError
      );

      return jsonResponse(
        {
          success: false,
          saved: true,
          updated: Boolean(previousResponse),
          message:
            "Ձեր պատասխանը պահպանվել է, բայց կազմակերպչին ուղարկվող հաղորդագրությունը չի հասել։"
        },
        502
      );
    }

    return jsonResponse({
      success: true,
      updated: Boolean(previousResponse),
      message: previousResponse
        ? "Ձեր պատասխանը հաջողությամբ թարմացվել է։"
        : "Շնորհակալություն։ Ձեր պատասխանը հաջողությամբ ուղարկվել է։"
    });
  } catch (error) {
    console.error("Guest response error:", error);

    return jsonResponse(
      {
        success: false,
        message:
          "Սերվերի սխալ է տեղի ունեցել։ Խնդրում ենք փորձել կրկին։"
      },
      500
    );
  }
}

export function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: corsHeaders
  });
}

export function onRequestGet() {
  return jsonResponse({
    success: true,
    message:
      "Invite response API with optional fields is working"
  });
}