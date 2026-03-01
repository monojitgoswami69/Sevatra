import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Login, Register } from './pages/auth';
import { Dashboard, NewAdmission, Staff, NewStaff } from './pages/dashboard';
import { DoctorDashboard, MyPatients, PatientUpdate, ClinicalNotes, DoctorProfile, Schedule } from './pages/doctor';
import ErrorBoundary from './components/ErrorBoundary';
import NotFound from './pages/NotFound';
import { useAuth } from './context/AuthContext';

/** Redirect `/` based on role, or to login if unauthenticated. */
function RootRedirect() {
  const { isAuthenticated, isDoctor } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <Navigate to={isDoctor ? '/doctor' : '/overview'} replace />;
}

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          {/* Auth */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Admin routes */}
          <Route path="/overview" element={<Dashboard />} />
          <Route path="/newadmission" element={<NewAdmission />} />
          <Route path="/staff" element={<Staff />} />
          <Route path="/new-staff" element={<NewStaff />} />

          {/* Doctor routes */}
          <Route path="/doctor" element={<DoctorDashboard />} />
          <Route path="/doctor/patients" element={<MyPatients />} />
          <Route path="/doctor/patients/:id" element={<PatientUpdate />} />
          <Route path="/doctor/schedule" element={<Schedule />} />
          <Route path="/doctor/notes" element={<ClinicalNotes />} />
          <Route path="/doctor/profile" element={<DoctorProfile />} />

          {/* Root → role-based redirect */}
          <Route path="/" element={<RootRedirect />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;

