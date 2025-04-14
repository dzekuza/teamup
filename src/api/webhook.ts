import express from 'express';

const router = express.Router();

// Add webhook routes here if needed
router.post('/webhook', (req, res) => {
  res.status(200).json({ message: 'Webhook received' });
});

export default router; 