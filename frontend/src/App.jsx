import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/home';
import About from './pages/about';
import Login from './pages/login';
import Signup from './pages/signup';
import UserDashboard from './pages/UserDashboard';
import AdminDashboard from './pages/AdminDashboard';
import UserProfile from './pages/UserProfile';
import AdminLogin from './pages/AdminLogin';

function App() {
  const role = localStorage.getItem('role');
  const token = localStorage.getItem('token');

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/home" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/login" element={<Login />} />
        <Route path="/admin-login" element={<AdminLogin />} />
        <Route path="/signup" element={<Signup />} />
        
        {/* Protected routes */}
        {token && role === 'user' && (
          <>
            <Route path="/user-dashboard" element={<UserDashboard />} />
            <Route path="/user-profile" element={<UserProfile />} />
          </>
        )}
        {token && role === 'admin' && (
          <>
            <Route path="/admin-dashboard" element={<AdminDashboard />} />
          </>
        )}

        {/* catch all */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;
