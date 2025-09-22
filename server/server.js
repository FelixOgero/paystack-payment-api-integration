// const express = require('express');
// const cors = require('cors');
// const dotenv = require('dotenv');
// const connectDB = require('./config/db');
// const paymentRoutes = require('./routes/paymentRoutes');
// const path = require('path');

// // Load environment variables
// dotenv.config();

// // Connect to database
// connectDB();

// const app = express();

// // Middleware
// app.use(express.json());
// app.use(cors({
//   origin: process.env.CLIENT_URL || 'http://localhost:5173',
//   credentials: true
// }));

// // Special handling for Paystack webhook (raw body)
// // This must come BEFORE the regular routes
// app.use('/api/payments/webhook', express.raw({type: 'application/json'}), (req, res, next) => {
//   if (req.method === 'POST') {
//     req.body = JSON.parse(req.body.toString());
//   }
//   next();
// });

// // API Routes
// app.use('/api/payments', paymentRoutes);

// // Serve static assets if in production
// if (process.env.NODE_ENV === 'production') {
//   app.use(express.static('client/dist'));
  
//   // For any other route, serve the React app
//   app.get('*', (req, res) => {
//     res.sendFile(path.resolve(__dirname, 'client', 'dist', 'index.html'));
//   });
// } else {
//   // Health check route (only in development)
//   app.get('/', (req, res) => {
//     res.send('API is running...');
//   });
  
//   // For React routing in development, forward all routes to the client
//   app.get('/payment/callback', (req, res) => {
//     res.redirect(`${process.env.CLIENT_URL || 'http://localhost:5173'}/payment/callback${req.url.includes('?') ? req.url.substring(req.url.indexOf('?')) : ''}`);
//   });
// }

// // Error handler
// app.use((err, req, res, next) => {
//   console.error(err.stack);
//   res.status(500).json({
//     success: false,
//     message: 'Something went wrong!'
//   });
// });

// // Start server
// const PORT = process.env.PORT || 5000;
// app.listen(PORT, () => {
//   console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
// });




const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const paymentRoutes = require('./routes/paymentRoutes');
const { handleWebhook } = require('./controllers/paymentController');
const path = require('path');

// Load environment variables
dotenv.config();

// Connect to database
connectDB();

const app = express();

// CORS middleware - must come before routes
// app.use(cors({
//   origin: process.env.CLIENT_URL || 'http://localhost:5173',
//   credentials: true
// }));

// Allow all origins (for simplicity, adjust in production)
app.use(cors());

// Special handling for Paystack webhook (raw body) - handle it completely here
// This MUST come before express.json() middleware
app.post('/api/payments/webhook', express.raw({type: 'application/json'}), (req, res) => {
  try {
    // Parse the raw body for the webhook handler
    req.body = JSON.parse(req.body.toString());
    handleWebhook(req, res);
  } catch (error) {
    console.error('Webhook parsing error:', error);
    res.status(400).send('Invalid JSON');
  }
});

// Regular JSON middleware for other routes
app.use(express.json());

// API Routes (webhook route is handled above, not in paymentRoutes)
app.use('/api/payments', paymentRoutes);

// Serve static assets if in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static('client/dist'));
  
  // For any other route, serve the React app
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'client', 'dist', 'index.html'));
  });
} else {
  // Health check route (only in development)
  app.get('/', (req, res) => {
    res.send('API is running...');
  });
  
  // For React routing in development, forward payment callback to the client
  app.get('/payment/callback', (req, res) => {
    const queryString = req.url.includes('?') ? req.url.substring(req.url.indexOf('?')) : '';
    res.redirect(`${process.env.CLIENT_URL || 'http://localhost:5173'}/payment/callback${queryString}`);
  });
}

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Something went wrong!'
  });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});