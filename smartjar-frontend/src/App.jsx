import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import SendMoney from './pages/SendMoney';
import Wallet from './pages/Wallet';
import Gold from './pages/Gold';
import Savings from './pages/Savings';
import Bills from './pages/Bills';
import QrScanner from './pages/QrScanner';
import Settings from './pages/Settings';

const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/login" />;
};

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        <Route path="/send" element={<PrivateRoute><SendMoney /></PrivateRoute>} />
        <Route path="/wallet" element={<PrivateRoute><Wallet /></PrivateRoute>} />
        <Route path="/gold" element={<PrivateRoute><Gold /></PrivateRoute>} />
        <Route path="/savings" element={<PrivateRoute><Savings /></PrivateRoute>} />
        <Route path="/bills" element={<PrivateRoute><Bills /></PrivateRoute>} />
        <Route path="/qr" element={<PrivateRoute><QrScanner /></PrivateRoute>} />
        <Route path="/settings" element={<PrivateRoute><Settings /></PrivateRoute>} />
      </Routes>
    </BrowserRouter>
  );
}
