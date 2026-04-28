// @ts-nocheck
/**
 * UI Slice — Redux Toolkit
 * 
 * Replaces the modal/UI portion of the old ModalContext and local component state
 * that was being prop-drilled through Header → UserProfile, etc.
 * 
 * Manages:
 * - Modal state (open/close, content reference)
 * - Theme selection
 * - Refetch trigger (used to signal data refresh across components)
 * - Menu action state
 * 
 * Migration notes:
 * - `useModal().openModal()` → `dispatch(openModal(component))`
 * - `useModal().closeModal()` → `dispatch(closeModal())`
 * - `useModal().triggerRefetch()` → `dispatch(triggerRefetch())`
 */
import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  // Modal state — content is a React element reference (non-serializable, allowed via middleware config)
  modalContent: null,
  modalProps: {},

  // Theme — persisted to localStorage, loaded on mount
  themeColor: localStorage.getItem("selectedTheme") || "142.1 76.2% 36.3%",

  // Dark mode — persisted to localStorage
  darkMode: localStorage.getItem("darkMode") === "true",

  // Refetch toggle — flipping this value signals consumers to re-fetch data
  refetch: false,

  // Menu action — stores arbitrary menu action data
  menuAction: null,

  // Profile dropdown visibility (moved from Header local state to avoid prop drilling)
  showProfileDropdown: false,

  // Theme modal visibility
  showThemeModal: false,
};

const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    /** Open a modal with a React component and optional props */
    openModal: (state, action) => {
      state.modalContent = action.payload.component || action.payload;
      state.modalProps = action.payload.props || {};
    },
    /** Close the currently open modal */
    closeModal: (state) => {
      state.modalContent = null;
      state.modalProps = {};
    },
    /** Toggle the refetch flag to signal data refresh */
    triggerRefetch: (state) => {
      state.refetch = !state.refetch;
    },
    /** Set a menu action */
    triggerMenuAction: (state, action) => {
      state.menuAction = action.payload;
    },
    /** Update the theme color */
    setThemeColor: (state, action) => {
      state.themeColor = action.payload;
    },
    /** Toggle dark mode */
    toggleDarkMode: (state) => {
      state.darkMode = !state.darkMode;
      localStorage.setItem("darkMode", state.darkMode);
    },
    /** Toggle profile dropdown */
    toggleProfileDropdown: (state) => {
      state.showProfileDropdown = !state.showProfileDropdown;
    },
    /** Close profile dropdown */
    closeProfileDropdown: (state) => {
      state.showProfileDropdown = false;
    },
    /** Toggle theme modal */
    toggleThemeModal: (state) => {
      state.showThemeModal = !state.showThemeModal;
    },
    /** Close theme modal */
    closeThemeModal: (state) => {
      state.showThemeModal = false;
    },
    /** Open theme modal */
    openThemeModal: (state) => {
      state.showThemeModal = true;
    },
  },
});

export const {
  openModal,
  closeModal,
  triggerRefetch,
  triggerMenuAction,
  setThemeColor,
  toggleDarkMode,
  toggleProfileDropdown,
  closeProfileDropdown,
  toggleThemeModal,
  closeThemeModal,
  openThemeModal,
} = uiSlice.actions;

// Selectors
export const selectModalContent = (state) => state.ui.modalContent;
export const selectModalProps = (state) => state.ui.modalProps;
export const selectThemeColor = (state) => state.ui.themeColor;
export const selectDarkMode = (state) => state.ui.darkMode;
export const selectRefetch = (state) => state.ui.refetch;
export const selectMenuAction = (state) => state.ui.menuAction;
export const selectShowProfileDropdown = (state) => state.ui.showProfileDropdown;
export const selectShowThemeModal = (state) => state.ui.showThemeModal;

export default uiSlice.reducer;
