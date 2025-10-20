import express from "express";
const app = express();
const PORT = process.env.PORT || 10000;

// ✅ Use Helius RPC (set via ENV or fallback)
const RPC_URL =
  process.env.SOLANA_RPC_URL ||
  "https://mainnet.helius-rpc.com/?api-key=f6691497-4961-41e1-9a08-53f30c65bf43";

app.get("/pay", (req, res) => {
  const { recipient, amount = "0.01", reference = "", label = "", message = "" } = req.query;
  if (!recipient) return res.status(400).send("Missing recipient");

  // escape double quotes
  const safe = (str) => (str || "").replace(/"/g, '&quot;');

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

async function getProvider() {
  const w = window;
  if (w.solana?.isPhantom) return w.solana;
  if (w.solflare?.isSolflare) return w.solflare;
  if (w.backpack?.isBackpack) return w.backpack;
  return null;
}

async function sendPayment() {
  const provider = await getProvider();
  if (!provider) {
    alert("No Solana wallet found. Please install Phantom, Solflare, or Backpack.");
    return;
  }
  try {
    await provider.connect();
    const conn = new Connection(RPC_URL, "confirmed");

    const ix = SystemProgram.transfer({
      fromPubkey: provider.publicKey,
      toPubkey: new PublicKey("${safe(recipient)}"),
      lamports: parseFloat("${safe(amount)}") * LAMPORTS_PER_SOL
    });

    if ("${safe(reference)}") {
      ix.keys.push({
        pubkey: new PublicKey("${safe(reference)}"),
        isSigner: false,
        isWritable: false
      });
    }

    const tx = new Transaction().add(ix);
    tx.feePayer = provider.publicKey;
    tx.recentBlockhash = (await conn.getLatestBlockhash()).blockhash;
    const sig = await provider.signAndSendTransaction(tx);
    alert("✅ Payment sent! Signature: " + sig.signature);
  } catch (err) {
    console.error(err);
    alert("❌ Payment failed: " + err.message);
  }
}

window.onload = () => {
  document.getElementById("sendBtn").onclick = sendPayment;
};
</script>
<style>
body { background:#0a0a0a; color:#fff; font-family:sans-serif; text-align:center; padding-top:80px; }
button { background:#9945ff; border:none; border-radius:8px; padding:12px 24px; font-size:16px; color:#fff; cursor:pointer; }
button:hover { background:#7e2fff; }
a { color:#9945ff; }
</style>
</head>
<body>
  <h2>Send ${safe(amount)} SOL to SunoLabs</h2>
  <p>${safe(label)}<br/>${safe(message)}</p>
  <button id="sendBtn">💸 Send with Wallet</button>
  <p style="margin-top:20px;color:#aaa">Compatible with Phantom, Solflare & Backpack</p>
</body>
</html>`);
});

app.listen(PORT, () => {
  console.log(`✅ SunoLabs Redirect running on ${PORT}`);
});

