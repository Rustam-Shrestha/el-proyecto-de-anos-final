import { useUser } from './useUser';

export const useTenant = () => {
  const { tenantId } = useUser();

  return {
    tenantId: tenantId || 'default-tenant',
    tenantName: 'FinGuard Organization',
    tenantMetadata: {},
  };
};

export default useTenant;
