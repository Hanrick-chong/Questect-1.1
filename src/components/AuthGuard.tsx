import React, { useState, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { auth, db } from '../lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { UserPlan, hasPlanAccess } from '../lib/constants';
import { Activity } from 'lucide-react';

interface AuthGuardProps {
  children: React.ReactNode;
  requiredPlan?: UserPlan;
}

export default function AuthGuard({ children, requiredPlan = 'free' }: AuthGuardProps) {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [plan, setPlan] = useState<UserPlan>('free');
  const location = useLocation();

  useEffect(() => {
    let unsubscribeProfile: (() => void) | undefined;

    const unsubscribeAuth = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
      
      // Cleanup previous profile listener if it exists
      if (unsubscribeProfile) {
        unsubscribeProfile();
        unsubscribeProfile = undefined;
      }

      if (currentUser) {
        unsubscribeProfile = onSnapshot(doc(db, 'users', currentUser.uid), (doc) => {
          if (doc.exists()) {
            setPlan(doc.data().plan as UserPlan || 'free');
          }
          setLoading(false);
        });
      } else {
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeProfile) unsubscribeProfile();
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#001220] flex items-center justify-center">
        <Activity className="text-[#00FFFF] animate-pulse" size={40} />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  if (!hasPlanAccess(plan, requiredPlan)) {
    return <Navigate to="/pricing" state={{ locked: true, required: requiredPlan }} replace />;
  }

  return <>{children}</>;
}
