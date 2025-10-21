import express from "express";
const app = express();
const PORT = process.env.PORT || 10000;

app.use(express.json());

// === CONFIG ===
const RPC_URL =
  process.env.SOLANA_RPC_URL ||
  "https://mainnet.helius-rpc.com/?api-key=f6691497-4961-41e1-9a08-53f30c65bf43";

const BOT_CONFIRM_URL =
  process.env.BOT_CONFIRM_URL || "https://sunolabs-bot.onrender.com/confirm-payment";

// === HEALTH CHECK ===
app.get("/", (_, res) => {
  res.json({
    status: "✅ SunoLabs Redirect is live!",
    endpoints: {
      pay: "/pay?recipient=...&amount=...&reference=...&userId=...",
      log: "/log (POST)",
    },
    uptime: process.uptime(),
  });
});

// === CLIENT → SERVER LOGGING ===
app.post("/log", (req, res) => {
  const { event, detail } = req.body || {};
  console.log(`🟣 [CLIENT] ${event || "event"}: ${detail || "no details"}`);
  res.sendStatus(200);
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

  if (!recipient) {
    return res.status(400).send("❌ Missing recipient address");
  }

  const esc = (s = "") =>
    String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.send(`<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>SunoLabs Pay</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{background:#0a0a0a;color:#fff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;text-align:center;padding:80px 20px;margin:0;min-height:100vh}
  .container{max-width:600px;margin:0 auto}
  h2{margin:0 0 12px;font-size:28px}
  p{margin:8px 0;line-height:1.6}
  button{background:#9945ff;border:none;border-radius:12px;padding:16px 32px;font-size:18px;color:#fff;cursor:pointer;margin-top:24px;transition:.2s;font-weight:600;box-shadow:0 4px 12px rgba(153,69,255,.3)}
  button:hover:not(:disabled){background:#7e2fff;transform:translateY(-2px);box-shadow:0 6px 16px rgba(153,69,255,.4)}
  button:disabled{opacity:.6;cursor:not-allowed}
  .info{margin-top:24px;color:#aaa;font-size:14px}
  #debug{margin-top:32px;padding:16px;background:#1a1a1a;border-radius:12px;font-size:12px;color:#888;text-align:left;font-family:'Courier New',monospace;max-height:300px;overflow-y:auto;border:1px solid #333}
  .log-success{color:#4ade80}.log-error{color:#ff6b6b}.log-info{color:#60a5fa}.log-warn{color:#fbbf24}
  .debug-header{color:#60a5fa;margin-bottom:12px;font-weight:600;font-size:13px}
  .amount-display{font-size:36px;font-weight:700;color:#9945ff;margin:16px 0}
  .detail{color:#999;font-size:13px;margin:4px 0}
</style>
</head>
<body>
  <div class="container">
    <h2>💸 SunoLabs Entry Payment</h2>
    <div class="amount-display">${esc(amount)} SOL</div>
    <p class="detail">${esc(label)}</p>
    <p>${esc(message)}</p>

    <button id="sendBtn"
      data-recipient="${esc(recipient)}"
      data-amount="${esc(amount)}"
      data-rpc="${esc(RPC_URL)}"
      data-reference="${esc(reference)}"
      data-userid="${esc(userId)}"
      data-bot-url="${esc(BOT_CONFIRM_URL)}"
    >💳 Connect Wallet & Pay</button>

    <p class="info">Compatible with Phantom, Solflare & other Solana wallets</p>
    <div id="debug"><div class="debug-header">📋 Debug Console</div></div>
  </div>

  <script type="module" src="/app.js"></script>
  <noscript style="color:#ff6b6b;display:block;margin-top:20px">⚠️ JavaScript is required for this payment page</noscript>
</body>
</html>`);
});

// === APP MODULE ===
app.get("/app.js", (req, res) => {
  res.setHeader("Content-Type", "application/javascript; charset=utf-8");
  res.send(`
const dbg = document.getElementById("debug");
const btn = document.getElementById("sendBtn");
let processing = false;

function log(msg, type="info"){
  const cls = {error:"log-error",success:"log-success",warn:"log-warn"}[type] || "log-info";
  const t = new Date().toLocaleTimeString();
  if(dbg){
    dbg.innerHTML += \`<div class="\${cls}">\${t} - \${msg}</div>\`;
    dbg.scrollTop = dbg.scrollHeight;
  }
  console[type==="error"?"error":"log"](msg);
  fetch("/log",{
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({event:type,detail:msg})
  }).catch(()=>{});
}

log("🟢 Payment page loaded");

// Load Solana Web3.js
let Connection, PublicKey, SystemProgram, Transaction, LAMPORTS_PER_SOL;
try {
  const w3 = await import("https://esm.sh/@solana/web3.js@1.95.8");
  ({ Connection, PublicKey, SystemProgram, Transaction, LAMPORTS_PER_SOL } = w3);
  log("✅ Solana Web3.js loaded","success");
} catch(e){
  log("❌ Failed to load web3.js: "+e.message,"error");
}

if(!btn){
  log("❌ Button not found","error");
}else{
  log("✅ Button ready","success");
}

function getWallet(){
  const w = window;
  if(w.solana?.isPhantom) return {provider:w.solana,name:"Phantom"};
  if(w.solflare?.isSolflare) return {provider:w.solflare,name:"Solflare"};
  if(w.backpack?.isBackpack) return {provider:w.backpack,name:"Backpack"};
  return null;
}

async function sendPayment(){
  if(processing){
    log("⚠️ Payment already in progress","warn");
    return;
  }
  
  processing = true;
  btn.disabled = true;
  btn.textContent = "⏳ Processing...";
  
  log("🖱️ Payment initiated");
  
  const wallet = getWallet();
  if(!wallet){
    log("❌ No wallet detected","error");
    alert("Please install Phantom, Solflare, or Backpack wallet");
    processing = false;
    btn.disabled = false;
    btn.textContent = "💳 Connect Wallet & Pay";
    return;
  }
  
  const {provider,name} = wallet;
  const recipient = btn.dataset.recipient;
  const amount = parseFloat(btn.dataset.amount || "0.01");
  const rpc = btn.dataset.rpc;
  const reference = btn.dataset.reference;
  const userId = btn.dataset.userid;
  const botUrl = btn.dataset.botUrl;

  try{
    log(\`🔌 Connecting to \${name}...\`);
    await provider.connect();
    const userPubkey = provider.publicKey?.toBase58?.() || "unknown";
    log(\`🔗 Connected: \${userPubkey.substring(0,8)}...\`,"success");
    
    const conn = new Connection(rpc,"confirmed");
    
    log("📝 Building transaction...");
    const ix = SystemProgram.transfer({
      fromPubkey: provider.publicKey,
      toPubkey: new PublicKey(recipient),
      lamports: Math.floor(amount * LAMPORTS_PER_SOL)
    });
    
    const tx = new Transaction().add(ix);
    tx.feePayer = provider.publicKey;
    
    log("⏳ Fetching blockhash...");
    const {blockhash} = await conn.getLatestBlockhash();
    tx.recentBlockhash = blockhash;
    
    if(reference){
      const refKey = new PublicKey(reference);
      tx.instructions[0].keys.push({
        pubkey: refKey,
        isSigner: false,
        isWritable: false
      });
      log(\`🔖 Reference: \${reference.substring(0,8)}...\`);
    }
    
    log("✍️ Requesting signature...");
    btn.textContent = "✍️ Sign in wallet...";
    const signed = await provider.signTransaction(tx);
    
    log("📡 Sending transaction...");
    btn.textContent = "📡 Sending...";
    const sig = await conn.sendRawTransaction(signed.serialize());
    log(\`📤 Signature: \${sig.substring(0,8)}...\`,"success");
    
    log("⏳ Confirming...");
    btn.textContent = "⏳ Confirming...";
    await conn.confirmTransaction(sig,"confirmed");
    log("✅ Transaction confirmed!","success");
    
    // Notify backend with sender wallet address
    log("📨 Notifying bot...");
    await fetch(botUrl,{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({
        signature:sig,
        reference,
        userId,
        amount,
        senderWallet: userPubkey // Send the user's wallet address
      })
    });
    log("✅ Bot notified successfully","success");
    
    btn.textContent = "✅ Payment Complete!";
    btn.style.background = "#4ade80";
    alert(\`✅ Payment sent successfully!\\n\\nYour wallet (\${userPubkey.substring(0,8)}...) will receive winnings if you win!\\n\\nSignature: \${sig.substring(0,8)}...\`);
    
  }catch(e){
    log("❌ "+(e.message||e),"error");
    alert("❌ Payment failed: "+(e.message||e));
    processing = false;
    btn.disabled = false;
    btn.textContent = "💳 Connect Wallet & Pay";
  }
}

if(btn){
  btn.addEventListener("click",ev=>{ev.preventDefault();sendPayment();},{passive:true});
  log("✅ Click handler attached","success");
}
`);
}); No wallet detected","error");
    alert("Please install Phantom, Solflare, or Backpack wallet");
    processing = false;
    btn.disabled = false;
    btn.textContent = "💳 Connect Wallet & Pay";
    return;
  }
  
  const {provider,name} = wallet;
  const recipient = btn.dataset.recipient;
  const amount = parseFloat(btn.dataset.amount || "0.01");
  const rpc = btn.dataset.rpc;
  const reference = btn.dataset.reference;
  const userId = btn.dataset.userid;
  const botUrl = btn.dataset.botUrl;

  try{
    log(\`🔌 Connecting to \${name}...\`);
    await provider.connect();
    const userPubkey = provider.publicKey?.toBase58?.() || "unknown";
    log(\`🔗 Connected: \${userPubkey.substring(0,8)}...\`,"success");
    
    const conn = new Connection(rpc,"confirmed");
    
    log("📝 Building transaction...");
    const ix = SystemProgram.transfer({
      fromPubkey: provider.publicKey,
      toPubkey: new PublicKey(recipient),
      lamports: Math.floor(amount * LAMPORTS_PER_SOL)
    });
    
    const tx = new Transaction().add(ix);
    tx.feePayer = provider.publicKey;
    
    log("⏳ Fetching blockhash...");
    const {blockhash} = await conn.getLatestBlockhash();
    tx.recentBlockhash = blockhash;
    
    if(reference){
      const refKey = new PublicKey(reference);
      tx.instructions[0].keys.push({
        pubkey: refKey,
        isSigner: false,
        isWritable: false
      });
      log(\`🔖 Reference: \${reference.substring(0,8)}...\`);
    }
    
    log("✍️ Requesting signature...");
    btn.textContent = "✍️ Sign in wallet...";
    const signed = await provider.signTransaction(tx);
    
    log("📡 Sending transaction...");
    btn.textContent = "📡 Sending...";
    const sig = await conn.sendRawTransaction(signed.serialize());
    log(\`📤 Signature: \${sig.substring(0,8)}...\`,"success");
    
    log("⏳ Confirming...");

