import express from 'express';

const app = express();
const port = process.env.PORT || 3000;

// Pour lire du JSON dans le body
app.use(express.json());

// Petit endpoint de test
app.get('/', (req, res) => {
  res.send('Fake webhook API is running ✅');
});

/**
 * Endpoint appelé par ta démo
 * POST /fake-api
 *
 * Body attendu (JSON) :
 * {
 *   "callbackUrl": "https://ton-app.com/webhook", // optionnel si tu mets une URL par défaut dans Render
 *   ... tout autre champ que tu veux
 * }
 */
app.post('/fake-api', (req, res) => {
  const receivedAt = new Date().toISOString();
  const body = req.body || {};

  // 1) Déterminer l’URL de callback (priorité au body)
  const callbackUrl = body.callbackUrl || process.env.DEFAULT_CALLBACK_URL;

  if (!callbackUrl) {
    return res.status(400).json({
      error: 'Missing callback URL. Send "callbackUrl" in JSON body or set DEFAULT_CALLBACK_URL in environment variables.'
    });
  }

  // 2) Générer un ID de requête pour la démo
  const id = Math.random().toString(36).substring(2, 10);

  // 3) Répondre tout de suite à l’appel de ton produit
  res.json({
    status: 'accepted',
    id,
    receivedAt
  });

  // 4) Après 30 secondes, envoyer le webhook vers ton application
  const delayMs = 30_000; // 30 secondes

  setTimeout(async () => {
    const payloadToSend = {
      eventType: 'demo.webhook',
      id,
      originalPayload: body,
      processedAt: new Date().toISOString()
    };

    const apiKey = process.env.WEBHOOK_API_KEY; 
    try {
      const response = await fetch(callbackUrl, {
        method: 'POST',
       headers: { 
          'Content-Type': 'application/json',
          'X-API-Key': apiKey  //On ajoute l’API key ici
        },
        body: JSON.stringify(payloadToSend)
      });

      console.log(
        `Webhook sent to ${callbackUrl} with status ${response.status}`
      );
    } catch (err) {
      console.error('❌ Error sending webhook:', err);
    }
  }, delayMs);
});

// Démarrage du serveur
app.listen(port, () => {
  console.log(`Fake webhook API listening on port ${port}`);
});
