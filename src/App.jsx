import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import { DataProvider } from './contexts/DataContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { BrandingProvider } from './contexts/BrandingContext';
import Layout from './components/Layout/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import CreateTransaction from './pages/CreateTransaction';
import CashierPanel from './pages/CashierPanel';
import Reports from './pages/Reports';
import MonthlyReport from './pages/MonthlyReport';
import SuperFilter from './pages/SuperFilter';
import AdminPanel from './pages/AdminPanel';
import Platform from './pages/Platform';
import ProtectedRoute from './components/ProtectedRoute';
import './App.css';

function App() {
  return (
    <LanguageProvider>
      <BrandingProvider>
        <AuthProvider>
          <DataProvider>
            <Router>
              <div className="min-h-screen bg-gray-50">
                <Toaster 
                  position="top-right"
                  toastOptions={{
                    duration: 4000,
                    style: {
                      background: '#363636',
                      color: '#fff',
                    },
                  }} 
                />
                <Routes>
                  <Route path="/login" element={<Login />} />
                  <Route path="/" element={<Navigate to="/dashboard" replace />} />
                  <Route 
                    path="/*" 
                    element={
                      <ProtectedRoute>
                        <Layout>
                          <Routes>
                            <Route path="/dashboard" element={<Dashboard />} />
                            <Route path="/transactions" element={<Transactions />} />
                            <Route path="/create-transaction" element={<CreateTransaction />} />
                            <Route path="/cashier-panel" element={<CashierPanel />} />
                            <Route path="/reports" element={<Reports />} />
                            <Route path="/monthly-report" element={<MonthlyReport />} />
                            <Route path="/super-filter" element={<SuperFilter />} />
                            <Route path="/admin-panel" element={<AdminPanel />} />
                            <Route path="/platform" element={<Platform />} />
                          </Routes>
                        </Layout>
                      </ProtectedRoute>
                    } 
                  />
                </Routes>
              </div>
            </Router>
          </DataProvider>
        </AuthProvider>
      </BrandingProvider>
    </LanguageProvider>
  );
}

export default App;