import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Features from './pages/Features';
import Pricing from './pages/Pricing';
import About from './pages/About';
import Grader from './pages/Grader';
import Auth from './pages/Auth';
import Workspace from './pages/Workspace';
import Billing from './pages/Billing';
import History from './pages/History';
import Dashboard from './pages/Dashboard';
import EnterpriseInquiry from './pages/EnterpriseInquiry';
import Success from './pages/payment/Success';
import Cancel from './pages/payment/Cancel';
import Processing from './pages/payment/Processing';
import AuthGuard from './components/AuthGuard';
import TermsOfService from './pages/legal/TermsOfService';
import PrivacyPolicy from './pages/legal/PrivacyPolicy';
import BillingPolicy from './pages/legal/BillingPolicy';
import { APP_NAME } from './lib/constants';

// Error Boundary Component
class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean, error: any }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      let errorMessage = "Something went wrong.";
      try {
        // Check if it's our Firestore JSON error
        const parsed = JSON.parse(this.state.error.message);
        if (parsed.error) {
          errorMessage = `Database Error: ${parsed.error} (${parsed.operationType} at ${parsed.path})`;
        }
      } catch (e) {
        errorMessage = this.state.error?.message || errorMessage;
      }

      return (
        <div className="min-h-screen bg-oxford-blue flex items-center justify-center p-4 text-center">
          <div className="glass-card p-8 max-w-md w-full border border-white/10">
            <h2 className="text-2xl font-black text-white uppercase tracking-widest mb-4">Application Error</h2>
            <p className="text-white/60 text-sm mb-6 leading-relaxed">
              {errorMessage}
            </p>
            <button 
              onClick={() => window.location.reload()}
              className="btn-primary px-8 py-3 rounded-xl font-black uppercase tracking-widest text-xs"
            >
              Reload Application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

function AppContent() {
  const location = useLocation();
  const isAuthPage = location.pathname === '/auth';
  const isLegalPage = location.pathname.startsWith('/legal');

  return (
    <div className="min-h-screen bg-oxford-blue text-white selection:bg-electric-cyan selection:text-oxford-blue">
      {!isLegalPage && <Navbar />}
      <main>
        <ErrorBoundary>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/features" element={<Features />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/about" element={<About />} />
            <Route path="/grader/quick" element={<AuthGuard><Grader mode="quick" /></AuthGuard>} />
            <Route path="/grader/exam" element={<AuthGuard requiredPlan="starter"><Grader mode="exam" /></AuthGuard>} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/analyze" element={<AuthGuard><Workspace initialMode="analyze" /></AuthGuard>} />
            <Route path="/system" element={<AuthGuard><Workspace initialMode="system" /></AuthGuard>} />
            <Route path="/billing" element={<AuthGuard><Billing /></AuthGuard>} />
            <Route path="/history" element={<AuthGuard requiredPlan="pro"><History /></AuthGuard>} />
            <Route path="/dashboard" element={<AuthGuard><Dashboard /></AuthGuard>} />
            <Route path="/payment-success" element={<AuthGuard><Success /></AuthGuard>} />
            <Route path="/payment-cancel" element={<AuthGuard><Cancel /></AuthGuard>} />
            <Route path="/upgrade-processing" element={<AuthGuard><Processing /></AuthGuard>} />
            <Route path="/enterprise-inquiry" element={<EnterpriseInquiry />} />
            <Route path="/legal/terms" element={<TermsOfService />} />
            <Route path="/legal/privacy" element={<PrivacyPolicy />} />
            <Route path="/legal/billing" element={<BillingPolicy />} />
          </Routes>
        </ErrorBoundary>
      </main>
      
      {!isAuthPage && !isLegalPage && (
        <footer className="py-10 border-t border-white/5 text-center text-white/20 text-xs tracking-widest uppercase">
          &copy; 2026 {APP_NAME}. Global Standards. Local Precision.
        </footer>
      )}
    </div>
  );
}
