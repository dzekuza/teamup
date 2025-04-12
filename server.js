require('dotenv').config();
const express = require('express');
const cors = require('cors');
const webhookRouter = require('./dist/api/webhook').default;

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Use webhook routes
app.use('/api', webhookRouter);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
}); 