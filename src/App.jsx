import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import ModernHome from './pages/ModernHome';
import About from './pages/about';
import Login from './pages/login';
import Signup from './pages/signup';
import UserDashboard from './pages/UserDashboard';
import AdminDashboard from './pages/AdminDashboard';
import KediAdminDashboard from './pages/KediAdminDashboard';
import KediUserDashboard from './pages/KediUserDashboard';
import UserProfile from './pages/UserProfile';
import AdminLogin from './pages/AdminLogin';
import NewsDetail from './pages/NewsDetail';
import ErrorBoundary from './components/ErrorBoundary';

function App() {
  const role = localStorage.getItem('role');
  const token = localStorage.getItem('token');

  return (
    <ErrorBoundary>
      <Router>
        <Routes>
          <Route path="/" element={<ModernHome />} />
          <Route path="/home" element={<ModernHome />} />
          <Route path="/about" element={<About />} />
          <Route path="/login" element={<Login />} />
          <Route path="/admin-login" element={<AdminLogin />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/news/:id" element={<NewsDetail />} />

          {/* Protected routes */}
          {token && role === 'user' && (
            <>
              <Route path="/user-dashboard" element={<UserDashboard />} />
              <Route path="/kedi-user-dashboard" element={<KediUserDashboard />} />
              <Route path="/user-profile" element={<UserProfile />} />
            </>
          )}
          {token && role === 'admin' && (
            <>
              <Route path="/admin-dashboard" element={<AdminDashboard />} />
              <Route path="/kedi-admin-dashboard" element={<KediAdminDashboard />} />
            </>
          )}

          {/* Default redirects for authenticated users */}
          {token && role === 'user' && (
            <Route path="/dashboard" element={<Navigate to="/kedi-user-dashboard" replace />} />
          )}
          {token && role === 'admin' && (
            <Route path="/dashboard" element={<Navigate to="/kedi-admin-dashboard" replace />} />
          )}

          {/* catch all */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
