document
  .getElementById("rsvpForm")
  .addEventListener("submit", async function (e) {
    e.preventDefault();

    const form = e.target;
    const submitButton = form.querySelector('button[type="submit"]');

    const data = {
      weddingId: "olivia-adam",
      side: form.side.value,
      name: form.name.value.trim(),
      attendance: form.attendance.value,
      guests: form.guests.value,
      message: form.message.value.trim()
    };

    try {
      submitButton.disabled = true;
      submitButton.textContent = "Ուղարկվում է...";

      const response = await fetch("/rsvp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Չհաջողվեց ուղարկել պատասխանը։");
      }

      alert("Շնորհակալություն, ձեր պատասխանը ուղարկվել է։");
      form.reset();
    } catch (error) {
      console.error("RSVP error:", error);
      alert(error.message || "Սխալ տեղի ունեցավ։ Փորձեք կրկին։");
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = "Ուղարկել";
    }
  });