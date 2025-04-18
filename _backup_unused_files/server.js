const express = require('express');
const cors = require('cors');
const sgMail = require('@sendgrid/mail');
const fs = require('fs');
const path = require('path');

const app = express();
const port = process.env.PORT || 3001;

// Setup logging
const logFile = 'server.log';
const log = (message) => {
  const timestamp = new Date().toISOString();
  const logMessage = `${timestamp}: ${message}\n`;
  console.log(logMessage);
  fs.appendFileSync(logFile, logMessage);
};

// Load environment variables manually
try {
  const envPath = path.join(process.cwd(), '.env');
  log('Loading .env file from: ' + envPath);
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const envLines = envContent.split('\n');
    envLines.forEach(line => {
      if (line && !line.startsWith('#')) {
        const [key, value] = line.split('=');
        if (key && value) {
          process.env[key.trim()] = value.trim();
        }
      }
    });
    log('Environment variables loaded successfully');
  } else {
    log('.env file not found');
  }
} catch (error) {
  log('Error loading .env file: ' + error.message);
}

// Debug environment variables
log('Environment variables after loading:');
log('REACT_APP_SENDGRID_API_KEY: ' + (process.env.REACT_APP_SENDGRID_API_KEY ? 'set (length: ' + process.env.REACT_APP_SENDGRID_API_KEY.length + ')' : 'not set'));
log('REACT_APP_SENDER_EMAIL: ' + (process.env.REACT_APP_SENDER_EMAIL || 'not set'));

// Initialize SendGrid
const apiKey = process.env.REACT_APP_SENDGRID_API_KEY;
if (!apiKey) {
  log('SendGrid API Key is missing');
  process.exit(1);
}

log(`SendGrid API Key found: ${!!apiKey}`);
log(`SendGrid API Key prefix: ${apiKey.substring(0, 10)}`);
sgMail.setApiKey(apiKey);

app.use(cors());
app.use(express.json());

// Email sending endpoint
app.post('/api/send-email', async (req, res) => {
  try {
    const { to, subject, text, html } = req.body;
    
    if (!to || !subject || (!text && !html)) {
      log('Missing required fields');
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const msg = {
      to,
      from: {
        email: process.env.REACT_APP_SENDER_EMAIL || 'info@weteamup.app',
        name: 'We Team Up'
      },
      subject,
      text,
      html
    };

    log(`Attempting to send email to: ${to}`);
    log(`From email: ${msg.from.email}`);
    const result = await sgMail.send(msg);
    log(`SendGrid response: ${JSON.stringify(result)}`);
    res.status(200).json({ message: 'Email sent successfully' });
  } catch (error) {
    log(`Error sending email: ${error.message}`);
    if (error.response) {
      log(`SendGrid error response: ${JSON.stringify(error.response.body)}`);
    }
    res.status(500).json({ error: 'Failed to send email' });
  }
});

app.listen(port, () => {
  log(`Server is running on port ${port}`);
}); 