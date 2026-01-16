/* ===========================
   USER / THEME
=========================== */

function signin() {
  const name = prompt("Enter display name (optional)");
  if (!name) return;
  localStorage.setItem("glc_user", name);
  updateUser();
}

function updateUser() {
  const user = localStorage.getItem("glc_user");
  const el = document.getElementById("userText");
  if (!el) return;
  el.innerText = user ? `Signed in as ${user}` : "Not signed in";
}

function toggleTheme() {
  document.body.classList.toggle("light");
  localStorage.setItem(
    "glc_theme",
    document.body.classList.contains("light") ? "light" : "dark"
  );
}

/* ===========================
   NETWORK TESTS
=========================== */

// Ping + jitter test (trend-based)
async function pingTest() {
  const samples = [];
  const runs = 8;

  for (let i = 0; i < runs; i++) {
    const start = performance.now();
    try {
      await fetch("https://www.google.com/favicon.ico", {
        mode: "no-cors",
        cache: "no-store"
      });
      samples.push(performance.now() - start);
    } catch {
      samples.push(300);
    }
  }

  const avg =
    samples.reduce((a, b) => a + b, 0) / samples.length;
  const jitter = Math.max(...samples) - Math.min(...samples);

  return {
    avg: Math.round(avg),
    jitter: Math.round(jitter)
  };
}

// Sustained upload test (stream-accurate)
async function sustainedUploadTest() {
  const chunkSize = 512 * 1024; // 512 KB
  const rounds = 6;
  const speeds = [];

  for (let i = 0; i < rounds; i++) {
    const data = new Uint8Array(chunkSize);
    const start = performance.now();

    try {
      await fetch("https://httpbin.org/post", {
        method: "POST",
        body: data,
        cache: "no-store"
      });

      const time = (performance.now() - start) / 1000;
      const speed = (chunkSize * 8) / time / 1e6;
      speeds.push(speed);
    } catch {
      speeds.push(0);
    }
  }

  const avg =
    speeds.reduce((a, b) => a + b, 0) / speeds.length;
  const min = Math.min(...speeds);
  const stability = avg > 0 ? Math.round((min / avg) * 100) : 0;

  return {
    avg: avg.toFixed(2),
    stability
  };
}

/* ===========================
   UI HELPERS
=========================== */

function setBar(id, value, max) {
  const el = document.getElementById(id);
  if (!el) return;
  el.style.width = Math.min((value / max) * 100, 100) + "%";
}

function getStreamStatus(upload, stability, jitter) {
  if (upload >= 6 && stability >= 80 && jitter < 20)
    return ["🟢 STREAM STABLE", "safe"];

  if (upload >= 4 && stability >= 60 && jitter < 35)
    return ["🟡 POSSIBLE FRAME DROPS", "risky"];

  return ["🔴 STREAM NOT SAFE", "bad"];
}

/* ===========================
   MAIN TEST FLOW
=========================== */

async function startTest() {
  const results = document.getElementById("results");
  if (results) results.classList.remove("hidden");

  const statusCard = document.getElementById("statusCard");
  if (statusCard) {
    statusCard.textContent = "Testing connection…";
    statusCard.className = "card";
  }

  // Run tests
  const ping = await pingTest();
  const upload = await sustainedUploadTest();

  // Verdict
  const verdict = getStreamStatus(
    Number(upload.avg),
    upload.stability,
    ping.jitter
  );

  // Update status
  if (statusCard) {
    statusCard.textContent = verdict[0];
    statusCard.className = "card " + verdict[1];
  }

  // Update metrics
  document.getElementById("upload").innerText = upload.avg;
  document.getElementById("ping").innerText = ping.avg;
  document.getElementById("jitter").innerText = ping.jitter;

  // Update meters
  setBar("uploadBar", upload.avg, 10);
  setBar("pingBar", ping.avg, 200);
  setBar("jitterBar", ping.jitter, 100);

  // Save last test
  localStorage.setItem(
    "glc_last",
    JSON.stringify({
      time: Date.now(),
      upload: upload.avg,
      stability: upload.stability,
      ping: ping.avg,
      jitter: ping.jitter
    })
  );
}

/* ===========================
   INIT
=========================== */

window.onload = () => {
  updateUser();

  if (localStorage.getItem("glc_theme") === "light") {
    document.body.classList.add("light");
  }
};
