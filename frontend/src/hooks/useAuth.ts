// @ts-nocheck
/**
 * useAuth Hook
 * 
 * Provides a clean API for accessing authentication state from Redux.
 * Replaces direct `useModal().userData` calls with a purpose-built hook.
 * 
 * Usage:
 *   const { userData, permissions, isSuperUser, clientDetails } = useAuth();
 */
import { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  selectUserData,
  selectPermissions,
  selectIsSuperUser,
  selectClientDetails,
  setUserData,
  clearUserData,
  setClientDetails,
} from "../store/slices/authSlice";

const useAuth = () => {
  const dispatch = useDispatch();
  const userData = useSelector(selectUserData);
  const permissions = useSelector(selectPermissions);
  const isSuperUser = useSelector(selectIsSuperUser);
  const clientDetails = useSelector(selectClientDetails);

  const updateUserData = useCallback(
    (data) => dispatch(setUserData(data)),
    [dispatch]
  );

  const logout = useCallback(() => {
    localStorage.removeItem("userAuth");
    localStorage.removeItem("userData");
    dispatch(clearUserData());
  }, [dispatch]);

  const updateClientDetails = useCallback(
    (details) => dispatch(setClientDetails(details)),
    [dispatch]
  );

  return {
    userData,
    permissions,
    isSuperUser,
    clientDetails,
    setUserData: updateUserData,
    logout,
    setClientDetails: updateClientDetails,
  };
};

export default useAuth;
