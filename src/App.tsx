import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import LoginForm from './components/auth/LoginForm';
import RegisterForm from './components/auth/RegisterForm';
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import Home from './components/Home';
import UserProfile from './components/profile/UserProfile';
import AdminDashboard from './components/admin/AdminDashboard';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};

const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

const AppContent: React.FC = () => {
  const { user } = useAuth();

  return (
    <Router>
      <Routes>
        <Route 
          path="/login" 
          element={user ? <Navigate to="/" replace /> : <LoginForm />} 
        />
        <Route 
          path="/register" 
          element={user ? <Navigate to="/" replace /> : <RegisterForm />} 
        />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <AppLayout>
                <Home />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile/:username"
          element={
            <ProtectedRoute>
              <AppLayout>
                <UserProfile />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AppLayout>
                <AdminDashboard />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/explore"
          element={
            <ProtectedRoute>
              <AppLayout>
                <div className="p-6 text-center">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">Explore</h2>
                  <p className="text-gray-600 dark:text-gray-400 mt-2">Coming soon...</p>
                </div>
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/notifications"
          element={
            <ProtectedRoute>
              <AppLayout>
                <div className="p-6 text-center">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">Notifications</h2>
                  <p className="text-gray-600 dark:text-gray-400 mt-2">Coming soon...</p>
                </div>
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/messages"
          element={
            <ProtectedRoute>
              <AppLayout>
                <div className="p-6 text-center">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">Messages</h2>
                  <p className="text-gray-600 dark:text-gray-400 mt-2">Coming soon...</p>
                </div>
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/bookmarks"
          element={
            <ProtectedRoute>
              <AppLayout>
                <div className="p-6 text-center">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">Bookmarks</h2>
                  <p className="text-gray-600 dark:text-gray-400 mt-2">Coming soon...</p>
                </div>
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <AppLayout>
                <div className="p-6 text-center">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">Settings</h2>
                  <p className="text-gray-600 dark:text-gray-400 mt-2">Coming soon...</p>
                </div>
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
};

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;