import { useState, useEffect } from 'react';
import { usePayment } from '../contexts/PaymentContext';
import PaymentButton from './PaymentButton';

const PaymentModal = ({ 
  isOpen, 
  onClose, 
  amount, 
  email, 
  metadata = {},
  title = 'Complete Payment'
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const { loading } = usePayment();

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
    } else {
      // Delay hiding the modal to allow for animation
      setTimeout(() => {
        setIsVisible(false);
      }, 300);
    }
  }, [isOpen]);

  if (!isVisible) return null;

  return (
    <div className={`payment-modal-overlay ${isOpen ? 'active' : 'closing'}`}>
      <div className="payment-modal">
        <div className="payment-modal-header">
          <h2>{title}</h2>
          <button 
            className="close-button" 
            onClick={onClose}
            disabled={loading}
          >
            &times;
          </button>
        </div>
        
        <div className="payment-modal-body">
          <div className="payment-details">
            {amount && (
              <div className="amount-display">
                {/* <span className="currency">₦</span> */}
                <span className="currency">KES</span>
                <span className="amount">{parseFloat(amount).toLocaleString()}</span>
              </div>
            )}
            
            <PaymentButton 
              amount={amount} 
              email={email} 
              metadata={metadata} 
              buttonText="Proceed to Payment"
            />
          </div>
        </div>
        
        <div className="payment-modal-footer">
          <div className="secure-payment-note">
            <span role="img" aria-label="lock">🔒</span> Payments are secure and encrypted
          </div>
          <img 
            src="https://paystack.com/images/paystack-badge-payment-options.png" 
            alt="Paystack Payment Options" 
            className="payment-options-img"
          />
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;