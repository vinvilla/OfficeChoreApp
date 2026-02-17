import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';

export default function ProtectedRoute({ children }) {
  const user = useAuthStore((s) => s.user);
  const profile = useAuthStore((s) => s.profile);
  const loading = useAuthStore((s) => s.loading);

  if (loading) {
    return (
      <div className="empty-state" style={{ height: '100vh' }}>
        <div className="icon">🧹</div>
        <p>Loading...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // User is logged in but has no org — redirect to org creation
  if (profile && !profile.organization_id) {
    return <Navigate to="/setup" replace />;
  }

  return children;
}
