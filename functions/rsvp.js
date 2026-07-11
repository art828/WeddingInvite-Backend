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

export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    if (
      !env.TELEGRAM_BOT_TOKEN ||
      !env.SUPABASE_URL ||
      !env.SUPABASE_SECRET_KEY
    ) {
      throw new Error("Backend-ի environment variables-ը բացակայում են։");
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

    const isAttending = attendance === "Մենք կգանք";

    const guestCount = isAttending
      ? Math.min(
          Math.max(Number.parseInt(data.guests, 10) || 1, 1),
          20
        )
      : 0;

    const baseUrl = getSupabaseBaseUrl(env.SUPABASE_URL);

    /*
      1. Գտնում ենք տվյալ հարսանիքը readable wedding_id-ով։
      2. Վերցնում ենք նրա մշտապես եզակի թվային id-ն։
      3. Ստուգում ենք՝ ակտիվ է և ժամկետը չի ավարտվել։
    */
    const weddingQuery = new URLSearchParams({
      wedding_id: `eq.${weddingId}`,
      is_active: "eq.true",
      select:
        "id,wedding_id,couple_names,telegram_chat_id,connection_code,expires_at"
    });

    const weddingResponse = await fetch(
      `${baseUrl}/rest/v1/weddings?${weddingQuery.toString()}`,
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
          message: "Հարսանիքի տվյալները չհաջողվեց ստանալ։"
        },
        500
      );
    }

    let weddings;

    try {
      weddings = JSON.parse(weddingResponseText);
    } catch {
      console.error("Invalid Supabase JSON:", weddingResponseText);

      return jsonResponse(
        {
          success: false,
          message: "Տվյալների բազան սխալ պատասխան է վերադարձրել։"
        },
        500
      );
    }

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

    if (
      wedding.expires_at &&
      new Date(wedding.expires_at).getTime() <= Date.now()
    ) {
      return jsonResponse(
        {
          success: false,
          message: "Այս հրավիրատոմսի պատասխանների ընդունման ժամկետն ավարտվել է։"
        },
        410
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

    /*
      RSVP-ն պահում ենք հիմնական կապով՝ wedding_db_id։

      wedding_id text դաշտը ժամանակավորապես նույնպես պահում ենք,
      որպեսզի Supabase-ում հեշտ ճանաչես տվյալ հարսանիքը։
      Հետագայում ցանկության դեպքում այն կարող ենք հեռացնել։
    */
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
          wedding_db_id: wedding.id,
          wedding_id: wedding.wedding_id,
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
          message: "Պատասխանը չհաջողվեց պահպանել։"
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

    try {
      await sendTelegramMessage(
        env,
        wedding.telegram_chat_id,
        telegramMessage
      );
    } catch (telegramError) {
      console.error("Telegram delivery error:", telegramError);

      return jsonResponse(
        {
          success: false,
          saved: true,
          message:
            "Պատասխանը պահպանվել է, բայց Telegram հաղորդագրությունը չի ուղարկվել։"
        },
        502
      );
    }

    return jsonResponse({
      success: true,
      message: "Պատասխանը հաջողությամբ ուղարկվել է։"
    });
  } catch (error) {
    console.error("RSVP error:", error);

    return jsonResponse(
      {
        success: false,
        message: "Սերվերի սխալ է տեղի ունեցել։"
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
    message: "RSVP API v2 is working"
  });
}