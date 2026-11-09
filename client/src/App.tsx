import React from 'react';
import { useAuth } from './lib/auth';
import { Routes } from './lib/router';
import { Layout } from './components/Layout';
import { Button, Empty } from './components/ui';
import { navigate } from './lib/router';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Batches from './pages/Batches';
import BatchDetail from './pages/BatchDetail';
import Daily from './pages/Daily';
import DailyBatch from './pages/DailyBatch';
import Farms from './pages/Farms';
import { BillForm, BillView, SalesList } from './pages/Sales';
import Transactions from './pages/Transactions';
import CashBook from './pages/CashBook';
import { Ledger, Parties } from './pages/Parties';
import Reports from './pages/Reports';
import Settings from './pages/Settings';

export default function App() {
  const { user, ready } = useAuth();
  if (!ready) return <div style={{ display: 'grid', placeItems: 'center', height: '100vh' }}><span className="spin" style={{ color: 'var(--forest-700)', width: 28, height: 28 }} /></div>;
  if (!user) return <Login />;
  return (
    <Layout>
      <Routes
        routes={[
          { path: '/', element: <Dashboard /> },
          { path: '/batches', element: <Batches /> },
          { path: '/batches/:id', element: <BatchDetail /> },
          { path: '/daily', element: <Daily /> },
          { path: '/daily/:id', element: <DailyBatch /> },
          { path: '/farms', element: <Farms /> },
          { path: '/sales', element: <SalesList /> },
          { path: '/sales/new', element: <BillForm /> },
          { path: '/sales/:id', element: <BillView /> },
          { path: '/transactions', element: <Transactions /> },
          { path: '/cashbook', element: <CashBook /> },
          { path: '/parties', element: <Parties /> },
          { path: '/ledger/:id', element: <Ledger /> },
          { path: '/reports', element: <Reports /> },
          { path: '/settings', element: <Settings /> },
        ]}
        fallback={<Empty title="Page not found" icon="search"><div className="mt-12"><Button onClick={() => navigate('/')}>Go to dashboard</Button></div></Empty>}
      />
    </Layout>
  );
}
