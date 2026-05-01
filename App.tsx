import React from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Header from './components/Header';
import HomeBookingFlow from './components/HomeBookingFlow';
import Admin from './components/admin/Admin';
import ProtectedRoute from './components/admin/ProtectedRoute';
import SupabaseProtectedRoute from './src/components/SupabaseProtectedRoute';
import ProfilesList from './components/ProfilesList';
import TestSupabaseConnection from './components/TestSupabaseConnection';
import Footer from './components/Footer';
import ClientLoginPage from './components/client/ClientLoginPage';
import ClientBookingsPage from './components/client/ClientBookingsPage';
import Login from './src/pages/Login';
import Dashboard from './src/pages/Dashboard';
import ForgotPassword from './src/pages/ForgotPassword';
import ResetPassword from './src/pages/ResetPassword';

const App: React.FC = () => {
  const location = useLocation();

  const isAdminRoute = location.pathname.startsWith('/admin');

  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans flex flex-col">
      <Header />
      <main className={`${isAdminRoute ? 'w-full px-4 md:px-6 py-4 md:py-6' : 'container mx-auto p-4 md:p-8'} flex-grow`}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/dashboard" element={<SupabaseProtectedRoute><Dashboard /></SupabaseProtectedRoute>} />
          <Route path="/admin" element={<ProtectedRoute><Admin /></ProtectedRoute>} />
          <Route path="/login-cliente" element={<ClientLoginPage />} />
          <Route path="/meus-agendamentos" element={<ClientBookingsPage />} />
          <Route path="/profiles" element={<ProfilesList />} />
          <Route path="/supabase-test" element={<TestSupabaseConnection />} />
          <Route path="/" element={<HomeBookingFlow courtesy={false} />} />
          <Route path="/cortesia" element={<HomeBookingFlow courtesy={true} />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
};

export default App;
