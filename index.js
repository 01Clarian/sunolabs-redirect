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
    status: "✅ SunoLabs Token Rewards is live!",
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
    amount = "0.02",
    label = "SunoLabs Token + Entry",
    message = "Buy tokens & enter competition",
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
<title>SunoLabs Token Purchase</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{background:#0a0a0a;color:#fff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;text-align:center;padding:80px 20px;margin:0;min-height:100vh}
  .container{max-width:600px;margin:0 auto}
  h2{margin:0 0 12px;font-size:28px}
  p{margin:8px 0;line-height:1.6}
  .token-info{margin:20px 0;padding:20px;background:#1a1a1a;border-radius:12px;border:1px solid #4ade80}
  .token-info h3{color:#4ade80;margin-bottom:12px;font-size:18px}
  .token-detail{text-align:left;margin:8px 0;padding:8px;background:#0a0a0a;border-radius:6px;font-size:14px}
  .amount-selector{margin:24px 0;padding:20px;background:#1a1a1a;border-radius:12px;border:1px solid #333}
  .amount-option{display:flex;align-items:flex-start;justify-content:space-between;padding:16px;margin:12px 0;background:#0a0a0a;border:2px solid #333;border-radius:8px;cursor:pointer;transition:.2s}
  .amount-option:hover{border-color:#9945ff;background:#1a1a2a}
  .amount-option.selected{border-color:#9945ff;background:#1a1a2a;box-shadow:0 0 20px rgba(153,69,255,.3)}
  .amount-option input[type="radio"]{margin-right:12px;margin-top:4px}
  .option-content{flex:1;text-align:left}
  .amount-label{font-size:18px;font-weight:700;margin-bottom:8px}
  .token-amount{font-size:16px;color:#4ade80;margin:6px 0;font-weight:600}
  .amount-bonus{font-size:14px;color:#60a5fa;margin:4px 0}
  .breakdown{font-size:12px;color:#888;margin-top:8px;padding-top:8px;border-top:1px solid #333}
  .breakdown-item{margin:2px 0}
  .wallet-selector{margin:20px 0;padding:16px;background:#1a1a1a;border-radius:12px;border:1px solid #333}
  .wallet-option{display:flex;align-items:center;padding:12px;margin:8px 0;background:#0a0a0a;border:2px solid #333;border-radius:8px;cursor:pointer;transition:.2s}
  .wallet-option:hover{border-color:#9945ff;background:#1a1a2a}
  .wallet-option.selected{border-color:#9945ff;background:#1a1a2a}
  .wallet-icon{font-size:24px;margin-right:12px}
  .wallet-name{font-weight:600;font-size:16px}
  .wallet-status{font-size:12px;color:#4ade80;margin-left:auto}
  button{background:#9945ff;border:none;border-radius:12px;padding:16px 32px;font-size:18px;color:#fff;cursor:pointer;margin-top:24px;transition:.2s;font-weight:600;box-shadow:0 4px 12px rgba(153,69,255,.3);width:100%}
  button:hover:not(:disabled){background:#7e2fff;transform:translateY(-2px);box-shadow:0 6px 16px rgba(153,69,255,.4)}
  button:disabled{opacity:.6;cursor:not-allowed}
  .info{margin-top:24px;color:#aaa;font-size:14px}
  .legal-notice{margin-top:16px;padding:12px;background:#1a1a1a;border-radius:8px;font-size:11px;color:#666;line-height:1.4}
  #debug{margin-top:32px;padding:16px;background:#1a1a1a;border-radius:12px;font-size:12px;color:#888;text-align:left;font-family:'Courier New',monospace;max-height:300px;overflow-y:auto;border:1px solid #333}
  .log-success{color:#4ade80}.log-error{color:#ff6b6b}.log-info{color:#60a5fa}.log-warn{color:#fbbf24}
  .debug-header{color:#60a5fa;margin-bottom:12px;font-weight:600;font-size:13px}
</style>
</head>
<body>
  <div class="container">
    <h2>🪙 Buy SUNO Tokens + Enter Competition</h2>
    <p>Purchase tokens you keep forever + enter this round's competition</p>

    <div class="token-info">
      <h3>✨ What You Get</h3>
      <div class="token-detail">🪙 Real SUNO tokens sent to your wallet</div>
      <div class="token-detail">🏆 Entry in this round's competition</div>
      <div class="token-detail">💰 Passive SOL rewards every round</div>
      <div class="token-detail">🎖️ Status badge & prize multipliers</div>
    </div>

    <div class="wallet-selector" id="walletSelector">
      <p style="margin-bottom:12px;font-weight:600;">Select your wallet:</p>
      <div id="walletOptions"></div>
    </div>

    <div class="amount-selector">
      <p style="margin-bottom:16px;font-weight:600;">Choose your tier:</p>
      
      <label class="amount-option selected" id="option-basic">
        <input type="radio" name="amount" value="0.02" checked>
        <div class="option-content">
          <div class="amount-label">Basic Participant</div>
          <div class="token-amount">🪙 ~100 SUNO tokens</div>
          <div class="amount-bonus">• 1.0x competition prizes</div>
          <div class="amount-bonus">• Passive SOL rewards</div>
          <div class="breakdown">
            <div class="breakdown-item">💳 Total: 0.02 SOL</div>
            <div class="breakdown-item">├─ ~0.01 SOL → SUNO tokens (yours!)</div>
            <div class="breakdown-item">└─ ~0.01 SOL → Competition entry</div>
          </div>
        </div>
      </label>

      <label class="amount-option" id="option-supporter">
        <input type="radio" name="amount" value="0.10">
        <div class="option-content">
          <div class="amount-label">💎 Supporter</div>
          <div class="token-amount">🪙 ~550 SUNO tokens (+10% bonus!)</div>
          <div class="amount-bonus">• 1.05x competition prizes</div>
          <div class="amount-bonus">• 💎 Supporter badge</div>
          <div class="amount-bonus">• Higher passive rewards</div>
          <div class="breakdown">
            <div class="breakdown-item">💳 Total: 0.10 SOL</div>
            <div class="breakdown-item">├─ ~0.05 SOL → SUNO tokens (yours!)</div>
            <div class="breakdown-item">└─ ~0.05 SOL → Competition entry</div>
          </div>
        </div>
      </label>

      <label class="amount-option" id="option-patron">
        <input type="radio" name="amount" value="0.20">
        <div class="option-content">
          <div class="amount-label">👑 Patron</div>
          <div class="token-amount">🪙 ~1,200 SUNO tokens (+20% bonus!)</div>
          <div class="amount-bonus">• 1.10x competition prizes</div>
          <div class="amount-bonus">• 👑 Patron badge</div>
          <div class="amount-bonus">• Maximum passive rewards</div>
          <div class="amount-bonus">• VIP status</div>
          <div class="breakdown">
            <div class="breakdown-item">💳 Total: 0.20 SOL</div>
            <div class="breakdown-item">├─ ~0.10 SOL → SUNO tokens (yours!)</div>
            <div class="breakdown-item">└─ ~0.10 SOL → Competition entry</div>
          </div>
        </div>
      </label>
    </div>

    <button id="sendBtn"
      data-recipient="${esc(recipient)}"
      data-rpc="${esc(RPC_URL)}"
      data-reference="${esc(reference)}"
      data-userid="${esc(userId)}"
      data-bot-url="${esc(BOT_CONFIRM_URL)}"
    >💳 Buy Tokens & Enter Competition</button>

    <p class="info">Compatible with Phantom, Solflare & other Solana wallets</p>
    
    <div class="legal-notice">
      ⚖️ Legal: You are purchasing SUNO tokens (CA: 4vTeHaoJGvrKduJrxVmfgkjzDYPzD8BJJDv5Afempump) which will be sent to your connected wallet. Token purchase includes entry into a skill-based music competition. Winners determined by community voting. Token holders earn passive SOL rewards from future rounds. Not gambling or lottery. Tokens are tradeable assets.
    </div>
    
    <div id="debug"><div class="debug-header">📋 Debug Console</div></div>
  </div>

  <script>
    let selectedWallet = null;

    function detectWallets() {
      const wallets = [];
      if (window.phantom?.solana?.isPhantom) wallets.push({ name: 'Phantom', icon: '👻', provider: window.phantom.solana });
      if (window.solflare?.isSolflare) wallets.push({ name: 'Solflare', icon: '🔆', provider: window.solflare });
      if (window.backpack?.isBackpack) wallets.push({ name: 'Backpack', icon: '🎒', provider: window.backpack });
      if (window.okxwallet?.solana) wallets.push({ name: 'OKX Wallet', icon: '⭕', provider: window.okxwallet.solana });
      return wallets;
    }

    function renderWalletOptions() {
      const wallets = detectWallets();
      const container = document.getElementById('walletOptions');
      if (!container) return;
      
      if (wallets.length === 0) {
        container.innerHTML = '<p style="color:#ff6b6b;text-align:center;">No Solana wallets detected</p>';
        return;
      }

      container.innerHTML = '';
      wallets.forEach((wallet, index) => {
        const div = document.createElement('div');
        div.className = 'wallet-option' + (index === 0 ? ' selected' : '');
        div.innerHTML = '<span class="wallet-icon">' + wallet.icon + '</span><span class="wallet-name">' + wallet.name + '</span><span class="wallet-status">✓ Detected</span>';
        div.onclick = function() {
          document.querySelectorAll('.wallet-option').forEach(function(o) { o.classList.remove('selected'); });
          div.classList.add('selected');
          selectedWallet = wallet;
        };
        container.appendChild(div);
        if (index === 0) selectedWallet = wallet;
      });
    }

    function getSelectedWallet() {
      if (!selectedWallet) {
        const wallets = detectWallets();
        return wallets.length > 0 ? wallets[0] : null;
      }
      return selectedWallet;
    }

    function getWallet() {
      const selected = getSelectedWallet();
      return selected ? { provider: selected.provider, name: selected.name } : null;
    }

    renderWalletOptions();

    document.querySelectorAll('.amount-option').forEach(function(opt) {
      opt.addEventListener('click', function() {
        document.querySelectorAll('.amount-option').forEach(function(o) { o.classList.remove('selected'); });
        opt.classList.add('selected');
        opt.querySelector('input').checked = true;
      });
    });

    function getSelectedAmount() {
      const selected = document.querySelector('input[name="amount"]:checked');
      return selected ? parseFloat(selected.value) : 0.02;
    }
  </script>
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
    btn.textContent = "💳 Buy Tokens & Enter Competition";
    return;
  }
  
  const {provider,name} = wallet;
  const recipient = btn.dataset.recipient;
  const amount = getSelectedAmount();
  const rpc = btn.dataset.rpc;
  const reference = btn.dataset.reference;
  const userId = btn.dataset.userid;
  const botUrl = btn.dataset.botUrl;

  log(\`💰 Selected amount: \${amount} SOL (SUNO tokens will be calculated and sent by bot)\`);

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
    
    log("📨 Notifying bot...");
    await fetch(botUrl,{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({
        signature:sig,
        reference,
        userId,
        amount,
        senderWallet: userPubkey
      })
    });
    log("✅ Bot notified successfully","success");
    
    btn.textContent = "✅ Purchase Complete!";
    btn.style.background = "#4ade80";
    
    let tierMsg = "";
    if (amount >= 0.20) {
      tierMsg = "\\n\\n👑 Patron tier unlocked!\\n• ~1,200 SUNO tokens\\n• 1.10x prizes if you win\\n• VIP status\\n• Maximum passive rewards";
    } else if (amount >= 0.10) {
      tierMsg = "\\n\\n💎 Supporter tier unlocked!\\n• ~550 SUNO tokens\\n• 1.05x prizes if you win\\n• Higher passive rewards";
    } else {
      tierMsg = "\\n\\n🎵 Basic tier unlocked!\\n• ~100 SUNO tokens\\n• Competition entry\\n• Passive rewards";
    }
    
    alert(\`✅ Purchase successful!\\n\\n💰 Paid: \${amount} SOL\\n🪙 SUNO tokens being sent to your wallet!\\n🏆 Competition: Entered\\n\\nWallet: \${userPubkey.substring(0,8)}...\${tierMsg}\\n\\nCheck your wallet for SUNO tokens!\\n(CA: 4vTeHao...empump)\\n\\nThis tab will close in 3 seconds...\`);
    
    setTimeout(() => {
      window.close();
      setTimeout(() => {
        window.location.href = 'https://t.me/sunolabs';
      }, 500);
    }, 3000);
    
  }catch(e){
    log("❌ "+(e.message||e),"error");
    alert("❌ Payment failed: "+(e.message||e));
    processing = false;
    btn.disabled = false;
    btn.textContent = "💳 Buy Tokens & Enter Competition";
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
  console.log(`✅ SunoLabs Token Rewards running on port ${PORT}`);
});
