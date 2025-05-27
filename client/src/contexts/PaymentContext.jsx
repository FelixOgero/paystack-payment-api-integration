import { createContext, useContext, useState } from "react";
import axios from "axios";

const PaymentContext = createContext();

export const usePayment = () => useContext(PaymentContext);

export const PaymentProvider = ({ children }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [transaction, setTransaction] = useState(null);
  const [transactions, setTransactions] = useState([]);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  // Initialize payment
  const initializePayment = async (paymentData) => {
    setLoading(true);
    setError(null);

    try {
      const response = await axios.post(
        `${API_URL}/payments/initialize`,
        paymentData
      );

      if (response.data.success) {
        const authorizationUrl = response.data.data.authorization_url;
        const reference = response.data.data.reference;
        
        setTransaction({
          reference: reference,
          authorization_url: authorizationUrl,
        });

        // Store the transaction reference in localStorage before redirecting
        localStorage.setItem('paystack_reference', reference);

        // Redirect to Paystack payment page
        window.location.href = authorizationUrl;

        return response.data.data;
      } else {
        throw new Error(
          response.data.message || "Failed to initialize payment"
        );
      }
    } catch (error) {
      setError(
        error.response?.data?.message || error.message || "Something went wrong"
      );
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Verify payment
  const verifyPayment = async (reference) => {
    setLoading(true);
    setError(null);

    try {
      // If no reference is provided, try to get it from localStorage
      if (!reference) {
        reference = localStorage.getItem('paystack_reference');
        if (!reference) {
          throw new Error("No payment reference found");
        }
      }

      const response = await axios.get(
        `${API_URL}/payments/verify/${reference}`
      );

      if (response.data.success) {
        setTransaction(response.data.data);
        // Clear the reference from localStorage after successful verification
        localStorage.removeItem('paystack_reference');
        return response.data.data;
      } else {
        throw new Error(response.data.message || "Payment verification failed");
      }
    } catch (error) {
      setError(
        error.response?.data?.message ||
          error.message ||
          "Failed to verify payment"
      );
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Get transaction history
  const getTransactionHistory = async (email = null, page = 1, limit = 10) => {
    setLoading(true);
    setError(null);

    try {
      let url = `${API_URL}/payments/transactions?page=${page}&limit=${limit}`;

      if (email) {
        url += `&email=${email}`;
      }

      const response = await axios.get(url);

      if (response.data.success) {
        setTransactions(response.data.data);
        return response.data;
      } else {
        throw new Error(
          response.data.message || "Failed to fetch transactions"
        );
      }
    } catch (error) {
      setError(
        error.response?.data?.message ||
          error.message ||
          "Failed to fetch transactions"
      );
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Get transaction by reference
  const getTransactionByReference = async (reference) => {
    setLoading(true);
    setError(null);

    try {
      const response = await axios.get(
        `${API_URL}/payments/transaction/${reference}`
      );

      if (response.data.success) {
        setTransaction(response.data.data);
        return response.data.data;
      } else {
        throw new Error(response.data.message || "Transaction not found");
      }
    } catch (error) {
      setError(
        error.response?.data?.message ||
          error.message ||
          "Failed to fetch transaction"
      );
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Clear transaction
  const clearTransaction = () => {
    setTransaction(null);
  };

  // Clear error
  const clearError = () => {
    setError(null);
  };

  const value = {
    loading,
    error,
    transaction,
    transactions,
    initializePayment,
    verifyPayment,
    getTransactionHistory,
    getTransactionByReference,
    clearTransaction,
    clearError,
  };

  return (
    <PaymentContext.Provider value={value}>{children}</PaymentContext.Provider>
  );
};