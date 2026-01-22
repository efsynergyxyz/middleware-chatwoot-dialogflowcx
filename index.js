const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const { GoogleAuth } = require('google-auth-library');

const auth = new GoogleAuth({
  scopes: ['https://www.googleapis.com/auth/cloud-platform']
});

const app = express();
app.use(bodyParser.json());

const PORT = process.env.PORT || 8080;

// Webhook de Chatwoot
app.post('/webhook/chatwoot', async (req, res) => {
  try {
    const message = req.body.content;
    const senderId =
      req.body.sender?.phone ||
      req.body.sender?.email ||
      req.body.conversation_id ||
      "anon";

    console.log("Mensaje recibido:", message);

    const url = `https://dialogflow.googleapis.com/v3/projects/${process.env.GC_PROJECT}/locations/${process.env.GC_LOCATION}/agents/${process.env.GC_AGENT}/sessions/${senderId}:detectIntent`;

const client = await auth.getClient();
const accessToken = await client.getAccessToken();

const response = await axios.post(
  url,
  {
    queryInput: {
      text: { text: message },
      languageCode: 'es'
    }
  },
  {
    headers: {
      'Authorization': `Bearer ${accessToken.token}`,
      'Content-Type': 'application/json'
    }
  }
);

    const messages = response.data.queryResult?.responseMessages || [];

    let replyText = "No entendí 😅";

    for (const m of messages) {
      if (m.text?.text?.length) {
        replyText = m.text.text[0];
        break;
      }
    }

    res.json({ content: replyText });

  } catch (err) {
    console.error("Error:", err?.response?.data || err.message);
    res.status(500).json({ content: "Error interno 😵" });
  }
});

app.listen(PORT, () => {
  console.log(`Middleware escuchando en puerto ${PORT}`);
});
