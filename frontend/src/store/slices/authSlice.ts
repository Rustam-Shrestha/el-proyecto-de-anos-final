// @ts-nocheck
/**
 * Auth Slice — Redux Toolkit
 * 
 * Replaces the userData/permissions portion of the old ModalContext.
 * Stores user data, permissions, and client details in Redux
 * instead of Context + prop drilling.
 * 
 * Migration notes:
 * - `useModal().userData` → `useSelector(selectUserData)`
 * - `useModal().setUserData` → `dispatch(setUserData(data))`
 * - `useModal().clientDetails` → `useSelector(selectClientDetails)`
 */
import { createSlice, createSelector } from "@reduxjs/toolkit";

// Initialize userData from localStorage (same as old ModalProvider)
const loadUserData = () => {
  try {
    const data = JSON.parse(localStorage.getItem("userData") || "null");
    return data && typeof data === 'object' ? data : {};
  } catch {
    return {};
  }
};

const initialState = {
  userData: loadUserData(),
  clientDetails: { name: "", id: "" },
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    /** Set the full user data object (login, refresh, etc.) */
    setUserData: (state, action) => {
      state.userData = action.payload || {};
    },
    /** Clear user data on logout */
    clearUserData: (state) => {
      state.userData = {};
      state.clientDetails = { name: "", id: "" };
    },
    /** Set client details for breadcrumb/navigation context */
    setClientDetails: (state, action) => {
      state.clientDetails = action.payload || { name: "", id: "" };
    },
  },
});

export const { setUserData, clearUserData, setClientDetails } = authSlice.actions;

// Selectors — use these instead of directly accessing state shape
export const selectUserData = (state) => state.auth.userData;

/**
 * Memoized permissions selector to prevent reference-equality issues.
 * Returns an empty array if no permissions exist.
 */
export const selectPermissions = createSelector(
  [selectUserData],
  (userData) => userData?.permissions || []
);

export const selectIsSuperUser = (state) => state.auth.userData?.isSuperUser || false;
export const selectClientDetails = (state) => state.auth.clientDetails;

export default authSlice.reducer;
