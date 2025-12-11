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

  // 1) URL du webhook
  const callbackUrl = body.callbackUrl || process.env.DEFAULT_CALLBACK_URL;

  if (!callbackUrl) {
    return res.status(400).json({
      error: 'Missing callback URL. Send "callbackUrl" in JSON body or set DEFAULT_CALLBACK_URL.'
    });
  }

  // 2) API key provenant du premier POST
  const apiKey = body.apiKey;
  if (!apiKey) {
    return res.status(400).json({
      error: 'Missing API key. Send "apiKey" in JSON body.'
    });
  }

  // 3) ID de la requête
  const id = Math.random().toString(36).substring(2, 10);

  // 4) Réponse immédiate au client
  res.json({
    status: 'accepted',
    id,
    receivedAt
  });

  // 5) Envoi du webhook après 30 secondes
  const delayMs = 30_000;

  setTimeout(async () => {
    const payloadToSend = {
      eventType: 'demo.webhook',
      id,
      originalPayload: body,
      processedAt: new Date().toISOString()
    };

    try {
      const response = await fetch(callbackUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey   //API key du premier POST !
        },
        body: JSON.stringify(payloadToSend)
      });

      console.log(
        `Webhook sent to ${callbackUrl} with status ${response.status}`
      );
    } catch (err) {
      console.error('Error sending webhook:', err);
    }
  }, delayMs);
});

// Démarrage du serveur
app.listen(port, () => {
  console.log(`Fake webhook API listening on port ${port}`);
});
