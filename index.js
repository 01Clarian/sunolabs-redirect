import express from "express";
const app = express();
const PORT = process.env.PORT || 10000;

app.use(express.json());

const RPC_URL =
  process.env.SOLANA_RPC_URL ||
  "https://mainnet.helius-rpc.com/?api-key=f6691497-4961-41e1-9a08-53f30c65bf43";

const BOT_CONFIRM_URL =
  process.env.BOT_CONFIRM_URL || "https://sunolabs-bot.onrender.com/confirm-payment";

app.get("/", (_, res) => {
  res.json({
    status: "✅ SunoLabs Buy SUNO is live!",
    endpoints: {
      pay: "/pay?recipient=...&amount=...&reference=...&userId=...",
    },
    uptime: process.uptime(),
  });
});

app.post("/log", (req, res) => {
  const { event, detail } = req.body || {};
  console.log(`🟣 [CLIENT] ${event || "event"}: ${detail || "no details"}`);
  res.sendStatus(200);
});

app.get("/pay", (req, res) => {
  const {
    recipient,
    amount = "0.01",
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
<title>Buy SUNO Tokens</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{background:#0a0a0a;color:#fff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;text-align:center;padding:60px 20px;margin:0;min-height:100vh}
  .container{max-width:700px;margin:0 auto}
  h2{margin:0 0 8px;font-size:32px}
  .subtitle{color:#888;margin-bottom:24px;font-size:16px}
  .info-box{margin:20px 0;padding:20px;background:#1a1a1a;border-radius:12px;border:1px solid #4ade80}
  .info-box h3{color:#4ade80;margin-bottom:12px;font-size:18px}
  .info-item{text-align:left;margin:8px 0;padding:8px;background:#0a0a0a;border-radius:6px;font-size:14px}
  .wallet-selector{margin:20px 0;padding:16px;background:#1a1a1a;border-radius:12px;border:1px solid #333}
  .wallet-option{display:flex;align-items:center;padding:12px;margin:8px 0;background:#0a0a0a;border:2px solid #333;border-radius:8px;cursor:pointer;transition:.2s}
  .wallet-option:hover{border-color:#9945ff;background:#1a1a2a}
  .wallet-option.selected{border-color:#9945ff;background:#1a1a2a}
  .wallet-icon{font-size:24px;margin-right:12px}
  .wallet-name{font-weight:600;font-size:16px}
  .wallet-status{font-size:12px;color:#4ade80;margin-left:auto}
  .tier-selector{margin:24px 0}
  .tier-option{padding:20px;margin:12px 0;background:#1a1a1a;border:2px solid #333;border-radius:12px;cursor:pointer;transition:.2s}
  .tier-option:hover{border-color:#9945ff;background:#1a1a2a}
  .tier-option.selected{border-color:#9945ff;background:#1a1a2a;box-shadow:0 0 20px rgba(153,69,255,.3)}
  .tier-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:12px}
  .tier-name{font-size:20px;font-weight:700}
  .tier-badge{font-size:24px}
  .tier-amount{font-size:18px;color:#4ade80;margin:8px 0;font-weight:600}
  .tier-details{font-size:14px;color:#aaa;margin:4px 0}
  .tier-breakdown{margin-top:12px;padding-top:12px;border-top:1px solid #333;font-size:13px;color:#666}
  .tier-breakdown-item{margin:4px 0}
  .whale-input{margin-top:16px;padding:16px;background:#0a0a0a;border-radius:8px}
  .whale-input input{width:100%;padding:12px;background:#1a1a1a;border:2px solid #333;border-radius:8px;color:#fff;font-size:18px}
  .whale-input input:focus{outline:none;border-color:#9945ff}
  .whale-calc{margin-top:12px;padding:12px;background:#1a1a2a;border-radius:6px;font-size:14px}
  button{background:#9945ff;border:none;border-radius:12px;padding:18px 36px;font-size:20px;color:#fff;cursor:pointer;margin-top:28px;transition:.2s;font-weight:700;box-shadow:0 4px 12px rgba(153,69,255,.3);width:100%}
  button:hover:not(:disabled){background:#7e2fff;transform:translateY(-2px);box-shadow:0 6px 16px rgba(153,69,255,.4)}
  button:disabled{opacity:.6;cursor:not-allowed}
  .legal{margin-top:16px;padding:12px;background:#1a1a1a;border-radius:8px;font-size:11px;color:#666;line-height:1.4}
  #debug{margin-top:24px;padding:12px;background:#1a1a1a;border-radius:8px;font-size:11px;color:#888;text-align:left;font-family:'Courier New',monospace;max-height:200px;overflow-y:auto}
  .log-success{color:#4ade80}.log-error{color:#ff6b6b}.log-info{color:#60a5fa}
</style>
</head>
<body>
  <div class="container">
    <h2>🪙 Buy SUNO Tokens</h2>
    <p class="subtitle">Purchase SUNO + Enter Competition</p>

    <div class="info-box">
      <h3>💰 How It Works</h3>
      <div class="info-item">1. Pay SOL → We buy SUNO for you on market</div>
      <div class="info-item">2. You receive SUNO tokens in your wallet</div>
      <div class="info-item">3. Choose: Upload track OR Vote only</div>
      <div class="info-item">4. Win prizes or earn from voting!</div>
    </div>

    <div class="wallet-selector">
      <p style="margin-bottom:12px;font-weight:600;">Connect Wallet:</p>
      <div id="walletOptions"></div>
    </div>

    <div class="tier-selector">
      <p style="margin-bottom:16px;font-weight:600;font-size:18px;">Choose Your Tier:</p>
      
      <div class="tier-option selected" id="tier-basic" onclick="selectTier('basic', 0.01)">
        <div class="tier-header">
          <div class="tier-name">Basic</div>
          <div class="tier-badge">🎵</div>
        </div>
        <div class="tier-amount">0.01 SOL</div>
        <div class="tier-details">• 50% retention • 1.0x prizes</div>
        <div class="tier-breakdown">
          <div class="tier-breakdown-item">Trans fee: 0.001 SOL (10%)</div>
          <div class="tier-breakdown-item">You get: ~0.0045 SOL in SUNO</div>
          <div class="tier-breakdown-item">Competition: 0.0045 SOL</div>
        </div>
      </div>

      <div class="tier-option" id="tier-mid" onclick="selectTier('mid', 0.05)">
        <div class="tier-header">
          <div class="tier-name">Mid Tier</div>
          <div class="tier-badge">💎</div>
        </div>
        <div class="tier-amount">0.05 SOL</div>
        <div class="tier-details">• 55% retention (+5% bonus!) • 1.05x prizes</div>
        <div class="tier-breakdown">
          <div class="tier-breakdown-item">Trans fee: 0.005 SOL (10%)</div>
          <div class="tier-breakdown-item">You get: ~0.02475 SOL in SUNO</div>
          <div class="tier-breakdown-item">Competition: 0.02025 SOL</div>
        </div>
      </div>

      <div class="tier-option" id="tier-high" onclick="selectTier('high', 0.10)">
        <div class="tier-header">
          <div class="tier-name">High Tier</div>
          <div class="tier-badge">👑</div>
        </div>
        <div class="tier-amount">0.10 SOL</div>
        <div class="tier-details">• 60% retention (+10% bonus!) • 1.10x prizes</div>
        <div class="tier-breakdown">
          <div class="tier-breakdown-item">Trans fee: 0.01 SOL (10%)</div>
          <div class="tier-breakdown-item">You get: ~0.054 SOL in SUNO</div>
          <div class="tier-breakdown-item">Competition: 0.036 SOL</div>
        </div>
      </div>

      <div class="tier-option" id="tier-whale" onclick="selectTier('whale', 0.50)">
        <div class="tier-header">
          <div class="tier-name">Whale Mode</div>
          <div class="tier-badge">🐋</div>
        </div>
        <div class="tier-amount">Custom Amount</div>
        <div class="tier-details">• Up to 75% retention! • Up to 1.50x prizes!</div>
        <div class="whale-input">
          <input type="number" id="whaleAmount" min="0.50" step="0.01" placeholder="Enter amount (min 0.50 SOL)" onchange="updateWhaleCalc()">
        </div>
        <div class="whale-calc" id="whaleCalc" style="display:none">
          <div id="whaleRetention"></div>
          <div id="whaleMultiplier"></div>
          <div id="whaleSUNO"></div>
        </div>
      </div>
    </div>

    <button id="sendBtn"
      data-recipient="${esc(recipient)}"
      data-rpc="${esc(RPC_URL)}"
      data-reference="${esc(reference)}"
      data-userid="${esc(userId)}"
      data-bot-url="${esc(BOT_CONFIRM_URL)}"
    >💳 Buy SUNO Tokens</button>

    <div class="legal">
      ⚖️ You are purchasing SUNO tokens on the open market. 10% trans fee applies. Tokens sent to your wallet. Choose to compete or vote. Winners earn SOL prizes. Voters earn from picking winners. Not gambling - skill-based competition.
    </div>

    <div id="debug"></div>
  </div>

  <script>
    let selectedWallet = null;
    let selectedAmount = 0.01;

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
      if (!wallets.length) {
        container.innerHTML = '<p style="color:#ff6b6b;">No wallets detected</p>';
        return;
      }

      container.innerHTML = '';
      wallets.forEach((wallet, index) => {
        const div = document.createElement('div');
        div.className = 'wallet-option' + (index === 0 ? ' selected' : '');
        div.innerHTML = '<span class="wallet-icon">' + wallet.icon + '</span><span class="wallet-name">' + wallet.name + '</span><span class="wallet-status">✓ Detected</span>';
        div.onclick = function() {
          document.querySelectorAll('.wallet-option').forEach(o => o.classList.remove('selected'));
          div.classList.add('selected');
          selectedWallet = wallet;
        };
        container.appendChild(div);
        if (index === 0) selectedWallet = wallet;
      });
    }

    function selectTier(tier, amount) {
      document.querySelectorAll('.tier-option').forEach(o => o.classList.remove('selected'));
      document.getElementById('tier-' + tier).classList.add('selected');
      
      if (tier === 'whale') {
        const input = document.getElementById('whaleAmount');
        selectedAmount = parseFloat(input.value) || 0.50;
        if (selectedAmount < 0.50) selectedAmount = 0.50;
      } else {
        selectedAmount = amount;
        document.getElementById('whaleAmount').value = '';
        document.getElementById('whaleCalc').style.display = 'none';
      }
    }

    function updateWhaleCalc() {
      const amount = parseFloat(document.getElementById('whaleAmount').value) || 0.50;
      selectedAmount = Math.max(0.50, amount);
      
      const retention = amount >= 5 ? 0.75 : (0.65 + ((amount - 0.50) / 4.50) * 0.10);
      const multiplier = amount >= 5 ? 1.50 : (1.15 + ((amount - 0.50) / 4.50) * 0.35);
      const transFee = amount * 0.10;
      const remaining = amount * 0.90;
      const sunoValue = remaining * retention;
      
      document.getElementById('whaleCalc').style.display = 'block';
      document.getElementById('whaleRetention').textContent = 'Retention: ' + (retention * 100).toFixed(0) + '%';
      document.getElementById('whaleMultiplier').textContent = 'Prize multiplier: ' + multiplier.toFixed(2) + 'x';
      document.getElementById('whaleSUNO').textContent = 'SUNO value: ~' + sunoValue.toFixed(4) + ' SOL';
    }

    renderWalletOptions();
  </script>
  <script type="module" src="/app.js"></script>
</body>
</html>`);
});

app.get("/app.js", (req, res) => {
  res.setHeader("Content-Type", "application/javascript; charset=utf-8");
  res.send(`
const dbg = document.getElementById("debug");
const btn = document.getElementById("sendBtn");
let processing = false;

function log(msg, type="info"){
  const cls = {error:"log-error",success:"log-success"}[type] || "log-info";
  const t = new Date().toLocaleTimeString();
  if(dbg) dbg.innerHTML += \`<div class="\${cls}">\${t} - \${msg}</div>\`;
  console.log(msg);
}

log("🟢 Page loaded");

let Connection, PublicKey, SystemProgram, Transaction, LAMPORTS_PER_SOL;
try {
  const w3 = await import("https://esm.sh/@solana/web3.js@1.95.8");
  ({ Connection, PublicKey, SystemProgram, Transaction, LAMPORTS_PER_SOL } = w3);
  log("✅ Web3 loaded", "success");
} catch(e){
  log("❌ Web3 failed: "+e.message, "error");
}

async function sendPayment(){
  if(processing) return;
  
  processing = true;
  btn.disabled = true;
  btn.textContent = "⏳ Processing...";
  
  const wallet = selectedWallet;
  if(!wallet){
    alert("Please install a Solana wallet");
    processing = false;
    btn.disabled = false;
    btn.textContent = "💳 Buy SUNO Tokens";
    return;
  }
  
  const {provider} = wallet;
  const recipient = btn.dataset.recipient;
  const amount = selectedAmount;
  const rpc = btn.dataset.rpc;
  const reference = btn.dataset.reference;
  const userId = btn.dataset.userid;
  const botUrl = btn.dataset.botUrl;

  try{
    await provider.connect();
    const userPubkey = provider.publicKey?.toBase58?.();
    log(\`🔗 Connected: \${userPubkey.substring(0,8)}...\`, "success");
    
    const conn = new Connection(rpc,"confirmed");
    
    const ix = SystemProgram.transfer({
      fromPubkey: provider.publicKey,
      toPubkey: new PublicKey(recipient),
      lamports: Math.floor(amount * LAMPORTS_PER_SOL)
    });
    
    const tx = new Transaction().add(ix);
    tx.feePayer = provider.publicKey;
    
    const {blockhash} = await conn.getLatestBlockhash();
    tx.recentBlockhash = blockhash;
    
    if(reference){
      tx.instructions[0].keys.push({
        pubkey: new PublicKey(reference),
        isSigner: false,
        isWritable: false
      });
    }
    
    btn.textContent = "✍️ Sign in wallet...";
    const signed = await provider.signTransaction(tx);
    
    btn.textContent = "📡 Sending...";
    const sig = await conn.sendRawTransaction(signed.serialize());
    log(\`📤 Tx: \${sig.substring(0,8)}...\`, "success");
    
    btn.textContent = "⏳ Confirming...";
    await conn.confirmTransaction(sig,"confirmed");
    
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
    
    btn.textContent = "✅ Complete!";
    btn.style.background = "#4ade80";
    
    alert(\`✅ Purchase complete!\\n\\n💰 Paid: \${amount} SOL\\n🪙 SUNO being bought for you!\\n\\nCheck Telegram for next steps!\`);
    
    setTimeout(() => {
      window.close();
      setTimeout(() => window.location.href = 'https://t.me/sunolabs', 500);
    }, 2000);
    
  }catch(e){
    log("❌ "+e.message, "error");
    alert("❌ Failed: "+e.message);
    processing = false;
    btn.disabled = false;
    btn.textContent = "💳 Buy SUNO Tokens";
  }
}

if(btn){
  btn.addEventListener("click",ev=>{ev.preventDefault();sendPayment();});
}
`);
});

app.listen(PORT, () => {
  console.log(`✅ SunoLabs Buy SUNO Redirect on port ${PORT}`);
});
