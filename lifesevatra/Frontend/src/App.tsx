import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Login, Register } from './pages/auth';
import { Dashboard, NewAdmission, Staff, NewStaff } from './pages/dashboard';
import ErrorBoundary from './components/ErrorBoundary';
import NotFound from './pages/NotFound';

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/overview" element={<Dashboard />} />
          <Route path="/newadmission" element={<NewAdmission />} />
          <Route path="/staff" element={<Staff />} />
          <Route path="/new-staff" element={<NewStaff />} />
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;

