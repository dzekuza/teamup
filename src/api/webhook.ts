import express from 'express';
import { handleWhatsAppMessage } from './whatsapp';

const router = express.Router();

// WhatsApp webhook verification
router.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  // Replace with your verification token
  const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN;

  if (mode && token) {
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      console.log('Webhook verified');
      res.status(200).send(challenge);
    } else {
      res.sendStatus(403);
    }
  }
});

// Handle incoming WhatsApp messages
router.post('/webhook', async (req, res) => {
  try {
    const { entry } = req.body;

    if (!entry || !Array.isArray(entry)) {
      return res.sendStatus(400);
    }

    for (const e of entry) {
      if (e.changes && Array.isArray(e.changes)) {
        for (const change of e.changes) {
          if (change.value && change.value.messages && Array.isArray(change.value.messages)) {
            for (const message of change.value.messages) {
              const whatsappMessage = {
                from: message.from,
                body: message.text.body,
                timestamp: message.timestamp
              };

              const result = await handleWhatsAppMessage(whatsappMessage);
              
              // Send response back to WhatsApp
              await fetch(`https://graph.facebook.com/v17.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`, {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  messaging_product: 'whatsapp',
                  to: whatsappMessage.from,
                  type: 'text',
                  text: { body: result.message }
                })
              });
            }
          }
        }
      }
    }

    res.sendStatus(200);
  } catch (error) {
    console.error('Error processing webhook:', error);
    res.sendStatus(500);
  }
});

export default router; 