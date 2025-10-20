import express from "express";

const app = express();
const PORT = process.env.PORT || 10000;

// --- optional root route ---
app.get("/", (req, res) => {
  res.send("✅ SunoLabs Redirect is live! Use /pay?recipient=...&amount=...");
});

// --- main /pay route ---
app.get("/pay", (req, res) => {
  const { recipient, amount, reference, label, message } = req.query;

  if (!recipient || !amount) {
    return res.status(400).send("Missing parameters");
  }

  const solanaURI =
    `solana:${recipient}?amount=${amount}` +
    (reference ? `&reference=${reference}` : "") +
    (label ? `&label=${encodeURIComponent(label)}` : "") +
    (message ? `&message=${encodeURIComponent(message)}` : "");

  const intentURI = `intent://${solanaURI.replace("solana:", "")}#Intent;scheme=solana;end`;

  res.send(`
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Open in Wallet</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            text-align: center;
            padding-top: 80px;
            background: #0a0a0a;
            color: #fff;
          }
          button {
            background-color: #9945ff;
            color: white;
            border: none;
            padding: 12px 24px;
            font-size: 16px;
            border-radius: 8px;
            cursor: pointer;
          }
          button:hover { background-color: #7e2fff; }
          a { color: #9945ff; }
        </style>
      </head>
      <body>
        <h2>Open in your Solana wallet</h2>
        <p>Click below if your wallet doesn’t open automatically.</p>
        <button id="openWallet">Open Wallet</button>
        <p style="margin-top:20px;">
          Or copy this link manually:<br/>
          <a href="${solanaURI}">${solanaURI}</a>
        </p>
        <script>
          const uri = "${solanaURI}";
          const intent = "${intentURI}";

          function tryOpen() {
            if (navigator.userAgent.toLowerCase().includes("android")) {
              window.location = intent;   // Android intent scheme
            } else {
              window.location = uri;      // iOS + desktop
            }
          }

          document.getElementById("openWallet").onclick = tryOpen;
          setTimeout(tryOpen, 800);
        </script>
      </body>
    </html>
  `);
});

// --- start server ---
app.listen(PORT, () => {
  console.log(`✅ SunoLabs Redirect running on ${PORT}`);
});

