import express from "express";
const app = express();
const PORT = process.env.PORT || 10000;

app.use(express.json());

// === CONFIG ===
const RPC_URL =
  process.env.SOLANA_RPC_URL ||
  "https://mainnet.helius-rpc.com/?api-key=f6691497-4961-41e1-9a08-53f30c65bf43";

// === BASIC HEALTH ===
app.get("/", (_, res) => {
  res.send("✅ SunoLabs Redirect is live! Use /pay?recipient=...&amount=...");
});

// === CLIENT LOGGING (for Render logs) ===
app.post("/confirm-payment", async (req, res) => {
  try {
    const { signature, reference, userId, amount } = req.body;
    console.log("✅ Received payment confirmation:", {
      signature,
      reference,
      userId,
      amount,
    });

    // === Send Telegram confirmation directly ===
    const token = process.env.BOT_TOKEN;
    const TELEGRAM_API = `https://api.telegram.org/bot${token}/sendMessage`;

    // DM the user who paid
    if (userId) {
      const dm = await fetch(TELEGRAM_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: userId,
          text: "✅ Payment confirmed — your track is officially entered!",
        }),
      });

      if (!dm.ok) {
        console.error("⚠️ Telegram DM failed:", await dm.text());
      } else {
        console.log("📨 Sent Telegram DM to user", userId);
      }
    }

    // Announce in the channel
    const CHANNEL = "@sunolabs_submissions";
    const broadcast = await fetch(TELEGRAM_API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: CHANNEL,
        text: `💰 New payment confirmed: ${amount} SOL added to the pot.`,
      }),
    });

    if (!broadcast.ok) {
      console.error("⚠️ Telegram broadcast failed:", await broadcast.text());
    } else {
      console.log("📣 Announced payment in channel.");
    }

    res.status(200).json({ ok: true });
  } catch (err) {
    console.error("⚠️ Webhook error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});


// === PAYMENT PAGE ===
app.get("/pay", (req, res) => {
  const {
    recipient,
    amount = "0.01",
    label = "SunoLabs Entry",
    message = "Confirm your submission",
    reference = "",
    userId = "",
  } = req.query;

  if (!recipient) return res.status(400).send("Missing recipient address");

  const esc = (s = "") =>
    String(s).replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.send(`<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>SunoLabs Pay</title>
<style>
  body{background:#0a0a0a;color:#fff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;text-align:center;padding:80px 20px;margin:0}
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
    data-reference="${esc(reference)}"
    data-userid="${esc(userId)}"
  >💸 Send with Wallet</button>

  <p class="info">Compatible with Phantom & Solflare wallets</p>

  <div id="debug"><div style="color:#60a5fa;margin-bottom:10px;">📋 Debug Console:</div></div>

  <script type="module" src="/app.js"></script>
</body>
</html>`);
});

// === SEPARATE JS MODULE ===
app.get("/app.js", (req, res) => {
  res.setHeader("Content-Type", "application/javascript; charset=utf-8");
  res.send(`
// --- debug logger ---
const dbg = document.getElementById("debug");
function log(msg, type="info"){
  const cls = type==="error" ? "log-error" : type==="success" ? "log-success" : "log-info";
  const t = new Date().toLocaleTimeString();
  if (dbg){ dbg.innerHTML += \`<div class="\${cls}">\${t} - \${msg}</div>\`; dbg.scrollTop = dbg.scrollHeight; }
  console[type==="error"?"error":"log"](msg);
  fetch("/log",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({event:type,detail:msg})}).catch(()=>{});
}
log("🟢 App module loaded");

// Load Solana web3.js
let Connection, PublicKey, SystemProgram, Transaction, LAMPORTS_PER_SOL;
try {
  const w3 = await import("https://esm.sh/@solana/web3.js@1.95.8");
  ({ Connection, PublicKey, SystemProgram, Transaction, LAMPORTS_PER_SOL } = w3);
  log("✅ Solana Web3.js loaded","success");
} catch(e){ log("❌ Failed to load web3.js: "+e.message,"error"); }

const btn=document.getElementById("sendBtn");
if(!btn){log("❌ Button not found","error");}else{log("✅ Button found","success");}

function getWallet(){
  const w=window;
  if(w.solana?.isPhantom) return {provider:w.solana,name:"Phantom"};
  if(w.solflare?.isSolflare) return {provider:w.solflare,name:"Solflare"};
  return null;
}

async function sendPayment(){
  log("🖱️ Button clicked");
  const wallet=getWallet();
  if(!wallet){log("❌ No wallet","error");alert("Install Phantom or Solflare");return;}
  const {provider,name}=wallet;
  const recipient=btn.dataset.recipient;
  const amount=parseFloat(btn.dataset.amount||"0.01");
  const rpc=btn.dataset.rpc;
  const reference=btn.dataset.reference;
  const userId=btn.dataset.userid;
  const BOT_URL = "https://sunolabs-bot.onrender.com/confirm-payment;

  try{
    await provider.connect();
    log("🔗 Connected to "+(provider.publicKey?.toBase58?.()||"unknown"),"success");
    const conn=new Connection(rpc,"confirmed");
    const ix=SystemProgram.transfer({
      fromPubkey:provider.publicKey,
      toPubkey:new PublicKey(recipient),
      lamports:Math.floor(amount*LAMPORTS_PER_SOL)
    });
    const tx=new Transaction().add(ix);
    tx.feePayer=provider.publicKey;
    tx.recentBlockhash=(await conn.getLatestBlockhash()).blockhash;
    if(reference){
      const refKey=new PublicKey(reference);
      tx.instructions[0].keys.push({pubkey:refKey,isSigner:false,isWritable:false});
      log("🔖 Added reference "+reference);
    }
    log("✍️ Signing…");
    const signed=await provider.signTransaction(tx);
    const sig=await conn.sendRawTransaction(signed.serialize());
    log("📡 Sent "+sig);
    await conn.confirmTransaction(sig,"confirmed");
    log("✅ Confirmed "+sig,"success");
    alert("✅ Payment sent!\\nSignature: "+sig);

    // ✅ Instantly notify your Telegram bot
    fetch(BOT_URL,{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({signature:sig,reference,userId,amount})
    }).then(()=>log("📨 Notified bot","success")).catch(err=>log("⚠️ Notify failed: "+err.message,"error"));

  }catch(e){
    log("❌ "+(e.message||e),"error");
    alert("❌ "+(e.message||e));
  }
}

if(btn){
  btn.addEventListener("click",ev=>{ev.preventDefault();sendPayment();},{passive:true});
  log("✅ Click handler attached","success");
}
`);
});

// === START SERVER ===
app.listen(PORT, () => {
  console.log(`✅ SunoLabs Redirect running on port ${PORT}`);
});

