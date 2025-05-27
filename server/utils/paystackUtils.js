const axios = require('axios');
const dotenv = require('dotenv');
dotenv.config();

const PAYSTACK_BASE_URL = 'https://api.paystack.co';
const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

// Configure Axios for Paystack API requests
const paystackAPI = axios.create({
  baseURL: PAYSTACK_BASE_URL,
  headers: {
    Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
    'Content-Type': 'application/json'
  }
});

// Initialize a payment transaction
const initializeTransaction = async (email, amount, reference, metadata = {}) => {
  try {
    // Convert amount to kobo (Paystack processes amounts in the smallest currency unit)
    const amountInKobo = Math.floor(amount * 100);
    
    const response = await paystackAPI.post('/transaction/initialize', {
      email,
      amount: amountInKobo,
      reference,
      callback_url: process.env.PAYSTACK_CALLBACK_URL,
      metadata: JSON.stringify(metadata)
    });
    
    return response.data;
  } catch (error) {
    console.error('Paystack initialization error:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || 'Failed to initialize payment');
  }
};

// Verify a payment transaction
const verifyTransaction = async (reference) => {
  try {
    const response = await paystackAPI.get(`/transaction/verify/${reference}`);
    return response.data;
  } catch (error) {
    console.error('Paystack verification error:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || 'Failed to verify payment');
  }
};

// List transactions
const listTransactions = async (perPage = 10, page = 1) => {
  try {
    const response = await paystackAPI.get('/transaction', {
      params: { perPage, page }
    });
    return response.data;
  } catch (error) {
    console.error('Failed to fetch transactions:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || 'Failed to fetch transactions');
  }
};

// Fetch transaction by ID
const fetchTransaction = async (id) => {
  try {
    const response = await paystackAPI.get(`/transaction/${id}`);
    return response.data;
  } catch (error) {
    console.error('Failed to fetch transaction:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || 'Failed to fetch transaction');
  }
};

// Calculate Paystack fee
const calculatePaystackFee = (amount) => {
  
  const feePercentage = 0.015;
  const baseFee = 100;
  const maxFee = 2000;
  
  let fee = (amount * feePercentage) + baseFee;
  return Math.min(fee, maxFee);
};

// Validate Paystack webhook
const validateWebhook = (signature, requestBody) => {
  const crypto = require('crypto');
  const secret = process.env.PAYSTACK_SECRET_KEY;
  
  const hash = crypto
    .createHmac('sha512', secret)
    .update(JSON.stringify(requestBody))
    .digest('hex');
    
  return hash === signature;
};

module.exports = {
  initializeTransaction,
  verifyTransaction,
  listTransactions,
  fetchTransaction,
  calculatePaystackFee,
  validateWebhook
};