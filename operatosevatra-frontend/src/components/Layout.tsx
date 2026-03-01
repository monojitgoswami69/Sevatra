import { Navigate, Outlet } from 'react-router-dom';
import Header from './Header';
import { useOperator } from '../context/OperatorContext';

interface LayoutProps {
    requireAuth?: boolean;
    requireOperator?: boolean;
}

const Layout = ({ requireAuth = false, requireOperator = false }: LayoutProps) => {
    const { isLoggedIn, isOperator } = useOperator();

    if (requireAuth && !isLoggedIn) return <Navigate to="/login" replace />;
    if (requireOperator && !isOperator) return <Navigate to="/login" replace />;

    return (
        <div className="min-h-screen flex flex-col bg-white dark:bg-background-dark">
            <Header />
            <main className="flex-1 pt-16">
                <Outlet />
            </main>
        </div>
    );
};

export default Layout;
