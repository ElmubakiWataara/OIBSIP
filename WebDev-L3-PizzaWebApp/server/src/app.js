const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { User, Ingredient, Pizza, Order } = require('./models');

const app = express();
app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use(express.json({ limit: '100kb' }));
app.use(cookieParser());
app.use('/api/auth', rateLimit({ windowMs: 15 * 60 * 1000, limit: 20, standardHeaders: true, legacyHeaders: false }));

const requireAuth = (roles = []) => async (req, res, next) => {
  try {
    const token = req.cookies.accessToken || req.headers.authorization?.replace('Bearer ', '');
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(payload.sub).select('-passwordHash -verificationTokenHash -resetTokenHash');
    if (!user || (roles.length && !roles.includes(user.role))) return res.status(403).json({ message: 'You are not authorised for this action.' });
    req.user = user;
    next();
  } catch { res.status(401).json({ message: 'Authentication required.' }); }
};

function sendToken(res, user) {
  const token = jwt.sign({ sub: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '1d' });
  res.cookie('accessToken', token, { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', maxAge: 86400000 });
}

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));
app.get('/api/pizzas', async (_req, res) => res.json(await Pizza.find({ isAvailable: true }).lean()));
app.get('/api/ingredients', async (_req, res) => res.json(await Ingredient.find({ isActive: true, stock: { $gt: 0 } }).lean()));

app.post('/api/auth/register', async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password || password.length < 8 || !/\d/.test(password)) return res.status(400).json({ message: 'Use a name, valid email, and an 8+ character password with a number.' });
    if (await User.exists({ email: email.toLowerCase() })) return res.status(409).json({ message: 'An account with this email already exists.' });
    const rawToken = crypto.randomBytes(32).toString('hex');
    const user = await User.create({ name, email, passwordHash: await bcrypt.hash(password, 12), verificationTokenHash: crypto.createHash('sha256').update(rawToken).digest('hex'), verificationExpiresAt: Date.now() + 86400000 });
    // Email transport is connected in Phase 2. Never return this token in production.
    res.status(201).json({ message: 'Account created. Configure email delivery to send the verification link.', user: { id: user.id, name: user.name, email: user.email } });
  } catch (error) { next(error); }
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email: String(email || '').toLowerCase() });
  if (!user || !(await bcrypt.compare(password || '', user.passwordHash))) return res.status(401).json({ message: 'Invalid email or password.' });
  if (!user.isVerified) return res.status(403).json({ message: 'Verify your email before placing an order.' });
  sendToken(res, user);
  res.json({ user: { id: user.id, name: user.name, role: user.role } });
});

app.post('/api/auth/logout', (_req, res) => { res.clearCookie('accessToken'); res.status(204).end(); });

app.post('/api/orders', requireAuth(['customer']), async (req, res, next) => {
  try {
    const { items } = req.body;
    if (!Array.isArray(items) || !items.length) return res.status(400).json({ message: 'Add at least one pizza before checkout.' });
    const allIngredientNames = items.flatMap((item) => [item.customisation?.base, item.customisation?.sauce, item.customisation?.cheese, ...(item.customisation?.vegetables || [])].filter(Boolean));
    const ingredients = await Ingredient.find({ name: { $in: allIngredientNames }, isActive: true });
    if (ingredients.length !== new Set(allIngredientNames).size || ingredients.some((ingredient) => ingredient.stock < 1)) return res.status(409).json({ message: 'One or more selected ingredients are unavailable.' });
    const priceByName = new Map(ingredients.map((ingredient) => [ingredient.name, ingredient.priceMinor]));
    const pricedItems = items.map((item) => {
      const customisation = item.customisation || {};
      const choices = [customisation.base, customisation.sauce, customisation.cheese, ...(customisation.vegetables || [])].filter(Boolean);
      const unitPriceMinor = choices.reduce((total, choice) => total + (priceByName.get(choice) || 0), 49900);
      return { name: item.name || 'Custom Pizza', quantity: Math.max(1, Number(item.quantity) || 1), unitPriceMinor, customisation };
    });
    const totalMinor = pricedItems.reduce((total, item) => total + item.unitPriceMinor * item.quantity, 0);
    const order = await Order.create({ orderNumber: `PZF-${Date.now().toString().slice(-7)}`, customer: req.user.id, items: pricedItems, totalMinor });
    res.status(201).json({ order });
  } catch (error) { next(error); }
});

app.get('/api/orders/mine', requireAuth(['customer']), async (req, res) => res.json(await Order.find({ customer: req.user.id }).sort({ createdAt: -1 })));
app.get('/api/admin/inventory', requireAuth(['admin']), async (_req, res) => res.json(await Ingredient.find().sort({ category: 1, name: 1 })));
app.patch('/api/admin/inventory/:id', requireAuth(['admin']), async (req, res) => res.json(await Ingredient.findByIdAndUpdate(req.params.id, { $set: { stock: req.body.stock, lowStockThreshold: req.body.lowStockThreshold } }, { new: true, runValidators: true })));
app.get('/api/admin/orders', requireAuth(['admin']), async (_req, res) => res.json(await Order.find().populate('customer', 'name email').sort({ createdAt: -1 })));
app.patch('/api/admin/orders/:id/status', requireAuth(['admin']), async (req, res) => {
  const allowed = ['order_received', 'in_kitchen', 'sent_to_delivery'];
  if (!allowed.includes(req.body.status)) return res.status(400).json({ message: 'Invalid order status.' });
  res.json(await Order.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true }));
});

app.use((error, _req, res, _next) => { console.error(error); res.status(500).json({ message: 'Something went wrong. Please try again.' }); });
module.exports = app;
