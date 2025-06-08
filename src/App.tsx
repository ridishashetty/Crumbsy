import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { LoginForm } from './components/Auth/LoginForm';
import { SignupForm } from './components/Auth/SignupForm';
import { Header } from './components/Layout/Header';
import { BuyerDashboard } from './components/Dashboard/BuyerDashboard';
import { BakerPortfolio } from './components/Dashboard/BakerPortfolio';
import { PostedOrders } from './components/Dashboard/PostedOrders';
import { CakePlayground } from './components/Playground/CakePlayground';
import { OrdersPage } from './components/Orders/OrdersPage';
import { ProfilePage } from './components/Profile/ProfilePage';
import { MessagesPage } from './components/Messages/MessagesPage';
import { AdminPanel } from './components/Admin/AdminPanel';

function App() {
  const { isAuthenticated, user } = useAuthStore();
  const [isLoginMode, setIsLoginMode] = useState(true);

  if (!isAuthenticated) {
    return isLoginMode ? (
      <LoginForm onToggleMode={() => setIsLoginMode(false)} />
    ) : (
      <SignupForm onToggleMode={() => setIsLoginMode(true)} />
    );
  }

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        {user?.type !== 'admin' && <Header />}
        <Routes>
          <Route 
            path="/" 
            element={<Navigate to={user?.type === 'admin' ? '/admin' : '/dashboard'} replace />} 
          />
          
          {/* Admin Routes */}
          {user?.type === 'admin' && (
            <Route path="/admin" element={<AdminPanel />} />
          )}
          
          {/* Regular User Routes */}
          {user?.type !== 'admin' && (
            <>
              <Route 
                path="/dashboard" 
                element={
                  user?.type === 'buyer' ? (
                    <BuyerDashboard />
                  ) : (
                    <BakerPortfolio />
                  )
                } 
              />
              {/* Playground ONLY for buyers */}
              {user?.type === 'buyer' && (
                <Route path="/playground" element={<CakePlayground />} />
              )}
              {/* Posted Orders ONLY for bakers */}
              {user?.type === 'baker' && (
                <Route path="/orders" element={<PostedOrders />} />
              )}
              <Route path="/orders" element={<OrdersPage />} />
              <Route path="/messages" element={<MessagesPage />} />
              <Route path="/profile" element={<ProfilePage />} />
            </>
          )}
          
          {/* Redirect admin to admin panel */}
          {user?.type === 'admin' && (
            <Route path="*" element={<Navigate to="/admin" replace />} />
          )}
        </Routes>
      </div>
    </Router>
  );
}

export default App;