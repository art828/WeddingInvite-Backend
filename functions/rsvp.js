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
    throw new Error("Telegram հաղորդագրությունը չուղարկվեց։");
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

    const isAttending = attendance === "Մենք կգանք";

    const guestCount = isAttending
      ? Math.max(Number.parseInt(data.guests, 10) || 1, 1)
      : 0;

    // Գտնում ենք հարսանիքը wedding_id-ով
    const weddingResponse = await fetch(
      `${env.SUPABASE_URL}/rest/v1/weddings` +
        `?wedding_id=eq.${encodeURIComponent(weddingId)}` +
        `&is_active=eq.true` +
        `&select=id,wedding_id,couple_names,telegram_chat_id`,
      {
        headers: {
          apikey: env.SUPABASE_SECRET_KEY,
          Authorization: `Bearer ${env.SUPABASE_SECRET_KEY}`
        }
      }
    );

    if (!weddingResponse.ok) {
      const errorText = await weddingResponse.text();
      console.error("Wedding lookup error:", errorText);

      return jsonResponse(
        {
          success: false,
          message: "Հարսանիքի տվյալները չհաջողվեց գտնել։"
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

    // RSVP-ի պահպանում Supabase-ում
    const insertResponse = await fetch(
      `${env.SUPABASE_URL}/rest/v1/rsvp_responses`,
      {
        method: "POST",
        headers: {
          apikey: env.SUPABASE_SECRET_KEY,
          Authorization: `Bearer ${env.SUPABASE_SECRET_KEY}`,
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
      const errorText = await insertResponse.text();
      console.error("RSVP insert error:", errorText);

      return jsonResponse(
        {
          success: false,
          message: "Պատասխանը չհաջողվեց պահպանել։"
        },
        500
      );
    }

    const telegramText = `
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
      telegramText
    );

    return jsonResponse({
      success: true,
      message: "Պատասխանը հաջողությամբ ուղարկվել է։"
    });
  } catch (error) {
    console.error("RSVP function error:", error);

    return jsonResponse(
      {
        success: false,
        message: "Սերվերի սխալ է տեղի ունեցել։"
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