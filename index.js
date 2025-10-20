import express from "express";
const app = express();
const PORT = process.env.PORT || 10000;

app.use(express.json());

const RPC_URL =
  process.env.SOLANA_RPC_URL ||
  "https://mainnet.helius-rpc.com/?api-key=f6691497-4961-41e1-9a08-53f30c65bf43";

app.get("/", (_, res) => {
  res.send("✅ SunoLabs Redirect is live! Use /pay?recipient=...&amount=...");
});

app.post("/log", (req, res) => {
  const { event, detail } = req.body || {};
  console.log(`🟣 [CLIENT LOG] ${event || "event"}: ${detail || "no details"}`);
  res.sendStatus(200);
});

app.get("/pay", (req, res) => {
  const {
    recipient,
    amount = "0.01",
    label = "SunoLabs Entry",
    message = "Confirm your submission",
    reference = "",
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
  >💸 Send with Wallet</button>

  <p class="info">Compatible with Phantom & Solflare wallets</p>

  <div id="debug"><div style="color:#60a5fa;margin-bottom:10px;">📋 Debug Console:</div></div>

  <script type="module" src="/app.js"></script>
</body>
</html>`);
});

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
  try{
    await provider.connect();
    log("🔗 Connected to "+(provider.publicKey?.toBase58?.()||"unknown"),"success");
    const conn=new Connection(rpc,"confirmed");
    const ix=SystemProgram.transfer({fromPubkey:provider.publicKey,toPubkey:new PublicKey(recipient),lamports:Math.floor(amount*LAMPORTS_PER_SOL)});
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
  }catch(e){log("❌ "+(e.message||e),"error");alert("❌ "+(e.message||e));}
}

if(btn){
  btn.addEventListener("click",ev=>{ev.preventDefault();sendPayment();},{passive:true});
  log("✅ Click handler attached","success");
}
`);
});

// ✅ Start server — clean backticks (no escapes)
app.listen(PORT, () => {
  console.log(`✅ SunoLabs Redirect running on port ${PORT}`);
});
