const form = document.getElementById("rsvpForm");

form.addEventListener("submit", function (e) {
  e.preventDefault();

  const data = new FormData(form);

  const result = {
    side: data.get("side"),
    name: data.get("name"),
    attendance: data.get("attendance"),
    guests: data.get("guests"),
    message: data.get("message")
  };

  console.log(result);
  alert("Ձեր պատասխանը ստացվեց։ Շնորհակալություն։");

  form.reset();
});