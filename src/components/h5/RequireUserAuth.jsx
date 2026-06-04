import { Navigate, Outlet, useLocation } from 'react-router-dom';

import { useServices } from '../../hooks/useServices';

const RequireUserAuth = () => {
  const { user } = useServices();
  const location = useLocation();
  const currentUser = user.getCurrentUser();

  if (!currentUser) {
    const redirect = encodeURIComponent(`${location.pathname}${location.search}`);
    return <Navigate to={`/login?redirect=${redirect}`} replace />;
  }

  return <Outlet />;
};

export default RequireUserAuth;
