exports.handler = async function (event) {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: "Method Not Allowed"
    };
  }

  try {
    const data = JSON.parse(event.body);

    const message = `
🎉 Նոր RSVP

👤 Անուն: ${data.name || "-"}
👰 Կողմ: ${data.side || "-"}
✅ Պատասխան: ${data.attendance || "-"}
👥 Հյուրերի թիվ: ${data.guests || "-"}
💬 Մեկնաբանություն: ${data.message || "-"}
`;

    const response = await fetch(
      `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          chat_id: process.env.TELEGRAM_CHAT_ID,
          text: message
        })
      }
    );

    const telegramText = await response.text();

    if (!response.ok) {
      return {
        statusCode: 500,
        body: telegramText
      };
    }

    return {
      statusCode: 200,
      body: telegramText
    };

  } catch (error) {
    return {
      statusCode: 500,
      body: error.message
    };
  }
};