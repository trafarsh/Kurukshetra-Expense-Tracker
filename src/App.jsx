import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Ledger from './pages/Ledger';
import Admin from './pages/Admin';
import TeamProgress from './pages/TeamProgress';
import MyDues from './pages/MyDues';

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/ledger" element={<Ledger />} />
        <Route path="/team-progress" element={<TeamProgress />} />
        <Route path="/my-dues" element={<MyDues />} />
        <Route path="/admin" element={<Admin />} />
      </Route>
      {/* Catch all to redirect to home */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}

export default App;
