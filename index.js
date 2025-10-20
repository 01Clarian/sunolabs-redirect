import express from "express";
const app = express();

app.get("/", (req, res) => {
  res.send("✅ SunoLabs Redirect is live! Use /pay?recipient=...&amount=...");
});

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

  // Serve an HTML page instead of a direct redirect
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
          button:hover {
            background-color: #7e2fff;
          }
        </style>
      </head>
      <body>
        <h2>Open in your Solana wallet</h2>
        <p>Click the button below if your wallet doesn’t open automatically.</p>
        <button id="openWallet">Open Wallet</button>
        <script>
          const uri = "${solanaURI}";
          // Try automatic open after short delay
          setTimeout(() => { window.location = uri; }, 800);
          document.getElementById("openWallet").onclick = () => {
            window.location = uri;
          };
        </script>
      </body>
    </html>
  `);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ SunoLabs Redirect running on ${PORT}`));
