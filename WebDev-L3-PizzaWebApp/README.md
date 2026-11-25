# PizzaFlow Internship MVP

PizzaFlow is a scoped MERN pizza-ordering and inventory application for the internship brief. It deliberately implements customer and admin roles only; kitchen/rider portals, refunds, supplier management, and analytics are documented future work.

## Current foundation

- React + Vite client shell with menu, custom pizza builder, account screens, and customer dashboard placeholder
- Express + MongoDB API with models for users, ingredients, pizzas, and orders
- JWT authentication in HTTP-only cookies and backend role checks
- Customer registration, login, inventory-aware custom-order creation, admin inventory routes, and admin order status routes
- `node-cron` low-stock scan hook
- Environment configuration and a warm orange/cream restaurant design direction

## Before running

1. Copy `.env.example` to `server/.env` and add MongoDB Atlas plus JWT values.
2. Run `npm install` from the repository root.
3. Run `npm run dev`.

Email verification and Razorpay payment require your Mailtrap and Razorpay test credentials before they can be enabled and tested end-to-end.
