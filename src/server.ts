import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import webhookRouter from './api/webhook';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Use webhook routes
app.use('/api', webhookRouter);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
}); 