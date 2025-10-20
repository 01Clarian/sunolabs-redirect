import express from "express";
const app = express();
const PORT = process.env.PORT || 10000;

// --- Parse JSON for client→server logs
app.use(express.json());

// === CONFIG: Helius RPC (your key) ===
const RPC_URL =
  process.env.SOLANA_RPC_URL ||
  "https://mainnet.helius-rpc.com/?api-key=f6691497-4961-41e1-9a08-53f30c65bf43";

// === BASIC HEALTH ===
app.get("/", (_, res) => {
  res.send("✅ SunoLabs Redirect is live! Use /pay?recipient=...&amount=...");
});

// === CLIENT → SERVER LOGGING (show up in Render logs) ===
app.post("/log", (req, res) => {
  const { event, detail } = req.body || {};
  console.log(`🟣 [CLIENT LOG] ${event || "event"}: ${detail || "no details"}`);
  res.sendStatus(200);
});

// === PAYMENT PAGE (HTML only, no inline module code) ===
app.get("/pay", (req, res) => {
  const {
    recipient,
    amount = "0.01",
    label = "SunoLabs Entry",
    message = "Confirm your submission",
  } = req.query;

  if (!recipient) return res.status(400).send("Missing recipient address");

  // VERY SIMPLE escaping for HTML text nodes
  const esc = (s = "") =>
    String(s).replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

  // We pass config as data-* attributes; JS module will read them safely.
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.send(`<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>SunoLabs Pay</title>
<style>
  body{background:#0a0a0a;color:#fff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;text-align:center;padding:80px 20px;margin:0}
  h2{margin:0 0 8px}
  button{background:#9945ff;border:none;border-radius:8px;padding:14px 28px;font-size:16px;color:#fff;cursor:pointer;margin-top:20px;transition:.2s}
  button:hover{background:#7e2fff;transform:scale(1.02)}
  .info{margin-top:20px;color:#aaa;font-size:14px}
  #debug{margin-top:30px;padding:15px;background:#1a1a1a;border-radius:8px;font-size:11px;color:#888;text-align:left;max-width:540px;margin:30px auto;font-family:'Courier New',monospace;max-height:280px;overflow-y:auto}
  .log-success{color:#4ade80}.log-error{color:#ff6b6b}.log-info{color:#60a5fa}
</style>
</head>
<body>
  <h2>💸 Send ${esc(amount)} SOL to SunoLabs</h2>
  <p>${esc(label)}<br/>${esc(message)}</p>

  <button id="sendBtn"
    data-recipient="${esc(recipient)}"
    data-amount="${esc(amount)}"
    data-rpc="${esc(RPC_URL)}"
  >💸 Send with Wallet</button>

  <p class="info">Compatible with Phantom & Solflare wallets</p>

  <div id="debug"><div style="color:#60a5fa;margin-bottom:10px;">📋 Debug Console:</div></div>

  <!-- Load the app logic as a separate ES module -->
  <script type="module" src="/app.js"></script>
  <noscript style="color:#ff6b6b">JavaScript required</noscript>
</body>
</html>`);
});

// === APP MODULE (served as JS file to avoid inline template glitches) ===
app.get("/app.js", (req, res) => {
  res.setHeader("Content-Type", "application/javascript; charset=utf-8");
  res.send(`
// --- tiny log panel + server logger ---
const dbg = document.getElementById("debug");
function log(msg, type="info"){
  const cls = type==="error" ? "log-error" : type==="success" ? "log-success" : "log-info";
  const t = new Date().toLocaleTimeString();
  if (dbg) { dbg.innerHTML += \`<div class="\${cls}">\${t} - \${msg}</div>\`; dbg.scrollTop = dbg.scrollHeight; }
  console[type==="error"?"error":"log"](msg);
  fetch("/log", { method:"POST", headers:{ "Content-Type":"application/json" }, body: JSON.stringify({ event:type, detail: msg }) }).catch(()=>{});
}

log("🟢 App module loaded");

// Load Solana web3.js from esm.sh
let Connection, PublicKey, SystemProgram, Transaction, LAMPORTS_PER_SOL;
try {
  const w3 = await import("https://esm.sh/@solana/web3.js@1.95.8");
  ({ Connection, PublicKey, SystemProgram, Transaction, LAMPORTS_PER_SOL } = w3);
  log("✅ Solana Web3.js loaded","success");
} catch (e) {
  log("❌ Failed to load web3.js: " + e.message, "error");
}

// Grab config from the button's data-attrs
const btn = document.getElementById("sendBtn");
if (!btn) {
  log("❌ Button not found in DOM","error");
} else {
  log("✅ Button found, attaching handler","success");
}

function getWallet(){
  const w = window;
  if (w.solana?.isPhantom) return { provider: w.solana, name: "Phantom" };
  if (w.solflare?.isSolflare) return { provider: w.solflare, name: "Solflare" };
  return null;
}

async function sendPayment(){
  log("🖱️ Button clicked");
  const wallet = getWallet();
  if (!wallet) {
    log("❌ No Phantom or Solflare detected","error");
    alert("Install Phantom or Solflare wallet first.");
    return;
  }

  const recipient = btn.dataset.recipient;
  const amountStr = btn.dataset.amount || "0.01";
  const rpc = btn.dataset.rpc;
  const amount = parseFloat(amountStr);

  if (!recipient || !amount || !rpc) {
    log("❌ Missing config values","error");
    alert("Config error: missing recipient / amount / RPC.");
    return;
  }

  const { provider, name } = wallet;
  log("🟣 Using wallet: " + name);

  try {
    await provider.connect();
    log("🔗 Wallet connected: " + (provider.publicKey?.toBase58?.() || "unknown"), "success");

    // Build transfer
    const conn = new Connection(rpc, "confirmed");
    const ix = SystemProgram.transfer({
      fromPubkey: provider.publicKey,
      toPubkey: new PublicKey(recipient),
      lamports: Math.floor(amount * LAMPORTS_PER_SOL)
    });
    const tx = new Transaction().add(ix);
    tx.feePayer = provider.publicKey;
    tx.recentBlockhash = (await conn.getLatestBlockhash()).blockhash;

    // Sign + send + confirm
    log("✍️ Requesting signature…");
    const signed = await provider.signTransaction(tx);
    const sig = await conn.sendRawTransaction(signed.serialize());
    log("📡 Sent: " + sig);
    await conn.confirmTransaction(sig, "confirmed");
    log("✅ Confirmed: " + sig, "success");
    alert("✅ Payment successful!\\nSignature: " + sig);
  } catch (e) {
    log("❌ " + (e?.message || e), "error");
    alert("❌ " + (e?.message || e));
  }
}

if (btn) {
  btn.addEventListener("click", (ev) => {
    ev.preventDefault();
    sendPayment();
  }, { passive: true });
  log("✅ Click handler attached","success");
}
  `);
});

// === START SERVER ===
app.listen(PORT, () => {
  console.log(`✅ SunoLabs Redirect running on port ${PORT}`);
});
