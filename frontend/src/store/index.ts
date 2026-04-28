// @ts-nocheck
/**
 * Redux Store Configuration
 * 
 * Central Redux store using Redux Toolkit's configureStore.
 * Replaces the scattered Context API usage with a single, predictable state tree.
 * 
 * Slices:
 * - authSlice: user authentication data (userData, permissions)
 * - uiSlice: UI state (modals, theme, menus, filters)
 */
import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice";
import uiReducer from "./slices/uiSlice";
import accountReducer from "./slices/accountSlice";

const store = configureStore({
  reducer: {
    auth: authReducer,
    ui: uiReducer,
    account: accountReducer,
  },
  // Middleware: Redux Toolkit includes thunk by default.
  // We disable serializable check for modal components (React elements stored in state).
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Modal content can be React elements — ignore serialization for these paths
        ignoredActions: ["ui/openModal", "ui/closeModal", "ui/triggerMenuAction"],
        ignoredPaths: ["ui.modalContent", "ui.menuAction"],
      },
    }),
});

export default store;
