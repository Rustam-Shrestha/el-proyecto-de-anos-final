import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice";
import uiReducer from "./slices/uiSlice";
import accountReducer from "./slices/accountSlice";
import tenantReducer from "./slices/tenantSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    ui: uiReducer,
    account: accountReducer,
    tenant: tenantReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ["ui/openModal", "ui/closeModal", "ui/triggerMenuAction"],
        ignoredPaths: ["ui.modalContent", "ui.menuAction"],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;