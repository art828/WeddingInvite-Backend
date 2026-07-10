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
    throw new Error(result.description || "Telegram message could not be sent.");
  }
}

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=UTF-8"
    }
  });
}

export async function onRequestPost(context) {
  const { request, env } = context;

  try {
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
        ? Math.max(parseInt(data.guests || "1"), 1)
        : 0;

    const weddingResponse = await fetch(
      `${env.SUPABASE_URL}/rest/v1/weddings?wedding_id=eq.${encodeURIComponent(
        weddingId
      )}&is_active=eq.true&select=id,wedding_id,couple_names,telegram_chat_id`,
      {
        headers: {
          apikey: env.SUPABASE_SECRET_KEY,
          Accept: "application/json"
        }
      }
    );

    if (!weddingResponse.ok) {
      console.error(await weddingResponse.text());

      return jsonResponse(
        {
          success: false,
          message: "Չհաջողվեց գտնել հարսանիքը։"
        },
        500
      );
    }

    const weddings = await weddingResponse.json();
    const wedding = weddings[0];

    if (!wedding) {
      return jsonResponse(
        {
          success: false,
          message: "Հարսանիքը չի գտնվել։"
        },
        404
      );
    }

    if (!wedding.telegram_chat_id) {
      return jsonResponse(
        {
          success: false,
          message: "Telegram-ը դեռ միացված չէ։"
        },
        409
      );
    }

    const insertResponse = await fetch(
      `${env.SUPABASE_URL}/rest/v1/rsvp_responses`,
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

    if (!insertResponse.ok) {
      console.error(await insertResponse.text());

      return jsonResponse(
        {
          success: false,
          message: "Չհաջողվեց պահպանել RSVP-ն։"
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
      message: "Պատասխանը հաջողությամբ ուղարկվեց։"
    });
  } catch (error) {
    console.error("RSVP Error:", error);

    return jsonResponse(
      {
        success: false,
        message: error.message
      },
      500
    );
  }
}

export function onRequestGet() {
  return jsonResponse({
    success: true,
    message: "RSVP API is working"
  });
}