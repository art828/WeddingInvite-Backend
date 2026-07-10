const rsvpForm = document.getElementById("rsvpForm");

if (rsvpForm) {
  rsvpForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    const form = event.currentTarget;
    const submitButton = form.querySelector('button[type="submit"]');

    const data = {
      weddingId: "olivia-adam",
      side: form.elements.side.value,
      name: form.elements.name.value.trim(),
      attendance: form.elements.attendance.value,
      guests: form.elements.guests.value,
      message: form.elements.message.value.trim()
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
        throw new Error(
          result.message || "Չհաջողվեց ուղարկել պատասխանը։"
        );
      }

      alert("Շնորհակալություն, ձեր պատասխանը ուղարկվել է։");
      form.reset();
    } catch (error) {
      console.error("RSVP error:", error);

      alert(
        error.message || "Սխալ տեղի ունեցավ։ Խնդրում ենք փորձել կրկին։"
      );
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = "Ուղարկել";
    }
  });
}