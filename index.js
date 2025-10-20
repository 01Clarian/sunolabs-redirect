import express from "express";
const app = express();
const PORT = process.env.PORT || 10000;

const RPC_URL =
  process.env.SOLANA_RPC_URL ||
  "https://rpc.ankr.com/solana"; // you can swap to Helius later

app.get("/", (req, res) => {
  res.send("✅ SunoLabs Redirect is live! Use /pay?recipient=...&amount=...");
});

app.get("/pay", (req, res) => {
  const { recipient, amount = "0.01", label = "SunoLabs Entry", message = "Confirm your submission" } = req.query;
  if (!recipient) return res.status(400).send("Missing recipient");

  // escape everything safely
  const esc = (s = "") =>
    String(s)
      .replace(/\\/g, "\\\\")
      .replace(/`/g, "\\`")
      .replace(/\$/g, "\\$")
      .replace(/"/g, "&quot;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>SunoLabs Pay</title>
<style>
body{background:#0a0a0a;color:#fff;font-family:sans-serif;text-align:center;padding:80px 20px}
button{background:#9945ff;border:none;border-radius:8px;padding:14px 28px;font-size:16px;color:#fff;cursor:pointer;margin-top:20px}
button:hover{background:#7e2fff}
#debug{margin-top:30px;padding:15px;background:#1a1a1a;border-radius:8px;font-size:11px;color:#888;text-align:left;max-width:520px;margin-left:auto;margin-right:auto;font-family:monospace;max-height:280px;overflow-y:auto}
.log-success{color:#4ade80}.log-error{color:#ff6b6b}.log-info{color:#60a5fa}
</style>
</head>
<body>
<h2>💸 Send ${esc(amount)} SOL to SunoLabs</h2>
<p>${esc(label)}<br/>${esc(message)}</p>
<button id="sendBtn">💸 Send with Wallet</button>
<p style="color:#aaa">Compatible with Phantom & Solflare wallets</p>
<div id="debug"><div style="color:#60a5fa;margin-bottom:10px;">📋 Debug Console:</div></div>

<script type="module">
const debugEl=document.getElementById("debug");
function log(m,t="info"){const c=t==="error"?"log-error":t==="success"?"log-success":"log-info";debugEl.innerHTML+=\`<div class="\${c}">\${new Date().toLocaleTimeString()} - \${m}</div>\`;debugEl.scrollTop=debugEl.scrollHeight;console.log(m);}
log("🟢 Page loaded — initializing...");
let Connection,PublicKey,SystemProgram,Transaction,LAMPORTS_PER_SOL;
try{
  const w3=await import("https://esm.sh/@solana/web3.js@1.95.8");
  ({Connection,PublicKey,SystemProgram,Transaction,LAMPORTS_PER_SOL}=w3);
  log("✅ Solana Web3.js loaded","success");
}catch(e){log("❌ Load error: "+e.message,"error");alert("Error loading Solana lib");}

const RPC_URL="${RPC_URL}";
const RECIPIENT="${esc(recipient)}";
const AMOUNT=parseFloat("${esc(amount)}");

function getWallet(){
  const w=window;
  if(w.solana?.isPhantom)return{provider:w.solana,name:"Phantom"};
  if(w.solflare?.isSolflare)return{provider:w.solflare,name:"Solflare"};
  return null;
}

async function sendPayment(){
  log("🖱️ Button clicked","info");
  const w=getWallet();
  if(!w){alert("Install Phantom or Solflare wallet first.");return;}
  const {provider,name}=w;
  log("🟣 Using wallet: "+name);
  try{
    await provider.connect();
    const conn=new Connection(RPC_URL,"confirmed");
    const ix=SystemProgram.transfer({
      fromPubkey:provider.publicKey,
      toPubkey:new PublicKey(RECIPIENT),
      lamports:Math.floor(AMOUNT*LAMPORTS_PER_SOL)
    });
    const tx=new Transaction().add(ix);
    tx.feePayer=provider.publicKey;
    tx.recentBlockhash=(await conn.getLatestBlockhash()).blockhash;
    const signed=await provider.signTransaction(tx);
    const sig=await conn.sendRawTransaction(signed.serialize());
    await conn.confirmTransaction(sig,"confirmed");
    log("✅ Success "+sig,"success");
    alert("✅ Payment sent!\\nSignature: "+sig);
  }catch(e){
    log("❌ "+e.message,"error");
    alert("❌ "+e.message);
  }
}
document.addEventListener("DOMContentLoaded",()=>{const b=document.getElementById("sendBtn");b.onclick=e=>{e.preventDefault();sendPayment();};log("✅ Handler attached","success");});
</script>
</body>
</html>`);
});

app.listen(PORT,()=>console.log(`✅ SunoLabs Redirect running on ${PORT}`));
