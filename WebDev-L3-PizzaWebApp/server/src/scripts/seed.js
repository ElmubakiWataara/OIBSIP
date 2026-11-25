require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { User, Ingredient, Pizza } = require('../models');

const ingredients = [
  ['Classic Hand-Tossed', 'base', 0, 60], ['Thin Crust', 'base', 3000, 45], ['Thick Crust', 'base', 2500, 35], ['Whole Wheat', 'base', 3500, 25], ['Stuffed Crust', 'base', 6500, 30],
  ['Classic Tomato', 'sauce', 0, 80], ['BBQ Sauce', 'sauce', 2500, 42], ['Alfredo Sauce', 'sauce', 3500, 36], ['Pesto Sauce', 'sauce', 4000, 24], ['Spicy Peri-Peri', 'sauce', 2500, 48],
  ['Mozzarella', 'cheese', 0, 80], ['Cheddar', 'cheese', 3000, 50], ['Parmesan', 'cheese', 4000, 35], ['Vegan Cheese', 'cheese', 6000, 20], ['Cheese Blend', 'cheese', 3500, 55],
  ['Onions', 'vegetable', 1000, 90], ['Tomatoes', 'vegetable', 1000, 80], ['Bell Peppers', 'vegetable', 1500, 55], ['Mushrooms', 'vegetable', 2000, 42], ['Olives', 'vegetable', 2000, 36], ['Sweetcorn', 'vegetable', 1500, 50], ['Spinach', 'vegetable', 1500, 30], ['Jalapeños', 'vegetable', 1500, 45]
].map(([name, category, priceMinor, stock]) => ({ name, category, priceMinor, stock, lowStockThreshold: 20 }));

const pizzas = [
  { name: 'Margherita', description: 'Tomato, mozzarella, basil, and our classic hand-tossed dough.', priceMinor: 49900, category: 'Classic' },
  { name: 'Pepperoni Feast', description: 'A generous layer of pepperoni with rich tomato and mozzarella.', priceMinor: 64900, category: 'Classic' },
  { name: 'Veggie Supreme', description: 'Mushrooms, peppers, onions, sweetcorn, and olives.', priceMinor: 59900, category: 'Vegetarian' },
  { name: 'BBQ Chicken', description: 'Smoky barbecue sauce, chicken, peppers, and cheese.', priceMinor: 69900, category: 'Speciality' }
];

async function seed() {
  if (!process.env.MONGODB_URI || !process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD) throw new Error('Set MONGODB_URI, ADMIN_EMAIL, and ADMIN_PASSWORD in server/.env first.');
  await mongoose.connect(process.env.MONGODB_URI);
  for (const ingredient of ingredients) await Ingredient.findOneAndUpdate({ name: ingredient.name }, ingredient, { upsert: true, new: true, setDefaultsOnInsert: true });
  for (const pizza of pizzas) await Pizza.findOneAndUpdate({ name: pizza.name }, pizza, { upsert: true, new: true, setDefaultsOnInsert: true });
  const passwordHash = await bcrypt.hash(process.env.ADMIN_PASSWORD, 12);
  await User.findOneAndUpdate({ email: process.env.ADMIN_EMAIL.toLowerCase() }, { name: process.env.ADMIN_NAME || 'PizzaFlow Admin', email: process.env.ADMIN_EMAIL.toLowerCase(), passwordHash, role: 'admin', isVerified: true }, { upsert: true, new: true, setDefaultsOnInsert: true });
  console.log('PizzaFlow seed completed.');
  await mongoose.disconnect();
}
seed().catch((error) => { console.error(error.message); process.exit(1); });
