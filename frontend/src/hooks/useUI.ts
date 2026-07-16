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
  toggleProfileDropdown as toggleProfileDropdownAction,
  closeProfileDropdown as closeProfileDropdownAction,
  openThemeModal as openThemeModalAction,
  closeThemeModal as closeThemeModalAction,
  selectModalContent,
  selectModalProps,
  selectThemeColor,
  selectRefetch,
  selectMenuAction,
  selectShowProfileDropdown,
  selectShowThemeModal,
} from "../store/slices/uiSlice";
import { applyThemeToDocument } from "@shared/lib/theme";

const useUI = () => {
  const dispatch = useDispatch();

  // Selectors
  const modalContent = useSelector(selectModalContent);
  const modalProps = useSelector(selectModalProps);
  const themeColor = useSelector(selectThemeColor);
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

  const applyTheme = useCallback(
    (color) => {
      applyThemeToDocument(color);
      localStorage.setItem("selectedTheme", color);
      dispatch(setThemeColor(color));
    },
    [dispatch]
  );

  const updateTheme = useCallback(
    (color) => {
      applyTheme(color);
    },
    [applyTheme]
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
    () => {},
    []
  );

  return {
    modalContent,
    modalProps,
    themeColor,
    refetch,
    menuAction,
    showProfileDropdown,
    showThemeModal,

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
