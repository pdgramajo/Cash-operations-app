import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

const SessionsPage = lazy(() => import('./pages/SessionsPage').then(m => ({ default: m.default })));
const SessionPage = lazy(() => import('./pages/SessionPage').then(m => ({ default: m.default })));
const ReportsPage = lazy(() => import('./pages/ReportsPage').then(m => ({ default: m.default })));
const ReceiptsPage = lazy(() => import('./pages/ReceiptsPage').then(m => ({ default: m.default })));

function App() {
  return (
    <BrowserRouter basename="/Cash-operations-app">
      <Suspense fallback={<div className="container mx-auto p-4 max-w-md">Cargando...</div>}>
        <Routes>
          <Route path="/" element={<SessionsPage />} />
          <Route path="/session/:sessionId" element={<SessionPage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/receipts" element={<ReceiptsPage />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
