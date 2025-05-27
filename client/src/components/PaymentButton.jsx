import { useState } from 'react';
import { usePayment } from '../contexts/PaymentContext';

const PaymentButton = ({ amount, email, metadata = {}, buttonText = 'Pay Now' }) => {
  const { initializePayment, loading, error } = usePayment();
  const [localEmail, setLocalEmail] = useState(email || '');
  const [localAmount, setLocalAmount] = useState(amount || '');
  const [showForm, setShowForm] = useState(!email || !amount);

  const handlePayment = async (e) => {
    if (e) e.preventDefault();
    
    if (!localEmail || !localAmount) {
      alert('Email and amount are required');
      return;
    }

    await initializePayment({
      email: localEmail,
      amount: parseFloat(localAmount),
      metadata
    });
  };

  return (
    <div className="payment-button-container">
      {error && <div className="error-message">{error}</div>}
      
      {showForm ? (
        <form onSubmit={handlePayment} className="payment-form">
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              value={localEmail}
              onChange={(e) => setLocalEmail(e.target.value)}
              required
              placeholder="Enter your email"
            />
          </div>
          
          <div className="form-group">
            {/* <label htmlFor="amount">Amount (₦)</label> */}
            <label htmlFor="amount">Amount (KES)</label>
            <input
              type="number"
              id="amount"
              value={localAmount}
              onChange={(e) => setLocalAmount(e.target.value)}
              required
              min="100"
              step="0.01"
              placeholder="Enter amount"
            />
          </div>
          
          <button 
            type="submit" 
            className="payment-button" 
            disabled={loading}
          >
            {loading ? 'Processing...' : buttonText}
          </button>
        </form>
      ) : (
        <button 
          onClick={handlePayment} 
          className="payment-button" 
          disabled={loading}
        >
          {loading ? 'Processing...' : buttonText}
        </button>
      )}
    </div>
  );
};

export default PaymentButton;