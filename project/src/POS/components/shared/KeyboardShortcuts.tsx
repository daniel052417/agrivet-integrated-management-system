import React, { useEffect } from 'react';

interface KeyboardShortcutsProps {
  onNewSale: () => void;
  onSearch: () => void;
  onPayment: () => void;
  onPrint: () => void;
  onCancel: () => void;
}

const KeyboardShortcuts: React.FC<KeyboardShortcutsProps> = ({
  onNewSale,
  onSearch,
  onPayment,
  onPrint,
  onCancel,
}) => {
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      // Prevent shortcuts when typing in inputs
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return;
      }

      // Check for Ctrl/Cmd + key combinations
      if (event.ctrlKey || event.metaKey) {
        switch (event.key.toLowerCase()) {
          case 'n':
            event.preventDefault();
            onNewSale();
            break;
          case 'f':
            event.preventDefault();
            onSearch();
            break;
          case 'p':
            event.preventDefault();
            onPayment();
            break;
          case 'r':
            event.preventDefault();
            onPrint();
            break;
          case 'escape':
            event.preventDefault();
            onCancel();
            break;
        }
      }

      // Function keys
      switch (event.key) {
        case 'F1':
          event.preventDefault();
          onNewSale();
          break;
        case 'F2':
          event.preventDefault();
          onSearch();
          break;
        case 'F3':
          event.preventDefault();
          onPayment();
          break;
        case 'F4':
          event.preventDefault();
          onPrint();
          break;
        case 'Escape':
          event.preventDefault();
          onCancel();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyPress);

    return () => {
      document.removeEventListener('keydown', handleKeyPress);
    };
  }, [onNewSale, onSearch, onPayment, onPrint, onCancel]);

  return null;
};

export default KeyboardShortcuts;







