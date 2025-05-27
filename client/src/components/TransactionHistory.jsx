import { useEffect, useState } from 'react';
import { usePayment } from '../contexts/PaymentContext';

const TransactionHistory = ({ email = null, limit = 10 }) => {
  const { 
    getTransactionHistory, 
    transactions, 
    loading, 
    error 
  } = usePayment();
  
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const fetchTransactions = async () => {
      const result = await getTransactionHistory(email, currentPage, limit);
      if (result) {
        setTotalPages(result.totalPages);
      }
    };

    fetchTransactions();
  }, [currentPage, email, limit]);

  const handlePageChange = (newPage) => {
    if (newPage > 0 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  // Format date
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Format amount
  const formatAmount = (amount) => {
    return new Intl.NumberFormat('en-NG', { 
      style: 'currency', 
      // currency: 'NGN',
      currency: 'KES',
      minimumFractionDigits: 2
    }).format(amount);
  };

  // Get status class
  const getStatusClass = (status) => {
    switch (status) {
      case 'success':
        return 'status-success';
      case 'failed':
        return 'status-failed';
      default:
        return 'status-pending';
    }
  };

  if (loading && transactions.length === 0) {
    return <div className="loading">Loading transactions...</div>;
  }

  if (error && transactions.length === 0) {
    return <div className="error-message">{error}</div>;
  }

  if (transactions.length === 0) {
    return <div className="no-transactions">No transactions found.</div>;
  }

  return (
    <div className="transaction-history">
      <h2>Transaction History</h2>
      
      <div className="transaction-table-container">
        <table className="transaction-table">
          <thead>
            <tr>
              <th>Reference</th>
              <th>Date</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Payment Method</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((transaction) => (
              <tr key={transaction.reference}>
                <td>{transaction.reference}</td>
                <td>{formatDate(transaction.createdAt)}</td>
                <td>{formatAmount(transaction.amount)}</td>
                <td>
                  <span className={`status-badge ${getStatusClass(transaction.status)}`}>
                    {transaction.status}
                  </span>
                </td>
                <td>{transaction.paymentMethod || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pagination">
          <button 
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1 || loading}
          >
            Previous
          </button>
          
          <span className="page-info">
            Page {currentPage} of {totalPages}
          </span>
          
          <button 
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages || loading}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default TransactionHistory;