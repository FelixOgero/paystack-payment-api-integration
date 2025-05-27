import { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import { PaymentProvider, usePayment } from "./contexts/PaymentContext";
import PaymentButton from "./components/PaymentButton";
import PaymentModal from "./components/PaymentModal";
import TransactionHistory from "./components/TransactionHistory";
import "./index.css";

// Payment callback component to handle return from Paystack
const PaymentCallback = () => {
  const { verifyPayment, transaction, error, loading } = usePayment();
  const [verified, setVerified] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const verifyTransaction = async () => {
      // Get reference from URL
      const urlParams = new URLSearchParams(location.search);
      const reference = urlParams.get("reference");

      if (reference) {
        const result = await verifyPayment(reference);
        if (result) {
          setVerified(true);
        }
      }
    };

    verifyTransaction();
  }, [location]);

  if (loading) {
    return <div className="callback-container">Verifying your payment...</div>;
  }

  if (error) {
    return (
      <div className="callback-container error">
        <h2>Payment Verification Failed</h2>
        <p>{error}</p>
        <button onClick={() => window.location.href = "/"}>
          Return to Homepage
        </button>
      </div>
    );
  }

  if (verified && transaction) {
    return (
      <div className="callback-container success">
        <h2>Payment Successful!</h2>
        <div className="transaction-details">
          <p>
            <strong>Reference:</strong> {transaction.reference}
          </p>
          <p>
            {/* <strong>Amount:</strong> ₦{transaction.amount} */}
            <strong>Amount:</strong> KES{transaction.amount}
          </p>
          <p>
            <strong>Status:</strong> {transaction.status}
          </p>
          <p>
            <strong>Payment Method:</strong>{" "}
            {transaction.paymentMethod || "N/A"}
          </p>
        </div>
        <button onClick={() => window.location.href = "/"}>
          Return to Homepage
        </button>
      </div>
    );
  }

  return <div className="callback-container">Processing...</div>;
};

// Home page component
const Home = () => {
  const [showModal, setShowModal] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [amount, setAmount] = useState(5000);

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>Paystack MERN Integration</h1>
      </header>

      <main className="app-main">
        <div className="payment-options">
          <h2>Choose a Payment Option</h2>

          <div className="payment-card">
            <h3>Direct Payment</h3>
            <p>Make a quick payment with the default amount</p>
            <PaymentButton
              amount={amount}
              buttonText="Pay KES5,000"
              metadata={{ product_name: "Test Product" }}
            />
          </div>

          <div className="payment-card">
            <h3>Custom Payment</h3>
            <p>Open a modal to customize your payment</p>
            <button
              className="payment-button"
              onClick={() => setShowModal(true)}
            >
              Custom Payment
            </button>
          </div>
        </div>

        <div className="transaction-section">
          <button
            className="toggle-history-button"
            onClick={() => setShowHistory(!showHistory)}
          >
            {showHistory
              ? "Hide Transaction History"
              : "Show Transaction History"}
          </button>

          {showHistory && <TransactionHistory />}
        </div>
      </main>

      <PaymentModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Complete Your Payment"
      />

      <footer className="app-footer">
        <p>MERN Stack Paystack Integration | © {new Date().getFullYear()}</p>
      </footer>
    </div>
  );
};

// Root app component with router and provider
const App = () => {
  return (
    <PaymentProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/payment/callback" element={<PaymentCallback />} />
        </Routes>
      </Router>
    </PaymentProvider>
  );
};

export default App;