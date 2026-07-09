exports.handler = async (event) => {
  try {
    const data = JSON.parse(event.body);

    const response = await fetch(
      `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          chat_id: process.env.TELEGRAM_CHAT_ID,
          text: JSON.stringify(data, null, 2),
        }),
      }
    );

    const telegram = await response.text();

    return {
      statusCode: response.status,
      body: telegram,
    };
  } catch (e) {
    return {
      statusCode: 500,
      body: e.toString(),
    };
  }
};