// @ts-nocheck
/**
 * useUI Hook
 * 
 * Provides a clean API for accessing UI state from Redux.
 * Replaces modal/theme portions of the old ModalContext.
 * 
 * Usage:
 *   const { openModal, closeModal, triggerRefetch, updateTheme } = useUI();
 */
import { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  openModal as openModalAction,
  closeModal as closeModalAction,
  triggerRefetch as triggerRefetchAction,
  triggerMenuAction as triggerMenuActionAction,
  setThemeColor,
  toggleDarkMode as toggleDarkModeAction,
  toggleProfileDropdown as toggleProfileDropdownAction,
  closeProfileDropdown as closeProfileDropdownAction,
  openThemeModal as openThemeModalAction,
  closeThemeModal as closeThemeModalAction,
  selectModalContent,
  selectModalProps,
  selectThemeColor,
  selectDarkMode,
  selectRefetch,
  selectMenuAction,
  selectShowProfileDropdown,
  selectShowThemeModal,
} from "../store/slices/uiSlice";

const useUI = () => {
  const dispatch = useDispatch();

  // Selectors
  const modalContent = useSelector(selectModalContent);
  const modalProps = useSelector(selectModalProps);
  const themeColor = useSelector(selectThemeColor);
  const darkMode = useSelector(selectDarkMode);
  const refetch = useSelector(selectRefetch);
  const menuAction = useSelector(selectMenuAction);
  const showProfileDropdown = useSelector(selectShowProfileDropdown);
  const showThemeModal = useSelector(selectShowThemeModal);

  // Actions
  const openModal = useCallback(
    (component, props = {}) => {
      if (component === null || component === undefined) {
        return dispatch(closeModalAction());
      }
      dispatch(openModalAction({ component, props }));
    },
    [dispatch]
  );

  const closeModal = useCallback(
    () => dispatch(closeModalAction()),
    [dispatch]
  );

  const triggerRefetch = useCallback(
    () => dispatch(triggerRefetchAction()),
    [dispatch]
  );

  const triggerMenuAction = useCallback(
    (menu) => dispatch(triggerMenuActionAction(menu)),
    [dispatch]
  );

  /**
   * Apply theme — sets CSS variables and classes based on themeColor and darkMode.
   */
  const applyTheme = useCallback(
    (color, isDark) => {
      const root = document.documentElement;
      if (isDark) {
        root.classList.add("dark");
        // Make theme color darker in dark mode
      const parts = color.split(' ');
      if (parts.length === 3) {
        const h = parts[0];
        const s = parts[1].replace('%', '');
        const l = parts[2].replace('%', '');
        const newL = Math.max(0, parseFloat(l) - 20);
        const darkerColor = `${h} ${s}% ${newL}%`;
        root.style.setProperty("--theme-primary", darkerColor);
      } else {
        root.style.setProperty("--theme-primary", color);
      }
        root.style.setProperty("--text-color", "#e5efe8");
        root.style.setProperty("--bg-color", "#10211a");
      } else {
        root.classList.remove("dark");
        root.style.setProperty("--theme-primary", color);
        root.style.setProperty("--text-color", "#1f2937");
        root.style.setProperty("--bg-color", "#eef5ef");
      }
      localStorage.setItem("selectedTheme", color);
      dispatch(setThemeColor(color));
    },
    [dispatch]
  );

  /**
   * Update theme color — applies CSS variable and persists to localStorage.
   * Mirrors the old ThemeContext.updateTheme behavior.
   */
  const updateTheme = useCallback(
    (color) => {
      applyTheme(color, darkMode);
    },
    [applyTheme, darkMode]
  );

  const toggleProfileDropdown = useCallback(
    () => dispatch(toggleProfileDropdownAction()),
    [dispatch]
  );

  const closeProfileDropdown = useCallback(
    () => dispatch(closeProfileDropdownAction()),
    [dispatch]
  );

  const openThemeModal = useCallback(
    () => dispatch(openThemeModalAction()),
    [dispatch]
  );

  const closeThemeModal = useCallback(
    () => dispatch(closeThemeModalAction()),
    [dispatch]
  );

  const toggleDarkMode = useCallback(
    () => {
      const newDarkMode = !darkMode;
      dispatch(toggleDarkModeAction());
      applyTheme(themeColor, newDarkMode);
    },
    [dispatch, applyTheme, themeColor, darkMode]
  );

  return {
    // State
    modalContent,
    modalProps,
    themeColor,
    darkMode,
    refetch,
    menuAction,
    showProfileDropdown,
    showThemeModal,

    // Actions
    openModal,
    closeModal,
    triggerRefetch,
    triggerMenuAction,
    updateTheme,
    applyTheme,
    toggleDarkMode,
    toggleProfileDropdown,
    closeProfileDropdown,
    openThemeModal,
    closeThemeModal,
  };
};

export default useUI;
