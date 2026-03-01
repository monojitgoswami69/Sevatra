import { Navigate } from 'react-router-dom';
import { useOperator } from '../context/OperatorContext';
import type { ReactNode } from 'react';

/**
 * Guard component that only allows provider-type operators through.
 * Individual operators are redirected to /dashboard.
 */
const ProviderOnly = ({ children }: { children: ReactNode }) => {
    const { profile } = useOperator();

    if (profile?.operatorType === 'individual') {
        return <Navigate to="/dashboard" replace />;
    }

    return <>{children}</>;
};

export default ProviderOnly;
