require('dotenv').config();
const mongoose = require('mongoose');
const cron = require('node-cron');
const app = require('./app');
const { Ingredient } = require('./models');

async function start() {
  if (!process.env.MONGODB_URI || !process.env.JWT_SECRET) throw new Error('MONGODB_URI and JWT_SECRET must be set in server/.env.');
  await mongoose.connect(process.env.MONGODB_URI);
  cron.schedule(process.env.LOW_STOCK_CRON_SCHEDULE || '0 */6 * * *', async () => {
    const lowStock = await Ingredient.find({ $expr: { $lte: ['$stock', '$lowStockThreshold'] } });
    if (lowStock.length) console.warn('Low stock alert required:', lowStock.map((item) => item.name).join(', '));
  });
  app.listen(process.env.PORT || 5000, () => console.log('PizzaFlow API is running.'));
}
start().catch((error) => { console.error(error.message); process.exit(1); });
