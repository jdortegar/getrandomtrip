import express from 'express';
import checkoutRoutes from './routes/checkout';
import postPurchaseRoutes from './routes/post-purchase';
import revealRoutes from './routes/reveal';
import mercadopagoWebhookRoutes from './routes/mercadopago-webhook';
import summaryRoutes from './routes/summary';
import premiumFiltersRoutes from './routes/premium-filters';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json());

app.get('/', (req, res) => {
  res.send('Randomtrip Backend API');
});

app.use('/api/checkout', checkoutRoutes);
app.use('/api/post-purchase', postPurchaseRoutes);
app.use('/api/reveal', revealRoutes);
app.use('/webhooks/mercadopago', mercadopagoWebhookRoutes);
app.use('/api/summary', summaryRoutes);
app.use('/api/premium-filters', premiumFiltersRoutes);

app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});
