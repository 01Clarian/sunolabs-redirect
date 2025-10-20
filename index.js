import express from "express";
const app = express();
const PORT = process.env.PORT || 10000;

app.get("/", (req, res) => {
  res.send("✅ SunoLabs Redirect is live! Use /pay?recipient=...&amount=...");
});

// === MAIN DAPP /PAY ROUTE ===
app.get("/pay", (req, res) => {
  const { recipient, amount = "0.01", reference, label, message } = req.query;
  if (!recipient) return res.status(400).send("Missing recipient");

  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>SunoLabs Pay</title>

  <script type="module">
    import {
      Connection,
      PublicKey,
      SystemProgram,
      Transaction,
      clusterApiUrl,
      LAMPORTS_PER_SOL
    } from "https://esm.sh/@solana/web3.js";

    async function getProvider() {
      // detect multiple wallets
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
        // connect wallet
        await provider.connect();
        const conn = new Connection(clusterApiUrl("mainnet-beta"), "confirmed");

        // build transaction
        const tx = new Transaction().add({
          keys: [
            { pubkey: new PublicKey("${reference || "11111111111111111111111111111111"}"), isSigner: false, isWritable: false }
          ],
          programId: SystemProgram.programId,
          data: Buffer.alloc(0),
          ...SystemProgram.transfer({
            fromPubkey: provider.publicKey,
            toPubkey: new PublicKey("${recipient}"),
            lamports: parseFloat("${amount}") * LAMPORTS_PER_SOL
          })
        });

        tx.feePayer = provider.publicKey;
        tx.recentBlockhash = (await conn.getLatestBlockhash()).blockhash;

        const sig = await provider.signAndSendTransaction(tx);
        alert("✅ Transaction sent! Signature: " + sig.signature);
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
    body {
      background:#0a0a0a; color:#fff;
      font-family:sans-serif; text-align:center; padding-top:80px;
    }
    button {
      background:#9945ff; border:none; border-radius:8px;
      padding:12px 24px; font-size:16px; color:#fff; cursor:pointer;
    }
    button:hover { background:#7e2fff; }
    a { color:#9945ff; }
  </style>
</head>

<body>
  <h2>Send ${amount} SOL to SunoLabs</h2>
  <p>${label || "Confirm entry"}<br/>${message || ""}</p>
  <button id="sendBtn">💸 Send with Wallet</button>
  <p style="margin-top:20px;color:#aaa">Compatible with Phantom, Solflare & Backpack</p>
</body>
</html>
  `);
});

app.listen(PORT, () => {
  console.log(\`✅ SunoLabs Redirect (multi-wallet) running on \${PORT}\`);
});

