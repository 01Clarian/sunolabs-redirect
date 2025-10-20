import express from "express";
const app = express();
const PORT = process.env.PORT || 10000;
// ✅ Use Helius RPC (free tier OK)
const RPC_URL =
  process.env.SOLANA_RPC_URL ||
  "https://mainnet.helius-rpc.com/?api-key=f6691497-4961-41e1-9a08-53f30c65bf43";
// === BASIC ROUTE ===
app.get("/", (req, res) => {
  res.send("✅ SunoLabs Redirect is live! Use /pay?recipient=...&amount=...");
});
// === MAIN PAYMENT PAGE ===
app.get("/pay", (req, res) => {
  const {
    recipient,
    amount = "0.01",
    label = "SunoLabs Entry",
    message = "Confirm your submission"
  } = req.query;
  if (!recipient) {
    return res.status(400).send("Missing recipient address");
  }
  // escape dangerous characters
  const safe = (s) => (s || "").replace(/"/g, "&quot;");
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>SunoLabs Pay</title>
<script type="module">
import {
  Connection, PublicKey, SystemProgram, Transaction, LAMPORTS_PER_SOL
} from "https://esm.sh/@solana/web3.js";
const RPC_URL = "${RPC_URL}";
// wait for wallet detection
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
        console.log("🟢 Wallet detected:", provider.isPhantom ? "Phantom" : provider.isSolflare ? "Solflare" : "Backpack");
        resolve(provider);
      }
      if (++tries > 25) {
        clearInterval(interval);
        resolve(null);
      }
    }, 200);
  });
}
async function sendPayment() {
  console.log("💡 Button clicked — waiting for wallet...");
  const provider = await waitForWallet();
  if (!provider) {
    alert("No Solana wallet found. Please install Phantom, Solflare, or Backpack.");
    return;
  }
  try {
    console.log("🔗 Connecting to wallet...");
    await provider.connect();
    console.log("✅ Connected to wallet:", provider.publicKey.toBase58());
    const conn = new Connection(RPC_URL, "confirmed");
    
    // Create transfer instruction
    const ix = SystemProgram.transfer({
      fromPubkey: provider.publicKey,
      toPubkey: new PublicKey("${safe(recipient)}"),
      lamports: Math.floor(parseFloat("${safe(amount)}") * LAMPORTS_PER_SOL)
    });
    
    // Build transaction
    const tx = new Transaction().add(ix);
    tx.feePayer = provider.publicKey;
    const { blockhash } = await conn.getLatestBlockhash();
    tx.recentBlockhash = blockhash;
    
    console.log("📝 Requesting signature...");
    
    // Sign the transaction
    const signedTx = await provider.signTransaction(tx);
    
    console.log("📤 Sending transaction...");
    
    // Send the signed transaction
    const rawTx = signedTx.serialize();
    const sig = await conn.sendRawTransaction(rawTx, {
      skipPreflight: false,
      preflightCommitment: "confirmed"
    });
    
    console.log("⏳ Confirming transaction...");
    
    // Wait for confirmation
    await conn.confirmTransaction(sig, "confirmed");
    
    console.log("✅ Transaction confirmed:", sig);
    alert("✅ Payment sent successfully!\\n\\nSignature: " + sig + "\\n\\nView on Solscan: https://solscan.io/tx/" + sig);
  } catch (err) {
    console.error("❌ Payment failed:", err);
    if (err.message.includes("User rejected")) {
      alert("❌ Transaction cancelled by user");
    } else {
      alert("❌ Payment failed: " + err.message);
    }
  }
}
window.onload = () => {
  const btn = document.getElementById("sendBtn");
  if (btn) {
    btn.onclick = sendPayment;
    console.log("🟣 Button handler attached - ready to send payment");
  }
  console.log("🎯 Page loaded - waiting for user action");
};
</script>
<style>
body {
  background: #0a0a0a;
  color: #fff;
  font-family: sans-serif;
  text-align: center;
  padding-top: 80px;
}
button {
  background: #9945ff;
  border: none;
  border-radius: 8px;
  padding: 12px 24px;
  font-size: 16px;
  color: #fff;
  cursor: pointer;
}
button:hover {
  background: #7e2fff;
}
a {
  color: #9945ff;
}
</style>
</head>
<body>
  <h2>Send ${safe(amount)} SOL to SunoLabs</h2>
  <p>${safe(label)}<br/>${safe(message)}</p>
  <button id="sendBtn">💸 Send with Wallet</button>
  <p style="margin-top:20px;color:#aaa">
    Compatible with Phantom, Solflare & Backpack
  </p>
</body>
</html>`);
});
// === START SERVER ===
app.listen(PORT, () => {
  console.log(`✅ SunoLabs Redirect running on ${PORT}`);
});
