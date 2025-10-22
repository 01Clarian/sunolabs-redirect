import express from "express";
const app = express();
const PORT = process.env.PORT || 10000;

app.use(express.json({ limit: '10kb' }));

const RPC_URL = process.env.SOLANA_RPC_URL;
if (!RPC_URL) {
  throw new Error("❌ SOLANA_RPC_URL environment variable required!");
}

// ========================================
// 🎯 BOT CONFIGURATIONS
// ========================================
const BOT_CONFIGS = {
  sunolabs: {
    name: "SunoLabs",
    displayName: "SUNO LABS",
    token: "SUNO",
    primaryColor: "#9945ff",
    secondaryColor: "#4ade80",
    botUrl: process.env.SUNOLABS_BOT_URL || "https://sunolabs-bot.onrender.com/confirm-payment",
    icon: "🎵",
    description: "Music Competition"
  },
  xposure: {
    name: "Xposure",
    displayName: "XPOSURE",
    token: "XPOSURE",
    primaryColor: "#ff6b6b",
    secondaryColor: "#ffd93d",
    botUrl: process.env.XPOSURE_BOT_URL || "https://xposure-bot.onrender.com/confirm-payment",
    icon: "🎤",
    description: "Music Competition"
  },
  gofundme: {
    name: "GoFundMe Go",
    displayName: "GOFUNDME GO",
    token: "GO",
    primaryColor: "#4ade80",
    secondaryColor: "#60a5fa",
    botUrl: process.env.GOFUNDME_BOT_URL || "https://gofundme-bot.onrender.com/confirm-payment",
    icon: "💰",
    description: "Funding Competition"
  }
};

app.get("/", (_, res) => {
  res.json({
    status: "✅ Shared Competition Payment Service",
    bots: Object.keys(BOT_CONFIGS),
    endpoints: {
      pay: "/pay?bot=sunolabs&recipient=...&amount=...&reference=...&userId=...",
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
    bot = "sunolabs",  // Default to sunolabs if not specified
    recipient,
    amount = "0.01",
    reference = "",
    userId = "",
  } = req.query;

  if (!recipient) {
    return res.status(400).send("❌ Missing recipient address");
  }

  // Get config for this bot
  const config = BOT_CONFIGS[bot] || BOT_CONFIGS.sunolabs;
  const botUrl = config.botUrl;

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
<title>Buy ${config.token} Tokens - ${config.name}</title>
<style>
  :root {
    --primary-color: ${config.primaryColor};
    --secondary-color: ${config.secondaryColor};
  }
  *{box-sizing:border-box;margin:0;padding:0}
  body{background:#0a0a0a;color:#fff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;text-align:center;padding:60px 20px;margin:0;min-height:100vh}
  .container{max-width:700px;margin:0 auto}
  h2{margin:0 0 8px;font-size:32px}
  .subtitle{color:#888;margin-bottom:24px;font-size:16px}
  .info-box{margin:20px 0;padding:20px;background:#1a1a1a;border-radius:12px;border:1px solid var(--secondary-color)}
  .info-box h3{color:var(--secondary-color);margin-bottom:12px;font-size:18px}
  .info-item{text-align:left;margin:8px 0;padding:8px;background:#0a0a0a;border-radius:6px;font-size:14px}
  .wallet-selector{margin:20px 0;padding:16px;background:#1a1a1a;border-radius:12px;border:1px solid #333}
  .wallet-option{display:flex;align-items:center;padding:12px;margin:8px 0;background:#0a0a0a;border:2px solid #333;border-radius:8px;cursor:pointer;transition:.2s}
  .wallet-option:hover{border-color:var(--primary-color);background:#1a1a2a}
  .wallet-option.selected{border-color:var(--primary-color);background:#1a1a2a}
  .wallet-icon{font-size:24px;margin-right:12px}
  .wallet-name{font-weight:600;font-size:16px}
  .wallet-status{font-size:12px;color:var(--secondary-color);margin-left:auto}
  .tier-selector{margin:24px 0}
  .tier-option{padding:20px;margin:12px 0;background:#1a1a1a;border:2px solid #333;border-radius:12px;cursor:pointer;transition:.2s}
  .tier-option:hover{border-color:var(--primary-color);background:#1a1a2a}
  .tier-option.selected{border-color:var(--primary-color);background:#1a1a2a;box-shadow:0 0 20px rgba(153,69,255,.3)}
  .tier-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:12px}
  .tier-name{font-size:20px;font-weight:700}
  .tier-badge{font-size:24px}
  .tier-amount{font-size:18px;color:var(--secondary-color);margin:8px 0;font-weight:600}
  .tier-details{font-size:14px;color:#aaa;margin:4px 0}
  .tier-breakdown{margin-top:12px;padding-top:12px;border-top:1px solid #333;font-size:13px;color:#666}
  .tier-breakdown-item{margin:4px 0}
  .whale-input{margin-top:16px;padding:16px;background:#0a0a0a;border-radius:8px}
  .whale-input input{width:100%;padding:12px;background:#1a1a1a;border:2px solid #333;border-radius:8px;color:#fff;font-size:18px}
  .whale-input input:focus{outline:none;border-color:var(--primary-color)}
  .whale-calc{margin-top:12px;padding:12px;background:#1a1a2a;border-radius:6px;font-size:14px}
  button{background:var(--primary-color);border:none;border-radius:12px;padding:18px 36px;font-size:20px;color:#fff;cursor:pointer;margin-top:28px;transition:.2s;font-weight:700;box-shadow:0 4px 12px rgba(153,69,255,.3);width:100%}
  button:hover:not(:disabled){transform:translateY(-2px);box-shadow:0 6px 16px rgba(153,69,255,.4)}
  button:disabled{opacity:.6;cursor:not-allowed}
  .legal{margin-top:16px;padding:12px;background:#1a1a1a;border-radius:8px;font-size:11px;color:#666;line-height:1.4}
  #debug{margin-top:24px;padding:16px;background:#1a1a1a;border-radius:12px;font-size:12px;color:#888;text-align:left;font-family:'Courier New',monospace;max-height:300px;overflow-y:auto;border:1px solid #333}
  .log-success{color:#4ade80;margin:4px 0;padding:4px 8px;background:#0f2f1f;border-radius:4px}
  .log-error{color:#ff6b6b;margin:4px 0;padding:4px 8px;background:#2f0f0f;border-radius:4px}
  .log-info{color:#60a5fa;margin:4px 0;padding:4px 8px;background:#0f1f2f;border-radius:4px}
  .log-warning{color:#fbbf24;margin:4px 0;padding:4px 8px;background:#2f2f0f;border-radius:4px}
  .process-log{margin-top:24px;padding:16px;background:#1a1a1a;border-radius:12px;border:1px solid #333;display:none}
  .process-log.active{display:block}
  .process-step{margin:8px 0;padding:8px 12px;background:#0a0a0a;border-left:3px solid #333;border-radius:4px;font-size:13px}
  .process-step.active{border-left-color:#60a5fa;background:#0f1f2f}
  .process-step.complete{border-left-color:#4ade80;opacity:0.7}
  .process-step.error{border-left-color:#ff6b6b;background:#2f0f0f}
</style>
</head>
<body>
  <div class="container">
    <h2>${config.icon} Buy ${config.token} Tokens</h2>
    <p class="subtitle">${config.name} - ${config.description}</p>

    <div class="info-box">
      <h3>💰 How It Works</h3>
      <div class="info-item">1. Pay SOL → We buy ${config.token} for you on market</div>
      <div class="info-item">2. You receive ${config.token} tokens in your wallet</div>
      <div class="info-item">3. Compete for prizes or vote & earn!</div>
      <div class="info-item">4. Win ${config.token} rewards! 🏆</div>
    </div>

    <div class="wallet-selector">
      <p style="margin-bottom:12px;font-weight:600;">Connect Wallet:</p>
      <div id="walletOptions"></div>
    </div>

    <div class="tier-selector">
      <p style="margin-bottom:16px;font-weight:600;font-size:18px;">Choose Your Tier:</p>
      
      <div class="tier-option" id="tier-whale" onclick="selectTier('whale', 0.50)">
        <div class="tier-header">
          <div class="tier-name">🐋 Custom Amount (Whale Mode)</div>
        </div>
        <div class="tier-details">• Up to 75% retention awards! • Up to 1.50x prizes!</div>
        <div class="whale-input">
          <input type="number" id="whaleAmount" min="0.50" step="0.01" placeholder="Enter amount (min 0.50 SOL)" onchange="updateWhaleCalc()">
        </div>
        <div class="whale-calc" id="whaleCalc" style="display:none">
          <div id="whaleRetention"></div>
          <div id="whaleMultiplier"></div>
          <div id="whaleSUNO"></div>
        </div>
      </div>

      <div class="tier-option selected" id="tier-basic" onclick="selectTier('basic', 0.01)">
        <div class="tier-header">
          <div class="tier-name">Basic</div>
          <div class="tier-badge">🎵</div>
        </div>
        <div class="tier-amount">0.01 SOL</div>
        <div class="tier-details">• 50% retention awards • 1.0x prizes</div>
        <div class="tier-breakdown">
          <div class="tier-breakdown-item">Trans fee: 0.001 SOL (10%)</div>
          <div class="tier-breakdown-item">You get: ~0.0045 SOL in ${config.token}</div>
          <div class="tier-breakdown-item">Competition: 0.0045 SOL in ${config.token}</div>
        </div>
      </div>

      <div class="tier-option" id="tier-mid" onclick="selectTier('mid', 0.05)">
        <div class="tier-header">
          <div class="tier-name">Mid Tier</div>
          <div class="tier-badge">💎</div>
        </div>
        <div class="tier-amount">0.05 SOL</div>
        <div class="tier-details">• 55% retention awards (+5% bonus!) • 1.05x prizes</div>
        <div class="tier-breakdown">
          <div class="tier-breakdown-item">Trans fee: 0.005 SOL (10%)</div>
          <div class="tier-breakdown-item">You get: ~0.02475 SOL in ${config.token}</div>
          <div class="tier-breakdown-item">Competition: 0.02025 SOL in ${config.token}</div>
        </div>
      </div>

      <div class="tier-option" id="tier-high" onclick="selectTier('high', 0.10)">
        <div class="tier-header">
          <div class="tier-name">High Tier</div>
          <div class="tier-badge">👑</div>
        </div>
        <div class="tier-amount">0.10 SOL</div>
        <div class="tier-details">• 60% retention awards (+10% bonus!) • 1.10x prizes</div>
        <div class="tier-breakdown">
          <div class="tier-breakdown-item">Trans fee: 0.01 SOL (10%)</div>
          <div class="tier-breakdown-item">You get: ~0.054 SOL in ${config.token}</div>
          <div class="tier-breakdown-item">Competition: 0.036 SOL in ${config.token}</div>
        </div>
      </div>
    </div>

    <button id="sendBtn"
      data-recipient="${esc(recipient)}"
      data-rpc="${esc(RPC_URL)}"
      data-reference="${esc(reference)}"
      data-userid="${esc(userId)}"
      data-bot-url="${esc(botUrl)}"
      data-token-name="${esc(config.token)}"
    >💳 Buy ${config.token} Tokens</button>

    <div class="process-log" id="processLog">
      <h3 style="margin-bottom:12px;color:#60a5fa;">🔄 Transaction Process</h3>
      <div class="process-step" id="step-connect">1️⃣ Connecting wallet...</div>
      <div class="process-step" id="step-tx">2️⃣ Building transaction...</div>
      <div class="process-step" id="step-sign">3️⃣ Waiting for signature...</div>
      <div class="process-step" id="step-send">4️⃣ Sending to blockchain...</div>
      <div class="process-step" id="step-confirm">5️⃣ Confirming transaction...</div>
      <div class="process-step" id="step-process">6️⃣ Processing payment...</div>
      <div class="process-step" id="step-buy">7️⃣ Buying ${config.token} tokens...</div>
      <div class="process-step" id="step-complete">8️⃣ Complete!</div>
    </div>

    <div class="legal">
      ⚖️ You are purchasing ${config.token} tokens on the open market. 10% trans fee applies. Tokens sent to your wallet. Choose to compete or vote. Winners earn ${config.token} prizes. Voters earn from picking winners. Not gambling - skill-based competition.
    </div>

    <div id="debug"></div>
  </div>

  <script>
    let selectedWallet = null;
    let selectedAmount = 0.01;

    function detectWallets() {
      const wallets = [];
      
      // Phantom detection
      if (window.phantom?.solana?.isPhantom) {
        wallets.push({ name: 'Phantom', icon: '👻', provider: window.phantom.solana });
      }
      
      // Solflare detection - improved for better compatibility
      if (window.solflare) {
        const isSolflare = window.solflare.isSolflare || 
                          window.solflare.constructor?.name === 'Solflare' ||
                          (window.solflare.isConnected !== undefined);
        
        if (isSolflare) {
          wallets.push({ name: 'Solflare', icon: '🔆', provider: window.solflare });
        }
      }
      
      // Backpack detection
      if (window.backpack?.isBackpack) {
        wallets.push({ name: 'Backpack', icon: '🎒', provider: window.backpack });
      }
      
      // OKX Wallet detection
      if (window.okxwallet?.solana) {
        wallets.push({ name: 'OKX Wallet', icon: '⭕', provider: window.okxwallet.solana });
      }
      
      // Trust Wallet detection
      if (window.trustwallet?.solana) {
        wallets.push({ name: 'Trust Wallet', icon: '🛡️', provider: window.trustwallet.solana });
      }
      
      return wallets;
    }

    function renderWalletOptions() {
      const wallets = detectWallets();
      const container = document.getElementById('walletOptions');
      if (!wallets.length) {
        container.innerHTML = '<p style="color:#ff6b6b;">No Solana wallets detected. Please install Phantom, Solflare, or another Solana wallet.</p>';
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
      document.getElementById('whaleRetention').textContent = 'Retention awards: ' + (retention * 100).toFixed(0) + '%';
      document.getElementById('whaleMultiplier').textContent = 'Prize multiplier: ' + multiplier.toFixed(2) + 'x';
      document.getElementById('whaleSUNO').textContent = 'Token value: ~' + sunoValue.toFixed(4) + ' SOL';
    }

    // Initial render
    renderWalletOptions();
    
    // Re-check for wallets after a short delay (in case extensions load slowly)
    setTimeout(renderWalletOptions, 500);
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
const processLog = document.getElementById("processLog");
let processing = false;

function log(msg, type="info"){
  const cls = {error:"log-error",success:"log-success",warning:"log-warning"}[type] || "log-info";
  const t = new Date().toLocaleTimeString();
  if(dbg) {
    const line = document.createElement('div');
    line.className = cls;
    line.textContent = \`[\${t}] \${msg}\`;
    dbg.appendChild(line);
    dbg.scrollTop = dbg.scrollHeight;
  }
  console.log(msg);
}

function updateStep(stepId, status) {
  const step = document.getElementById(stepId);
  if (!step) return;
  
  step.classList.remove('active', 'complete', 'error');
  
  if (status === 'active') {
    step.classList.add('active');
    log(\`▶️ \${step.textContent}\`, 'info');
  } else if (status === 'complete') {
    step.classList.add('complete');
    log(\`✅ \${step.textContent}\`, 'success');
  } else if (status === 'error') {
    step.classList.add('error');
    log(\`❌ \${step.textContent}\`, 'error');
  }
}

log("🟢 Payment page loaded", "success");

let Connection, PublicKey, SystemProgram, Transaction, LAMPORTS_PER_SOL;
try {
  const w3 = await import("https://esm.sh/@solana/web3.js@1.95.8");
  ({ Connection, PublicKey, SystemProgram, Transaction, LAMPORTS_PER_SOL } = w3);
  log("✅ Solana Web3.js loaded", "success");
} catch(e){
  log("❌ Web3 failed to load: "+e.message, "error");
}

async function sendPayment(){
  if(processing) return;
  
  processing = true;
  btn.disabled = true;
  btn.textContent = "⏳ Processing...";
  processLog.classList.add('active');
  
  let userPubkey = null;
  let signed = null;
  let sig = null;
  
  const wallet = selectedWallet;
  if(!wallet){
    alert("Please install a Solana wallet extension (Phantom, Solflare, etc.)");
    processing = false;
    btn.disabled = false;
    btn.textContent = "💳 Buy Tokens";
    processLog.classList.remove('active');
    return;
  }
  
  const {provider} = wallet;
  const recipient = btn.dataset.recipient;
  const amount = selectedAmount;
  const rpc = btn.dataset.rpc;
  const reference = btn.dataset.reference;
  const userId = btn.dataset.userid;
  const botUrl = btn.dataset.botUrl;
  const tokenName = btn.dataset.tokenName;

  try{
    // Step 1: Connect
    updateStep('step-connect', 'active');
    await provider.connect();
    userPubkey = provider.publicKey?.toBase58?.();
    log(\`🔗 Connected to \${wallet.name}: \${userPubkey.substring(0,8)}...\`, "success");
    updateStep('step-connect', 'complete');
    
    // Step 2: Build transaction
    updateStep('step-tx', 'active');
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
    
    log(\`📋 Transaction built: \${amount} SOL to treasury\`, "success");
    updateStep('step-tx', 'complete');
    
    // Step 3: Sign
    updateStep('step-sign', 'active');
    btn.textContent = "✍️ Sign in wallet...";
    log(\`⏳ Waiting for signature in \${wallet.name}...\`, "info");
    signed = await provider.signTransaction(tx);
    log(\`✍️ Transaction signed!\`, "success");
    updateStep('step-sign', 'complete');
    
    // Step 4: Send
    updateStep('step-send', 'active');
    btn.textContent = "📡 Sending...";
    sig = await conn.sendRawTransaction(signed.serialize());
    log(\`📤 Transaction sent: \${sig.substring(0,12)}...\`, "success");
    log(\`🔗 View: https://solscan.io/tx/\${sig}\`, "info");
    updateStep('step-send', 'complete');
    
    // Step 5: Confirm
    updateStep('step-confirm', 'active');
    btn.textContent = "⏳ Confirming on-chain...";
    log(\`⏳ Waiting for blockchain confirmation...\`, "info");
    await conn.confirmTransaction(sig,"confirmed");
    log(\`✅ Transaction confirmed on Solana!\`, "success");
    updateStep('step-confirm', 'complete');
    
    // Step 6: Process payment
    updateStep('step-process', 'active');
    btn.textContent = "💰 Processing payment...";
    log(\`📨 Sending payment confirmation to bot...\`, "info");
    
    const confirmRes = await fetch(botUrl,{
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
    
    const confirmData = await confirmRes.json();
    log(\`✅ Payment processed by bot\`, "success");
    updateStep('step-process', 'complete');
    
    // Step 7: Buying tokens
    updateStep('step-buy', 'active');
    btn.textContent = "🪙 Buying " + tokenName + "...";
    log(\`🔄 Bot is purchasing \${tokenName} tokens for you...\`, "info");
    
    // Wait a bit for the bot to process
    await new Promise(r => setTimeout(r, 2000));
    
    const sunoAmount = confirmData.sunoAmount || 0;
    if (sunoAmount > 0) {
      log(\`🪙 \${tokenName} purchase complete: \${sunoAmount.toLocaleString()} tokens!\`, "success");
    } else {
      log(\`⏳ \${tokenName} purchase in progress...\`, "warning");
    }
    updateStep('step-buy', 'complete');
    
    // Step 8: Complete
    updateStep('step-complete', 'active');
    btn.textContent = "✅ Complete!";
    btn.style.background = "#4ade80";
    log(\`🎉 All done! Check Telegram for confirmation!\`, "success");
    updateStep('step-complete', 'complete');
    
    alert(\`✅ Purchase Complete!\\n\\n💰 Paid: \${amount} SOL\\n🪙 \${tokenName} tokens sent to your wallet!\\n\\nCheck Telegram for your entry confirmation!\`);
    
    setTimeout(() => {
      window.close();
    }, 2000);
    
  }catch(e){
    log("❌ Transaction failed: "+e.message, "error");
    console.error("Full error:", e);
    
    // Mark which step failed
    if (processing && !userPubkey) {
      updateStep('step-connect', 'error');
    } else if (!signed) {
      updateStep('step-sign', 'error');
    } else if (!sig) {
      updateStep('step-send', 'error');
    } else {
      updateStep('step-confirm', 'error');
    }
    
    alert("❌ Transaction Failed\\n\\n"+e.message+"\\n\\nPlease try again or check your wallet has enough SOL for fees.");
    processing = false;
    btn.disabled = false;
    btn.textContent = "💳 Buy Tokens";
    btn.style.background = "var(--primary-color)";
  }
}

if(btn){
  btn.addEventListener("click",ev=>{ev.preventDefault();sendPayment();});
}
`);
});

app.listen(PORT, () => {
  console.log(`✅ Shared Competition Payment Service on port ${PORT}`);
  console.log(`🎯 Serving: ${Object.keys(BOT_CONFIGS).join(', ')}`);
  console.log(`🔗 Payment page: http://localhost:${PORT}/pay?bot=sunolabs&recipient=...`);
});
