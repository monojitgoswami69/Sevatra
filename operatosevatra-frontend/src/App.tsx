import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { OperatorProvider } from './context/OperatorContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Ambulances from './pages/Ambulances';
import AddAmbulance from './pages/AddAmbulance';
import OperatorProfile from './pages/OperatorProfile';
import ProviderOnly from './components/ProviderOnly';

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
                        <Route path="/ambulances" element={<ProviderOnly><Ambulances /></ProviderOnly>} />
                        <Route path="/ambulances/add" element={<ProviderOnly><AddAmbulance /></ProviderOnly>} />
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
