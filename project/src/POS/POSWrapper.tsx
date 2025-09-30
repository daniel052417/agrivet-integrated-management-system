import React, { Component, ErrorInfo, ReactNode } from 'react';
import POSApp from './App';
import FallbackPOS from './FallbackPOS';
import { SimplifiedUser } from '../lib/simplifiedAuth';

interface Props {
  user?: SimplifiedUser;
  onLogout?: () => void;
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class POSWrapper extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('POS System Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      // Fallback UI
      return <FallbackPOS />;
    }

    return <POSApp user={this.props.user} onLogout={this.props.onLogout} />;
  }
}

export default POSWrapper;







