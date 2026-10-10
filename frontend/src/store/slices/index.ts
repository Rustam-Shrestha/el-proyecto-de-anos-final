import authReducer, * as authSliceModule from './authSlice';
import uiReducer, * as uiSliceModule from './uiSlice';
import accountReducer, * as accountSliceModule from './accountSlice';
import tenantReducer, * as tenantSliceModule from './tenantSlice';

export const authSlice = authSliceModule;
export const uiSlice = uiSliceModule;
export const accountSlice = accountSliceModule;
export const tenantSlice = tenantSliceModule;

export {
  authReducer,
  uiReducer,
  accountReducer,
  tenantReducer,
};
