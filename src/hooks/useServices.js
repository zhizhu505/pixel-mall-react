import { useContext } from 'react';

import { ServiceContext } from '../contexts/ServiceContext';

export const useServices = () => {
  const services = useContext(ServiceContext);

  if (!services) {
    throw new Error('useServices 必须在 ServiceProvider 内使用');
  }

  return services;
};

export const useCurrentUser = () => {
  const { user } = useServices();
  return user.getCurrentUser();
};
