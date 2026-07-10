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
    console.error("Telegram send error:", result);
    throw new Error(
      result.description || "Telegram message could not be sent"
    );
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

  let chatId = null;

  try {
    if (
      !env.TELEGRAM_BOT_TOKEN ||
      !env.SUPABASE_URL ||
      !env.SUPABASE_SECRET_KEY
    ) {
      throw new Error("Cloudflare environment variables are missing");
    }

    const update = await request.json();
    const message = update.message;

    if (!message?.chat) {
      return jsonResponse({ success: true });
    }

    chatId = String(message.chat.id);
    const text = message.text?.trim() || "";

    if (!text.startsWith("/start")) {
      await sendTelegramMessage(
        env,
        chatId,
        "Բարի գալուստ։ Ձեր Telegram-ը միացնելու համար օգտագործեք ձեզ ուղարկված հատուկ հղումը։"
      );

      return jsonResponse({ success: true });
    }

    const parts = text.split(/\s+/);
    const connectionCode = parts[1]?.trim();

    if (!connectionCode) {
      await sendTelegramMessage(
        env,
        chatId,
        "❌ Միացման կոդը բացակայում է։ Օգտագործեք ձեզ ուղարկված հատուկ հղումը։"
      );

      return jsonResponse({ success: true });
    }

    const baseUrl = env.SUPABASE_URL.replace(/\/+$/, "");

    const query = new URLSearchParams({
      connection_code: `eq.${connectionCode}`,
      is_active: "eq.true",
      select: "id,wedding_id,couple_names"
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
        "Supabase lookup error:",
        weddingResponse.status,
        weddingResponseText
      );

      throw new Error(
        `Supabase lookup failed: ${weddingResponse.status}`
      );
    }

    const weddings = JSON.parse(weddingResponseText);
    const wedding = weddings[0];

    if (!wedding) {
      await sendTelegramMessage(
        env,
        chatId,
        `❌ «${connectionCode}» միացման կոդով ակտիվ հարսանիք չի գտնվել։`
      );

      return jsonResponse({ success: true });
    }

    const updateResponse = await fetch(
      `${baseUrl}/rest/v1/weddings?id=eq.${encodeURIComponent(wedding.id)}`,
      {
        method: "PATCH",
        headers: {
          apikey: env.SUPABASE_SECRET_KEY,
          "Content-Type": "application/json",
          Prefer: "return=minimal"
        },
        body: JSON.stringify({
          telegram_chat_id: chatId
        })
      }
    );

    const updateResponseText = await updateResponse.text();

    if (!updateResponse.ok) {
      console.error(
        "Supabase update error:",
        updateResponse.status,
        updateResponseText
      );

      throw new Error(
        `Supabase update failed: ${updateResponse.status}`
      );
    }

    await sendTelegramMessage(
      env,
      chatId,
      `✅ Telegram հաշիվը հաջողությամբ միացվեց։

💍 Հարսանիք՝ ${wedding.couple_names}

Այսուհետ RSVP պատասխանները կստանաք այս bot-ում։`
    );

    return jsonResponse({ success: true });
  } catch (error) {
    console.error("Webhook error:", error);

    if (chatId) {
      try {
        await sendTelegramMessage(
          env,
          chatId,
          `❌ Միացման ժամանակ սխալ տեղի ունեցավ։

Սխալ՝ ${error.message}`
        );
      } catch (telegramError) {
        console.error("Could not send error message:", telegramError);
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
    message: "Telegram webhook is working"
  });
}