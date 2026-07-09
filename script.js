const form = document.getElementById("rsvpForm");

form.addEventListener("submit", async function (e) {
  e.preventDefault();

  const data = new FormData(form);

  const result = {
    side: data.get("side"),
    name: data.get("name"),
    attendance: data.get("attendance"),
    guests: data.get("guests"),
    message: data.get("message")
  };

  try {
    const response = await fetch("/.netlify/functions/send-telegram", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(result)
    });

    if (!response.ok) {
      const txt = await response.text();
      alert(txt);
      return;
    }

    alert("Ձեր պատասխանը ստացվեց։ Շնորհակալություն։");
    form.reset();

  } catch (error) {
    alert("Սխալ տեղի ունեցավ։ Խնդրում ենք փորձել կրկին։");
    console.error(error);
  }
});

