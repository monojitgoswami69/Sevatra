import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { OperatorProvider } from './context/OperatorContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Ambulances from './pages/Ambulances';
import AddAmbulance from './pages/AddAmbulance';
import OperatorProfile from './pages/OperatorProfile';

const App = () => {
    return (
        <BrowserRouter>
            <OperatorProvider>
                <Routes>
                    {/* Public */}
                    <Route element={<Layout />}>
                        <Route path="/login" element={<Login />} />
                    </Route>

                    {/* Authenticated + Operator */}
                    <Route element={<Layout requireAuth requireOperator />}>
                        <Route path="/dashboard" element={<Dashboard />} />
                        <Route path="/ambulances" element={<Ambulances />} />
                        <Route path="/ambulances/add" element={<AddAmbulance />} />
                        <Route path="/profile" element={<OperatorProfile />} />
                    </Route>

                    {/* Catch-all */}
                    <Route path="*" element={<Navigate to="/login" replace />} />
                </Routes>
            </OperatorProvider>
        </BrowserRouter>
    );
};

export default App;
