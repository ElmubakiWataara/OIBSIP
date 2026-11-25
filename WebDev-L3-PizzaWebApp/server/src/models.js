const mongoose = require('mongoose');
const { Schema } = mongoose;

const userSchema = new Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['customer', 'admin'], default: 'customer' },
  isVerified: { type: Boolean, default: false },
  verificationTokenHash: String,
  verificationExpiresAt: Date,
  resetTokenHash: String,
  resetExpiresAt: Date
}, { timestamps: true });

const ingredientSchema = new Schema({
  name: { type: String, required: true, trim: true, unique: true },
  category: { type: String, enum: ['base', 'sauce', 'cheese', 'vegetable'], required: true },
  priceMinor: { type: Number, default: 0, min: 0 },
  stock: { type: Number, required: true, min: 0 },
  lowStockThreshold: { type: Number, default: 20, min: 0 },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

const pizzaSchema = new Schema({
  name: { type: String, required: true },
  description: String,
  priceMinor: { type: Number, required: true, min: 0 },
  category: { type: String, default: 'Classic' },
  imageUrl: String,
  isAvailable: { type: Boolean, default: true }
}, { timestamps: true });

const orderSchema = new Schema({
  orderNumber: { type: String, required: true, unique: true },
  customer: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  items: [{
    name: String,
    quantity: { type: Number, min: 1 },
    unitPriceMinor: Number,
    customisation: { base: String, sauce: String, cheese: String, vegetables: [String] }
  }],
  totalMinor: { type: Number, required: true, min: 0 },
  currency: { type: String, default: 'INR' },
  paymentStatus: { type: String, enum: ['pending', 'paid', 'failed'], default: 'pending' },
  payment: { providerOrderId: String, providerPaymentId: String },
  status: { type: String, enum: ['order_received', 'in_kitchen', 'sent_to_delivery'], default: 'order_received' }
}, { timestamps: true });

module.exports = {
  User: mongoose.model('User', userSchema),
  Ingredient: mongoose.model('Ingredient', ingredientSchema),
  Pizza: mongoose.model('Pizza', pizzaSchema),
  Order: mongoose.model('Order', orderSchema)
};
