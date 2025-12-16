import express from 'express';

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

app.get('/', (req, res) => {
  res.send('Fake webhook API is running ✅');
});

/**
 * POST /fake-api/:type
 * type = ass | bcg
 */
app.post('/fake-api/:type', (req, res) => {
  const { type } = req.params;
  const receivedAt = new Date().toISOString();
  const body = req.body || {};

  if (!['ass', 'bcg'].includes(type)) {
    return res.status(400).json({
      error: 'Invalid type. Supported values: ass | bcg'
    });
  }

  // Callback URL
  const callbackUrl = body.callbackUrl || process.env.DEFAULT_CALLBACK_URL;
  if (!callbackUrl) {
    return res.status(400).json({
      error: 'Missing callback URL.'
    });
  }

  // API key (passed through)
  const apiKey = body.apiKey;
  if (!apiKey) {
    return res.status(400).json({
      error: 'Missing API key.'
    });
  }

  const id = Math.random().toString(36).substring(2, 10);

  // Immediate response
  res.json({
    status: 'accepted',
    id,
    type,
    receivedAt
  });

  const delayMs = 30_000;

  setTimeout(async () => {
    let payloadToSend;

    if (type === 'ass') {
      payloadToSend = {
        eventType: 'assessment.completed',
        assessment: {
          assessmentId: id,
          candidateId: body.candidateId || 'CAND-12345',
          status: 'completed',
          overallScore: 82,
          percentile: 76,
          results: [
            { competency: 'Problem Solving', score: 85 },
            { competency: 'Communication', score: 78 },
            { competency: 'Culture Fit', score: 90 }
          ],
          completedAt: new Date().toISOString()
        }
      };
    }

    if (type === 'bcg') {
      payloadToSend = {
        eventType: 'background_check.completed',
        backgroundCheck: {
          checkId: id,
          candidateId: body.candidateId || 'CAND-12345',
          status: 'clear',
          adjudication: 'eligible',
          checks: {
            criminal: 'clear',
            employment: 'verified',
            education: 'verified'
          },
          completedAt: new Date().toISOString()
        }
      };
    }

    try {
      const response = await fetch(callbackUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey
        },
        body: JSON.stringify(payloadToSend)
      });

      console.log(
        `[${type}] Webhook sent to ${callbackUrl} with status ${response.status}`
      );
    } catch (err) {
      console.error('Error sending webhook:', err);
    }
  }, delayMs);
});

app.listen(port, () => {
  console.log(`Fake webhook API listening on port ${port}`);
});

