import React from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext.js';
import LoadingScreen from './components/LoadingScreen.jsx';
import LoginPage from './pages/LoginPage.jsx';
import MainLayout from './pages/MainLayout.jsx';

const AppContent = () => {
  const { currentUser, userData, loadingAuth } = useAuth();

  if (loadingAuth) {
    return <LoadingScreen message="Authenticating..." />;
  }

  if (!currentUser || !userData) {
    return <LoginPage />;
  }

  return <MainLayout />;
};

const App = () => (
  <AuthProvider>
    <AppContent />
  </AuthProvider>
);

export default App;
