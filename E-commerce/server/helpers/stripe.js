const Stripe = require("stripe");

// Configure Stripe with your secret key
const stripe = new Stripe(process.env.StripeKEY);

module.exports = stripe;
