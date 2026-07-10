const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY
);

async function sendTelegramMessage(chatId, text) {
  const response = await fetch(
    `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`,
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
  }

  return result;
}

exports.handler = async function (event) {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: "Method Not Allowed"
    };
  }

  try {
    const update = JSON.parse(event.body || "{}");

    const message = update.message;

    if (!message || !message.chat) {
      return {
        statusCode: 200,
        body: JSON.stringify({ success: true })
      };
    }

    const chatId = String(message.chat.id);
    const text = message.text?.trim() || "";

    if (!text.startsWith("/start")) {
      await sendTelegramMessage(
        chatId,
        "Բարի գալուստ։ Telegram հաշիվը միացնելու համար օգտագործեք ձեզ ուղարկված հատուկ հղումը։"
      );

      return {
        statusCode: 200,
        body: JSON.stringify({ success: true })
      };
    }

    const parts = text.split(/\s+/);
    const connectionCode = parts[1]?.trim();

    if (!connectionCode) {
      await sendTelegramMessage(
        chatId,
        "Միացման կոդը բացակայում է։ Խնդրում ենք օգտագործել ձեզ ուղարկված հատուկ հղումը։"
      );

      return {
        statusCode: 200,
        body: JSON.stringify({ success: true })
      };
    }

    const { data: wedding, error: weddingError } = await supabase
      .from("weddings")
      .select("id, wedding_id, couple_names, is_active")
      .eq("connection_code", connectionCode)
      .eq("is_active", true)
      .single();

    if (weddingError || !wedding) {
      console.error("Wedding lookup error:", weddingError);

      await sendTelegramMessage(
        chatId,
        "❌ Միացման կոդը սխալ է կամ այլևս ակտիվ չէ։"
      );

      return {
        statusCode: 200,
        body: JSON.stringify({ success: true })
      };
    }

    const { error: updateError } = await supabase
      .from("weddings")
      .update({
        telegram_chat_id: chatId
      })
      .eq("id", wedding.id);

    if (updateError) {
      console.error("Wedding update error:", updateError);

      await sendTelegramMessage(
        chatId,
        "❌ Միացման ժամանակ սխալ տեղի ունեցավ։ Խնդրում ենք փորձել կրկին։"
      );

      return {
        statusCode: 200,
        body: JSON.stringify({ success: true })
      };
    }

    await sendTelegramMessage(
      chatId,
      `✅ Telegram հաշիվը հաջողությամբ միացվեց։

💍 Հարսանիք՝ ${wedding.couple_names}

Այսուհետ RSVP պատասխանները կստանաք այս bot-ում։`
    );

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true })
    };
  } catch (error) {
    console.error("Webhook error:", error);

    return {
      statusCode: 200,
      body: JSON.stringify({ success: false })
    };
  }
};