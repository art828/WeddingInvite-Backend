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
    const side = data.side?.trim() || "";
    const attendance = data.attendance?.trim();
    const message = data.message?.trim() || null;

    // Հեռացնում ենք բացատները, +, գծիկները և այլ նշանները։
    const localPhone = String(data.phone || "").replace(/\D/g, "");

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

    // Supabase-ում համարը պահվում է մեկ միասնական ձևաչափով։
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

    const isAttending =
      attendance === "Մենք կգանք" ||
      attendance === "Мы придём" ||
      attendance === "Мы придем" ||
      attendance === "Will attend";

    const guestCount = isAttending
      ? Math.min(
          Math.max(
            Number.parseInt(data.guests, 10) || 1,
            1
          ),
          20
        )
      : 0;

    const baseUrl = getSupabaseBaseUrl(env.SUPABASE_URL);

    // Գտնում ենք միջոցառումը readable ID-ով։
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

    const eventResponseText = await eventResponse.text();

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

    const events = JSON.parse(eventResponseText);
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
      new Date(event.expires_at).getTime() <= Date.now()
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

    /*
      Ստուգում ենք՝ այս հեռախոսահամարով պատասխան արդեն կա՞։
      Դա պետք է Telegram-ում տարբերակելու համար՝
      նոր պատասխան է, թե թարմացում։
    */
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

    const existingResponses = JSON.parse(
      existingResponseText
    );

    const previousResponse =
      existingResponses[0] || null;

    /*
      UPSERT՝

      եթե wedding_db_id + phone արդեն կա՝ UPDATE,
      եթե չկա՝ INSERT։
    */
    const upsertResponse = await fetch(
      `${baseUrl}/rest/v1/rsvp_responses?on_conflict=wedding_db_id,phone`,
      {
        method: "POST",
        headers: getSupabaseHeaders(env, {
          "Content-Type": "application/json",
          Prefer:
            "resolution=merge-duplicates,return=representation"
        }),
        body: JSON.stringify({
          wedding_db_id: event.id,
          wedding_id: event.wedding_id,
          guest_name: name,
          phone: normalizedPhone,
          side,
          attendance,
          guests: guestCount,
          message,
          updated_at: new Date().toISOString()
        })
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
      telegramMessage = `
♻️ Հյուրի պատասխանը թարմացվեց

🎉 Միջոցառում՝ ${event.couple_names}
👤 Հյուր՝ ${name}
📞 Հեռախոս՝ ${formattedPhone}
${side ? `🏷 Խումբ՝ ${side}` : ""}

Նախորդ պատասխան՝
${previousResponse.attendance}
👥 ${previousResponse.guests || 0} հյուր

Նոր պատասխան՝
${attendance}
👥 ${guestCount} հյուր

💬 Մեկնաբանություն՝ ${message || "-"}
`.trim();
    } else {
      telegramMessage = `
📩 Նոր պատասխան

🎉 Միջոցառում՝ ${event.couple_names}
👤 Հյուր՝ ${name}
📞 Հեռախոս՝ ${formattedPhone}
${side ? `🏷 Խումբ՝ ${side}` : ""}
✅ Պատասխան՝ ${attendance}
👥 Հյուրերի թիվ՝ ${guestCount}
💬 Մեկնաբանություն՝ ${message || "-"}
`.trim();
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
    message: "Invite response API with phone upsert is working"
  });
}