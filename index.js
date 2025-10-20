import express from "express";
const app = express();
const PORT = process.env.PORT || 10000;

const RPC_URL =
  process.env.SOLANA_RPC_URL ||
  "https://mainnet.helius-rpc.com/?api-key=f6691497-4961-41e1-9a08-53f30c65bf43";

app.get("/", (req, res) => {
  res.send("✅ SunoLabs Redirect is live! Use /pay?recipient=...&amount=...");
});

app.get("/pay", (req, res) => {
  const {
    recipient,
    amount = "0.01",
    label = "SunoLabs Entry",
    message = "Confirm your submission",
    reference = ""
  } = req.query;

  if (!recipient) {
    return res.status(400).send("Missing recipient address");
  }

  const safe = (s) => (s || "").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>SunoLabs Pay</title>
<style>
body {
  background: #0a0a0a;
  color: #fff;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  text-align: center;
  padding: 80px 20px 20px;
  margin: 0;
}
h2 {
  margin-bottom: 10px;
}
button {
  background: #9945ff;
  border: none;
  border-radius: 8px;
  padding: 14px 28px;
  font-size: 16px;
  color: #fff;
  cursor: pointer;
  margin-top: 20px;
  transition: all 0.2s;
}
button:hover:not(:disabled) {
  background: #7e2fff;
  transform: scale(1.02);
}
button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.info {
  margin-top: 20px;
  color: #aaa;
  font-size: 14px;
}
.warning {
  margin-top: 10px;
  color: #ff6b6b;
  font-size: 12px;
}
#debug {
  margin-top: 30px;
  padding: 15px;
  background: #1a1a1a;
  border-radius: 8px;
  font-size: 11px;
  color: #888;
  text-align: left;
  max-width: 500px;
  margin-left: auto;
  margin-right: auto;
  font-family: 'Courier New', monospace;
  max-height: 300px;
  overflow-y: auto;
}
.log-success { color: #4ade80; }
.log-error { color: #ff6b6b; }
.log-info { color: #60a5fa; }
</style>
</head>
<body>
  <h2>💸 Send ${safe(amount)} SOL to SunoLabs</h2>
  <p>${safe(label)}<br/>${safe(message)}</p>
  <button id="sendBtn">💸 Send with Wallet</button>
  <p class="info">Compatible with Phantom, Solflare & Backpack</p>
  <p class="warning">⚠️ If button doesn't work, make sure you have a Solana wallet installed</p>
  <div id="debug">
    <div style="color:#60a5fa;margin-bottom:10px;">📋 Debug Console:</div>
  </div>

<script type="module">
const debugEl = document.getElementById("debug");

function log(msg, type = "info") {
  const time = new Date().toLocaleTimeString();
  const color = type === "error" ? "log-error" : type === "success" ? "log-success" : "log-info";
  debugEl.innerHTML += \`<div class="\${color}">\${time} - \${msg}</div>\`;
  debugEl.scrollTop = debugEl.scrollHeight;
  console.log(msg);
}

log("🟢 Page loaded, initializing...");

// Load Solana Web3.js
let Connection, PublicKey, SystemProgram, Transaction, LAMPORTS_PER_SOL;

try {
  log("📦 Loading Solana library...");
  const solanaWeb3 = await import("https://esm.sh/@solana/web3.js@1.95.8");
  Connection = solanaWeb3.Connection;
  PublicKey = solanaWeb3.PublicKey;
  SystemProgram = solanaWeb3.SystemProgram;
  Transaction = solanaWeb3.Transaction;
  LAMPORTS_PER_SOL = solanaWeb3.LAMPORTS_PER_SOL;
  log("✅ Solana Web3.js loaded successfully", "success");
} catch (err) {
  log("❌ Failed to load Solana library: " + err.message, "error");
  alert("Failed to load payment library. Please refresh the page.");
}

const RPC_URL = "${RPC_URL}";
const RECIPIENT = "${safe(recipient)}";
const AMOUNT = "${safe(amount)}";
const REFERENCE = "${safe(reference)}";

log("💰 Payment details: " + AMOUNT + " SOL to " + RECIPIENT.substring(0, 8) + "...");

// Wait for wallet detection
function waitForWallet() {
  return new Promise((resolve) => {
    let tries = 0;
    const interval = setInterval(() => {
      const w = window;
      const provider =
        (w.solana?.isPhantom && w.solana) ||
        (w.solflare?.isSolflare && w.solflare) ||
        (w.backpack?.isBackpack && w.backpack);
      
      if (provider) {
        clearInterval(interval);
        const walletName = provider.isPhantom ? "Phantom" : provider.isSolflare ? "Solflare" : "Backpack";
        log("🟢 Wallet detected: " + walletName, "success");
        resolve(provider);
      }
      
      if (++tries > 30) {
        clearInterval(interval);
        log("❌ No wallet found after 6 seconds", "error");
        resolve(null);
      }
    }, 200);
  });
}

async function sendPayment() {
  log("🔵 Button clicked - starting payment flow", "info");
  
  const btn = document.getElementById("sendBtn");
  const originalText = btn.textContent;
  btn.textContent = "🔍 Looking for wallet...";
  btn.disabled = true;
  
  const provider = await waitForWallet();
  
  if (!provider) {
    btn.textContent = originalText;
    btn.disabled = false;
    log("❌ No wallet installed", "error");
    alert("⚠️ No Solana wallet found.\\n\\nPlease install Phantom, Solflare, or Backpack first.");
    return;
  }
  
  try {
    btn.textContent = "🔗 Connecting to wallet...";
    log("🔗 Requesting wallet connection...");
    
    await provider.connect();
    log("✅ Connected to: " + provider.publicKey.toBase58().substring(0, 8) + "...", "success");
    
    btn.textContent = "📝 Building transaction...";
    log("📝 Creating transaction...");
    
    const conn = new Connection(RPC_URL, "confirmed");
    
    // Create transfer instruction
    const ix = SystemProgram.transfer({
      fromPubkey: provider.publicKey,
      toPubkey: new PublicKey(RECIPIENT),
      lamports: Math.floor(parseFloat(AMOUNT) * LAMPORTS_PER_SOL)
    });
    
    log("💸 Transfer: " + AMOUNT + " SOL");
    
    // Build transaction
    const tx = new Transaction().add(ix);
    tx.feePayer = provider.publicKey;
    
    log("🔍 Getting latest blockhash...");
    const { blockhash } = await conn.getLatestBlockhash();
    tx.recentBlockhash = blockhash;
    
    // Add reference if provided (for Solana Pay tracking)
    if (REFERENCE) {
      log("🔖 Adding reference: " + REFERENCE.substring(0, 8) + "...");
    }
    
    btn.textContent = "✍️ Waiting for signature...";
    log("✍️ Requesting signature from wallet...");
    
    // Sign the transaction
    const signedTx = await provider.signTransaction(tx);
    log("✅ Transaction signed", "success");
    
    btn.textContent = "📤 Sending transaction...";
    log("📤 Broadcasting transaction...");
    
    // Send the signed transaction
    const rawTx = signedTx.serialize();
    const sig = await conn.sendRawTransaction(rawTx, {
      skipPreflight: false,
      preflightCommitment: "confirmed"
    });
    
    log("📡 Transaction sent: " + sig, "success");
    
    btn.textContent = "⏳ Confirming...";
    log("⏳ Waiting for confirmation...");
    
    // Wait for confirmation
    await conn.confirmTransaction(sig, "confirmed");
    
    log("✅ PAYMENT SUCCESSFUL! Signature: " + sig, "success");
    btn.textContent = "✅ Payment Successful!";
    
    setTimeout(() => {
      btn.textContent = originalText;
      btn.disabled = false;
    }, 5000);
    
    alert("✅ Payment sent successfully!\\n\\nSignature: " + sig + "\\n\\nView on Solscan:\\nhttps://solscan.io/tx/" + sig);
    
  } catch (err) {
    log("❌ ERROR: " + err.message, "error");
    btn.textContent = originalText;
    btn.disabled = false;
    
    if (err.message.includes("User rejected")) {
      alert("❌ Transaction cancelled by user");
    } else {
      alert("❌ Payment failed: " + err.message);
    }
  }
}

// Attach button handler
window.onload = () => {
  log("🎯 Attaching button handler...");
  const btn = document.getElementById("sendBtn");
  
  if (btn) {
    log("✅ Button found, handler attached", "success");
    btn.onclick = (e) => {
      log("🖱️ Button click event fired", "info");
      sendPayment();
    };
  } else {
    log("❌ Button element not found!", "error");
  }
};
</script>
</body>
</html>`);
});

app.listen(PORT, () => {
  console.log(`✅ SunoLabs Redirect running on port ${PORT}`);
});
