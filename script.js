document.getElementById("rsvpForm").addEventListener("submit", async function (e) {
  e.preventDefault();

  const form = e.target;

  const data = {
    side: form.side.value,
    name: form.name.value,
    attendance: form.attendance.value,
    guests: form.guests.value,
    message: form.message.value
  };

  try {
    const response = await fetch("/.netlify/functions/rsvp", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      throw new Error("Չուղարկվեց");
    }

    alert("Շնորհակալություն, ձեր պատասխանը ուղարկվել է։");
    form.reset();

  } catch (error) {
    alert("Սխալ տեղի ունեցավ։ Փորձեք կրկին։");
  }
});