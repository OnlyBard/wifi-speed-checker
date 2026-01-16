function signin() {
  const name = prompt("Display name (optional)");
  if (!name) return;
  localStorage.setItem("glc_user", name);
  updateUser();
}

function updateUser() {
  const user = localStorage.getItem("glc_user");
  document.getElementById("userText").innerText =
    user ? `Signed in as ${user}` : "Not signed in";
}

function toggleTheme() {
  document.body.classList.toggle("light");
  localStorage.setItem(
    "glc_theme",
    document.body.classList.contains("light") ? "light" : "dark"
  );
}

async function pingTest() {
  const times = [];
  for (let i = 0; i < 6; i++) {
    const start = performance.now();
    await fetch("https://www.google.com/favicon.ico", { mode: "no-cors" });
    times.push(performance.now() - start);
  }
  return {
    avg: Math.round(times.reduce((a, b) => a + b) / times.length),
    jitter: Math.round(Math.max(...times) - Math.min(...times))
  };
}

async function uploadTest() {
  const data = new Uint8Array(2 * 1024 * 1024);
  const start = performance.now();
  await fetch("https://httpbin.org/post", { method: "POST", body: data });
  return ((data.length * 8) / ((performance.now() - start) / 1000) / 1e6).toFixed(2);
}

function setBar(id, value, max) {
  document.getElementById(id).style.width =
    Math.min((value / max) * 100, 100) + "%";
}

function getStatus(upload, jitter) {
  if (upload >= 6 && jitter < 20) return ["SAFE TO GO LIVE", "safe"];
  if (upload >= 4) return ["RISKY – LOWER QUALITY", "risky"];
  return ["DO NOT GO LIVE", "bad"];
}

async function startTest() {
  document.getElementById("results").classList.remove("hidden");

  const ping = await pingTest();
  const upload = await uploadTest();
  const status = getStatus(upload, ping.jitter);

  const card = document.getElementById("statusCard");
  card.textContent = status[0];
  card.className = `card ${status[1]}`;

  document.getElementById("upload").innerText = upload;
  document.getElementById("ping").innerText = ping.avg;
  document.getElementById("jitter").innerText = ping.jitter;

  setBar("uploadBar", upload, 10);
  setBar("pingBar", ping.avg, 200);
  setBar("jitterBar", ping.jitter, 100);
}

window.onload = () => {
  updateUser();
  if (localStorage.getItem("glc_theme") === "light") {
    document.body.classList.add("light");
  }
};

