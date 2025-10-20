import express from "express";
const app = express();

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

  res.redirect(solanaURI);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Redirect server running on ${PORT}`));
