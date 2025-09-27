import React from 'react';
import POSApp from './App';
import OfflineIndicator from './components/shared/OfflineIndicator';
import KeyboardShortcuts from './components/shared/KeyboardShortcuts';
import './styles.css';

// POS System Entry Point
const POSSystem: React.FC = () => {
  const handleNewSale = () => {
    console.log('New sale started');
    // Navigate to cashier screen and start new sale
  };

  const handleSearch = () => {
    console.log('Search activated');
    // Focus on search input
  };

  const handlePayment = () => {
    console.log('Payment process started');
    // Open payment modal
  };

  const handlePrint = () => {
    console.log('Print receipt');
    // Print current receipt
  };

  const handleCancel = () => {
    console.log('Cancel current operation');
    // Cancel current operation
  };

  return (
    <div className="pos-system">
      <POSApp />
      <OfflineIndicator />
      <KeyboardShortcuts
        onNewSale={handleNewSale}
        onSearch={handleSearch}
        onPayment={handlePayment}
        onPrint={handlePrint}
        onCancel={handleCancel}
      />
    </div>
  );
};

export default POSSystem;
