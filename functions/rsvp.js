async function sendTelegramMessage(env, text) {
  const response = await fetch(
    `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        chat_id: env.TELEGRAM_CHAT_ID,
        text
      })
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error);
  }
}

export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const data = await request.json();

    const message = `
🎉 Նոր RSVP

💍 Wedding ID: ${data.weddingId || "-"}

👤 Անուն: ${data.name || "-"}
👰 Կողմ: ${data.side || "-"}
✅ Պատասխան: ${data.attendance || "-"}
👥 Հյուրերի թիվ: ${data.guests || "-"}
💬 Մեկնաբանություն: ${data.message || "-"}
`.trim();

    await sendTelegramMessage(env, message);

    return Response.json({
      success: true,
      message: "RSVP received"
    });

  } catch (error) {
    console.error(error);

    return Response.json(
      {
        success: false,
        message: error.message
      },
      {
        status: 500
      }
    );
  }
}

export function onRequestGet() {
  return Response.json({
    success: true,
    message: "RSVP API is working"
  });
}