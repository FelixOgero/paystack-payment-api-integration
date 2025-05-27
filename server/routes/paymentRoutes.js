// const express = require('express');
// const router = express.Router();
// const {
//   initializePayment,
//   verifyPayment,
//   handleWebhook,
//   getTransactionHistory,
//   getTransactionByReference
// } = require('../controllers/paymentController');

// // Initialize payment
// router.post('/initialize', initializePayment);

// // Verify payment
// router.get('/verify/:reference', verifyPayment);

// // Paystack webhook
// router.post('/webhook', handleWebhook);

// // Get transaction history
// router.get('/transactions', getTransactionHistory);

// // Get transaction by reference
// router.get('/transaction/:reference', getTransactionByReference);

// module.exports = router;



const express = require('express');
const router = express.Router();
const {
  initializePayment,
  verifyPayment,
  handleWebhook,
  getTransactionHistory,
  getTransactionByReference
} = require('../controllers/paymentController');

// Initialize payment
router.post('/initialize', initializePayment);

// Verify payment
router.get('/verify/:reference', verifyPayment);

// Paystack webhook
router.post('/webhook', handleWebhook);

// Get transaction history
router.get('/transactions', getTransactionHistory);

// Get transaction by reference
router.get('/transaction/:reference', getTransactionByReference);

module.exports = router;