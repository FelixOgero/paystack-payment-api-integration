const Transaction = require('../models/Transaction');
const { 
  initializeTransaction, 
  verifyTransaction,
  calculatePaystackFee,
  validateWebhook
} = require('../utils/paystackUtils');

const crypto = require('crypto');

// Generate a unique reference for the transaction
const generateReference = () => {
  const timestamp = Date.now().toString();
  const random = Math.floor(Math.random() * 1000000).toString();
  return `ref-${timestamp}-${random}`;
};

// Initialize a payment transaction
exports.initializePayment = async (req, res) => {
  try {
    const { email, amount, metadata = {} } = req.body;
    
    if (!email || !amount) {
      return res.status(400).json({ message: 'Email and amount are required' });
    }
    
    // Generate a unique reference for this transaction
    const reference = generateReference();
    
    // Create a pending transaction in our database
    const transaction = new Transaction({
      email,
      amount,
      reference,
      status: 'pending',
      metadata
    });
    
    await transaction.save();
    
    // Initialize the transaction with Paystack
    const paystackResponse = await initializeTransaction(email, amount, reference, metadata);
    
    res.status(200).json({
      success: true,
      message: 'Payment initialized',
      data: {
        reference,
        authorization_url: paystackResponse.data.authorization_url,
        transaction_id: transaction._id
      }
    });
  } catch (error) {
    console.error('Payment initialization error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to initialize payment'
    });
  }
};

// Verify a payment transaction
exports.verifyPayment = async (req, res) => {
  try {
    const { reference } = req.params;
    
    if (!reference) {
      return res.status(400).json({ message: 'Reference is required' });
    }
    
    // Verify the transaction with Paystack
    const paystackResponse = await verifyTransaction(reference);
    
    if (paystackResponse.data.status === 'success') {
      // Find and update the transaction in our database
      const transaction = await Transaction.findOne({ reference });
      
      if (!transaction) {
        return res.status(404).json({ message: 'Transaction not found' });
      }
      
      // Update transaction details
      transaction.status = 'success';
      transaction.paymentMethod = paystackResponse.data.channel;
      transaction.paystackFee = calculatePaystackFee(transaction.amount);
      
      // If card was used, store the card details
      if (paystackResponse.data.authorization) {
        transaction.cardType = paystackResponse.data.authorization.card_type;
        transaction.last4 = paystackResponse.data.authorization.last4;
      }
      
      await transaction.save();
      
      return res.status(200).json({
        success: true,
        message: 'Payment verified successfully',
        data: transaction
      });
    } else {
      // Update the transaction as failed
      const transaction = await Transaction.findOneAndUpdate(
        { reference },
        { status: 'failed' },
        { new: true }
      );
      
      return res.status(400).json({
        success: false,
        message: 'Payment verification failed',
        data: transaction
      });
    }
  } catch (error) {
    console.error('Payment verification error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to verify payment'
    });
  }
};

// Process Paystack webhook
// exports.handleWebhook = async (req, res) => {
//   try {
//     // Retrieve the signature from the headers
//     const signature = req.headers['x-paystack-signature'];
    
//     // Validate webhook
//     if (!validateWebhook(signature, req.body)) {
//       return res.status(401).send('Invalid signature');
//     }
    
//     // Handle the webhook event
//     const event = req.body;
    
//     if (event.event === 'charge.success') {
//       const { reference } = event.data;
      
//       // Find the transaction in our database
//       const transaction = await Transaction.findOne({ reference });
      
//       if (!transaction) {
//         return res.status(404).send('Transaction not found');
//       }
      
//       // Update transaction details
//       transaction.status = 'success';
//       transaction.paymentMethod = event.data.channel;
//       transaction.paystackFee = event.data.fees / 100; // Convert from kobo
      
//       // If card was used, store the card details
//       if (event.data.authorization) {
//         transaction.cardType = event.data.authorization.card_type;
//         transaction.last4 = event.data.authorization.last4;
//       }
      
//       await transaction.save();
      
//       // Perform any other business logic here (e.g., send email, update order status)
      
//       return res.status(200).send('Webhook processed successfully');
//     }
    
//     // For other events
//     return res.status(200).send('Webhook received');
//   } catch (error) {
//     console.error('Webhook processing error:', error);
//     return res.status(500).send('Webhook processing failed');
//   }
// };

// Process Paystack webhook
exports.handleWebhook = async (req, res) => {
  try {
    // Retrieve the signature from the headers
    const signature = req.headers['x-paystack-signature'];
    
    // Convert raw body to string for validation
    const body = req.body.toString();
    
    // Validate webhook
    if (!validateWebhook(signature, body)) {
      return res.status(401).send('Invalid signature');
    }
    
    // Parse the JSON body
    const event = JSON.parse(body);
    
    if (event.event === 'charge.success') {
      const { reference } = event.data;
      
      // Find the transaction in our database
      const transaction = await Transaction.findOne({ reference });
      
      if (!transaction) {
        return res.status(404).send('Transaction not found');
      }
      
      // Update transaction details
      transaction.status = 'success';
      transaction.paymentMethod = event.data.channel;
      transaction.paystackFee = event.data.fees / 100; // Convert from kobo
      
      // If card was used, store the card details
      if (event.data.authorization) {
        transaction.cardType = event.data.authorization.card_type;
        transaction.last4 = event.data.authorization.last4;
      }
      
      await transaction.save();
      
      // Perform any other business logic here (e.g., send email, update order status)
      
      return res.status(200).send('Webhook processed successfully');
    }
    
    // For other events
    return res.status(200).send('Webhook received');
  } catch (error) {
    console.error('Webhook processing error:', error);
    return res.status(500).send('Webhook processing failed');
  }
};

// Get transaction history
exports.getTransactionHistory = async (req, res) => {
  try {
    // Optional filtering by email
    const filter = {};
    if (req.query.email) {
      filter.email = req.query.email;
    }
    
    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    const transactions = await Transaction.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    const total = await Transaction.countDocuments(filter);
    
    res.status(200).json({
      success: true,
      count: transactions.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      data: transactions
    });
  } catch (error) {
    console.error('Error fetching transaction history:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch transaction history'
    });
  }
};

// Get a single transaction by reference
exports.getTransactionByReference = async (req, res) => {
  try {
    const { reference } = req.params;
    
    const transaction = await Transaction.findOne({ reference });
    
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }
    
    res.status(200).json({
      success: true,
      data: transaction
    });
  } catch (error) {
    console.error('Error fetching transaction:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch transaction'
    });
  }
};