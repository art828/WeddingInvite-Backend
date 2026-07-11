const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type"
};

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
      result.description || "Telegram հաղորդագրությունը չուղարկվեց։"
    );
  }
}

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=UTF-8",
      ...corsHeaders
    }
  });
}

export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    if (
      !env.TELEGRAM_BOT_TOKEN ||
      !env.SUPABASE_URL ||
      !env.SUPABASE_SECRET_KEY
    ) {
      throw new Error("Cloudflare environment variables-ը բացակայում են։");
    }

    const data = await request.json();

    const weddingId = data.weddingId?.trim();
    const name = data.name?.trim();
    const side = data.side?.trim();
    const attendance = data.attendance?.trim();
    const message = data.message?.trim() || null;

    if (!weddingId || !name || !side || !attendance) {
      return jsonResponse(
        {
          success: false,
          message: "Լրացրեք բոլոր պարտադիր դաշտերը։"
        },
        400
      );
    }

    const guestCount =
      attendance === "Մենք կգանք"
        ? Math.max(Number.parseInt(data.guests, 10) || 1, 1)
        : 0;

    const baseUrl = env.SUPABASE_URL
      .replace(/\/rest\/v1\/?$/i, "")
      .replace(/\/+$/, "");

    const query = new URLSearchParams({
      wedding_id: `eq.${weddingId}`,
      is_active: "eq.true",
      select: "id,wedding_id,couple_names,telegram_chat_id"
    });

    const weddingResponse = await fetch(
      `${baseUrl}/rest/v1/weddings?${query.toString()}`,
      {
        method: "GET",
        headers: {
          apikey: env.SUPABASE_SECRET_KEY,
          Accept: "application/json"
        }
      }
    );

    const weddingResponseText = await weddingResponse.text();

    if (!weddingResponse.ok) {
      console.error(
        "Wedding lookup error:",
        weddingResponse.status,
        weddingResponseText
      );

      return jsonResponse(
        {
          success: false,
          message: `Չհաջողվեց գտնել հարսանիքը։ Սխալ՝ ${weddingResponse.status}`
        },
        500
      );
    }

    const weddings = JSON.parse(weddingResponseText);
    const wedding = weddings[0];

    if (!wedding) {
      return jsonResponse(
        {
          success: false,
          message: "Հարսանիքը չի գտնվել կամ ակտիվ չէ։"
        },
        404
      );
    }

    if (!wedding.telegram_chat_id) {
      return jsonResponse(
        {
          success: false,
          message: "Հարսն ու փեսան դեռ չեն միացրել Telegram bot-ը։"
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
          Prefer: "return=minimal"
        },
        body: JSON.stringify({
          wedding_id: weddingId,
          guest_name: name,
          side,
          attendance,
          guests: guestCount,
          message
        })
      }
    );

    const insertResponseText = await insertResponse.text();

    if (!insertResponse.ok) {
      console.error(
        "RSVP insert error:",
        insertResponse.status,
        insertResponseText
      );

      return jsonResponse(
        {
          success: false,
          message: `Չհաջողվեց պահպանել պատասխանը։ Սխալ՝ ${insertResponse.status}`
        },
        500
      );
    }

    const telegramMessage = `
🎉 Նոր RSVP

💍 Հարսանիք՝ ${wedding.couple_names}
👤 Անուն՝ ${name}
👰🤵 Կողմ՝ ${side}
✅ Պատասխան՝ ${attendance}
👥 Հյուրերի թիվ՝ ${guestCount}
💬 Մեկնաբանություն՝ ${message || "-"}
`.trim();

    await sendTelegramMessage(
      env,
      wedding.telegram_chat_id,
      telegramMessage
    );

    return jsonResponse({
      success: true,
      message: "Պատասխանը հաջողությամբ ուղարկվել է։"
    });
  } catch (error) {
    console.error("RSVP error:", error);

    return jsonResponse(
      {
        success: false,
        message: error.message || "Սերվերի սխալ է տեղի ունեցել։"
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
    message: "RSVP API is working"
  });
}