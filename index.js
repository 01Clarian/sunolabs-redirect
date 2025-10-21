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
  .amount-selector{margin:24px 0;padding:20px;background:#1a1a1a;border-radius:12px;border:1px solid #333}
  .amount-option{display:flex;align-items:center;justify-content:space-between;padding:12px;margin:8px 0;background:#0a0a0a;border:2px solid #333;border-radius:8px;cursor:pointer;transition:.2s}
  .amount-option:hover{border-color:#9945ff;background:#1a1a2a}
  .amount-option.selected{border-color:#9945ff;background:#1a1a2a}
  .amount-option input[type="radio"]{margin-right:12px}
  .amount-label{flex:1;text-align:left;font-size:16px;font-weight:600}
  .amount-bonus{font-size:13px;color:#4ade80;margin-top:4px}
  .custom-amount{margin-top:16px;padding:12px;background:#0a0a0a;border-radius:8px}
  .custom-amount input{width:100%;padding:12px;background:#1a1a1a;border:2px solid #333;border-radius:8px;color:#fff;font-size:16px}
  .custom-amount input:focus{outline:none;border-color:#9945ff}
  .wallet-selector{margin:20px 0;padding:16px;background:#1a1a1a;border-radius:12px;border:1px solid #333}
  .wallet-option{display:flex;align-items:center;padding:12px;margin:8px 0;background:#0a0a0a;border:2px solid #333;border-radius:8px;cursor:pointer;transition:.2s}
  .wallet-option:hover{border-color:#9945ff;background:#1a1a2a}
  .wallet-option.selected{border-color:#9945ff;background:#1a1a2a}
  .wallet-option.disabled{opacity:0.5;cursor:not-allowed}
  .wallet-icon{font-size:24px;margin-right:12px}
  .wallet-name{font-weight:600;font-size:16px}
  .wallet-status{font-size:12px;color:#4ade80;margin-left:auto}
  button{background:#9945ff;border:none;border-radius:12px;padding:16px 32px;font-size:18px;color:#fff;cursor:pointer;margin-top:24px;transition:.2s;font-weight:600;box-shadow:0 4px 12px rgba(153,69,255,.3);width:100%}
  button:hover:not(:disabled){background:#7e2fff;transform:translateY(-2px);box-shadow:0 6px 16px rgba(153,69,255,.4)}
  button:disabled{opacity:.6;cursor:not-allowed}
  .info{margin-top:24px;color:#aaa;font-size:14px}
  #debug{margin-top:32px;padding:16px;background:#1a1a1a;border-radius:12px;font-size:12px;color:#888;text-align:left;font-family:'Courier New',monospace;max-height:300px;overflow-y:auto;border:1px solid #333}
  .log-success{color:#4ade80}.log-error{color:#ff6b6b}.log-info{color:#60a5fa}.log-warn{color:#fbbf24}
  .debug-header{color:#60a5fa;margin-bottom:12px;font-weight:600;font-size:13px}
  .detail{color:#999;font-size:13px;margin:4px 0}
  .helper-text{font-size:12px;color:#888;margin-top:8px}
</style>
</head>
<body>
  <div class="container">
    <h2>💸 SunoLabs Entry Payment</h2>
    <p class="detail">${esc(label)}</p>
    <p>${esc(message)}</p>

    <div class="wallet-selector" id="walletSelector">
      <p style="margin-bottom:12px;font-weight:600;">Select your wallet:</p>
      <div id="walletOptions"></div>
    </div>

    <div class="amount-selector">
      <p style="margin-bottom:16px;font-weight:600;">Choose your entry amount:</p>
      
      <label class="amount-option selected" id="option-basic">
        <input type="radio" name="amount" value="0.01" checked>
        <div>
          <div class="amount-label">0.01 SOL - Basic Entry</div>
          <div class="helper-text">Standard entry with 1x winnings</div>
        </div>
      </label>

      <label class="amount-option" id="option-supporter">
        <input type="radio" name="amount" value="0.05">
        <div>
          <div class="amount-label">0.05 SOL - Supporter 💎</div>
          <div class="amount-bonus">+5% winnings bonus • Supporter badge</div>
          <div class="helper-text">0.04 SOL donated to treasury</div>
        </div>
      </label>

      <label class="amount-option" id="option-patron">
        <input type="radio" name="amount" value="0.10">
        <div>
          <div class="amount-label">0.10 SOL - Patron 👑</div>
          <div class="amount-bonus">+10% winnings bonus • Patron badge</div>
          <div class="helper-text">0.09 SOL donated to treasury</div>
        </div>
      </label>

      <div class="custom-amount">
        <label>
          <div style="margin-bottom:8px;font-size:14px;color:#aaa;">Custom amount (min 0.01):</div>
          <input type="number" id="customAmount" min="0.01" step="0.01" placeholder="Enter custom SOL amount">
        </label>
      </div>
    </div>

    <button id="sendBtn"
      data-recipient="${esc(recipient)}"
      data-rpc="${esc(RPC_URL)}"
      data-reference="${esc(reference)}"
      data-userid="${esc(userId)}"
      data-bot-url="${esc(BOT_CONFIRM_URL)}"
    >💳 Connect Wallet & Pay</button>

    <p class="info">Compatible with Phantom, Solflare & other Solana wallets</p>
    <div id="debug"><div class="debug-header">📋 Debug Console</div></div>
  </div>

  <script>
    // Detect and display available wallets
    let selectedWallet = null;

    function detectWallets() {
      const wallets = [];
      const w = window;
      
      if (w.phantom?.solana?.isPhantom) {
        wallets.push({ name: 'Phantom', icon: '👻', provider: w.phantom.solana, key: 'phantom' });
      }
      if (w.solflare?.isSolflare) {
        wallets.push({ name: 'Solflare', icon: '🔆', provider: w.solflare, key: 'solflare' });
      }
      if (w.backpack?.isBackpack) {
        wallets.push({ name: 'Backpack', icon: '🎒', provider: w.backpack, key: 'backpack' });
      }
      if (w.okxwallet?.solana) {
        wallets.push({ name: 'OKX Wallet', icon: '⭕', provider: w.okxwallet.solana, key: 'okx' });
      }
      
      return wallets;
    }

    function renderWalletOptions() {
      const wallets = detectWallets();
      const container = document.getElementById('walletOptions');
      
      if (wallets.length === 0) {
        container.innerHTML = '<p style="color:#ff6b6b;text-align:center;">No Solana wallets detected. Please install Phantom, Solflare, or another wallet.</p>';
        return;
      }

      wallets.forEach((wallet, index) => {
        const option = document.createElement('div');
        option.className = 'wallet-option' + (index === 0 ? ' selected' : '');
        option.innerHTML = \`
          <span class="wallet-icon">\${wallet.icon}</span>
          <span class="wallet-name">\${wallet.name}</span>
          <span class="wallet-status">✓ Detected</span>
        \`;
        option.onclick = () => {
          document.querySelectorAll('.wallet-option').forEach(o => o.classList.remove('selected'));
          option.classList.add('selected');
          selectedWallet = wallet;
        };
        container.appendChild(option);
        
        // Auto-select first wallet
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

    // Render wallets on page load
    renderWalletOptions();

    // Amount selection handling
    document.querySelectorAll('.amount-option').forEach(opt => {
      opt.addEventListener('click', () => {
        document.querySelectorAll('.amount-option').forEach(o => o.classList.remove('selected'));
        opt.classList.add('selected');
        opt.querySelector('input').checked = true;
        document.getElementById('customAmount').value = '';
      });
    });

    document.getElementById('customAmount').addEventListener('input', (e) => {
      if (e.target.value) {
        document.querySelectorAll('.amount-option').forEach(o => {
          o.classList.remove('selected');
          o.querySelector('input').checked = false;
        });
      }
    });

    function getSelectedAmount() {
      const custom = document.getElementById('customAmount').value;
      if (custom && parseFloat(custom) >= 0.01) {
        return parseFloat(custom);
      }
      const selected = document.querySelector('input[name="amount"]:checked');
      return selected ? parseFloat(selected.value) : 0.01;
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

if(!btn){
  log("❌ Button not found","error");
}else{
  log("✅ Button ready","success");
}

function getWallet(){
  const selected = getSelectedWallet();
  if (!selected) return null;
  return { provider: selected.provider, name: selected.name };
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
  const amount = getSelectedAmount(); // Use selected amount
  const rpc = btn.dataset.rpc;
  const reference = btn.dataset.reference;
  const userId = btn.dataset.userid;
  const botUrl = btn.dataset.botUrl;

  log(\`💰 Selected amount: \${amount} SOL\`);

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
        senderWallet: userPubkey
      })
    });
    log("✅ Bot notified successfully","success");
    
    btn.textContent = "✅ Payment Complete!";
    btn.style.background = "#4ade80";
    
    let bonusMsg = "";
    if (amount >= 0.10) {
      bonusMsg = "\\n\\n👑 Patron status unlocked! +10% winnings if you win!";
    } else if (amount >= 0.05) {
      bonusMsg = "\\n\\n💎 Supporter status unlocked! +5% winnings if you win!";
    }
    
    alert(\`✅ Payment sent successfully!\\n\\nAmount: \${amount} SOL\\nWallet: \${userPubkey.substring(0,8)}...\\nSignature: \${sig.substring(0,8)}...\${bonusMsg}\`);
    
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
});

// === START SERVER ===
app.listen(PORT, () => {
  console.log(`✅ SunoLabs Redirect running on port ${PORT}`);
});
