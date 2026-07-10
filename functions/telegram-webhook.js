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
    throw new Error("Telegram message could not be sent");
  }
}

export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const update = await request.json();
    const message = update.message;

    if (!message?.chat) {
      return Response.json({ success: true });
    }

    const chatId = String(message.chat.id);
    const text = message.text?.trim() || "";

    if (!text.startsWith("/start")) {
      await sendTelegramMessage(
        env,
        chatId,
        "Բարի գալուստ։ Ձեր Telegram-ը միացնելու համար օգտագործեք ձեզ ուղարկված հատուկ հղումը։"
      );

      return Response.json({ success: true });
    }

    const [, connectionCode] = text.split(/\s+/);

    if (!connectionCode) {
      await sendTelegramMessage(
        env,
        chatId,
        "❌ Միացման կոդը բացակայում է։ Օգտագործեք ձեզ ուղարկված հատուկ հղումը։"
      );

      return Response.json({ success: true });
    }

    // Հարսանիքի որոնում connection_code-ով
    const weddingResponse = await fetch(
      `${env.SUPABASE_URL}/rest/v1/weddings` +
        `?connection_code=eq.${encodeURIComponent(connectionCode)}` +
        `&is_active=eq.true` +
        `&select=id,wedding_id,couple_names`,
      {
        headers: {
          apikey: env.SUPABASE_SECRET_KEY,
          Authorization: `Bearer ${env.SUPABASE_SECRET_KEY}`
        }
      }
    );

    if (!weddingResponse.ok) {
      const errorText = await weddingResponse.text();
      console.error("Supabase lookup error:", errorText);
      throw new Error("Wedding lookup failed");
    }

    const weddings = await weddingResponse.json();
    const wedding = weddings[0];

    if (!wedding) {
      await sendTelegramMessage(
        env,
        chatId,
        "❌ Միացման կոդը սխալ է կամ հարսանիքն ակտիվ չէ։"
      );

      return Response.json({ success: true });
    }

    // Telegram chat_id-ի պահպանում
    const updateResponse = await fetch(
      `${env.SUPABASE_URL}/rest/v1/weddings?id=eq.${wedding.id}`,
      {
        method: "PATCH",
        headers: {
          apikey: env.SUPABASE_SECRET_KEY,
          Authorization: `Bearer ${env.SUPABASE_SECRET_KEY}`,
          "Content-Type": "application/json",
          Prefer: "return=minimal"
        },
        body: JSON.stringify({
          telegram_chat_id: chatId
        })
      }
    );

    if (!updateResponse.ok) {
      const errorText = await updateResponse.text();
      console.error("Supabase update error:", errorText);
      throw new Error("Telegram connection could not be saved");
    }

    await sendTelegramMessage(
      env,
      chatId,
      `✅ Telegram հաշիվը հաջողությամբ միացվեց։

💍 Հարսանիք՝ ${wedding.couple_names}

Այսուհետ RSVP պատասխանները կստանաք այս bot-ում։`
    );

    return Response.json({ success: true });
  } catch (error) {
    console.error("Webhook error:", error);

    // Telegram-ին վերադարձնում ենք 200, որպեսզի նույն update-ը անվերջ չկրկնի
    return Response.json({
      success: false,
      error: "Webhook processing failed"
    });
  }
}

export function onRequestGet() {
  return Response.json({
    success: true,
    message: "Telegram webhook is working"
  });
}