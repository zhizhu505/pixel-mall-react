export const buildAddressManageUrl = (returnTo) => {
  const path = String(returnTo || '').trim();

  if (!path || !path.startsWith('/')) {
    return '/address';
  }

  return `/address?returnTo=${encodeURIComponent(path)}`;
};

export const readSelectedAddressId = (locationState) => {
  const id = locationState?.selectedAddressId;

  return id ? String(id) : '';
};
