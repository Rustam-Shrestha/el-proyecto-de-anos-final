import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export interface TenantState {
  currentTenantId: string | null;
  tenants: Array<{ id: string; name: string; slug: string }>;
  isLoading: boolean;
}

const initialState: TenantState = {
  currentTenantId: localStorage.getItem('currentTenantId') || null,
  tenants: [],
  isLoading: false,
};

export const tenantSlice = createSlice({
  name: 'tenant',
  initialState,
  reducers: {
    setCurrentTenant: (state, action: PayloadAction<string>) => {
      state.currentTenantId = action.payload;
      localStorage.setItem('currentTenantId', action.payload);
    },
    setTenants: (state, action: PayloadAction<Array<{ id: string; name: string; slug: string }>>) => {
      state.tenants = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
  },
});

export const { setCurrentTenant, setTenants } = tenantSlice.actions;
export default tenantSlice.reducer;
