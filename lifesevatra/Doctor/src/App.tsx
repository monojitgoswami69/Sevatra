import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { DoctorDashboard, MyPatients, PatientUpdate, DoctorProfile, Schedule, ClinicalNotes } from './pages/doctor';
import ErrorBoundary from './components/ErrorBoundary';
import NotFound from './pages/NotFound';

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          <Route path="/overview" element={<DoctorDashboard />} />
          <Route path="/patients" element={<MyPatients />} />
          <Route path="/patients/:id" element={<PatientUpdate />} />
          <Route path="/schedule" element={<Schedule />} />
          <Route path="/notes" element={<ClinicalNotes />} />
          <Route path="/profile" element={<DoctorProfile />} />
          <Route path="/" element={<Navigate to="/overview" replace />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;

