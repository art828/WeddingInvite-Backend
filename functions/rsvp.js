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

async function sendTelegramMessage(
  env,
  chatId,
  text
) {
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
        "Telegram հաղորդագրությունը չուղարկվեց։"
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
      attendance === "Մենք կգանք";

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
        "id,wedding_id,couple_names,telegram_chat_id,expires_at"
    });

    const eventResponse = await fetch(
      `${baseUrl}/rest/v1/weddings?${eventQuery.toString()}`,
      {
        method: "GET",
        headers: {
          apikey: env.SUPABASE_SECRET_KEY,
          Accept: "application/json"
        }
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

    const insertResponse = await fetch(
      `${baseUrl}/rest/v1/rsvp_responses`,
      {
        method: "POST",
        headers: {
          apikey: env.SUPABASE_SECRET_KEY,
          "Content-Type": "application/json",
          Prefer: "return=representation"
        },
        body: JSON.stringify({
          wedding_db_id: event.id,
          wedding_id: event.wedding_id,
          guest_name: name,
          side,
          attendance,
          guests: guestCount,
          message
        })
      }
    );

    const insertResponseText =
      await insertResponse.text();

    if (!insertResponse.ok) {
      console.error(
        "Guest response insert error:",
        insertResponse.status,
        insertResponseText
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

    const telegramMessage = `
📩 Նոր պատասխան

🎉 Միջոցառում՝ ${event.couple_names}
👤 Հյուր՝ ${name}
${side ? `🏷 Խումբ՝ ${side}` : ""}
✅ Պատասխան՝ ${attendance}
👥 Հյուրերի թիվ՝ ${guestCount}
💬 Մեկնաբանություն՝ ${message || "-"}
`.trim();

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
          message:
            "Ձեր պատասխանը պահպանվել է, բայց կազմակերպչին ուղարկվող հաղորդագրությունը չի հասել։"
        },
        502
      );
    }

    return jsonResponse({
      success: true,
      message:
        "Շնորհակալություն։ Ձեր պատասխանը հաջողությամբ ուղարկվել է։"
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
    message: "Invite response API is working"
  });
}