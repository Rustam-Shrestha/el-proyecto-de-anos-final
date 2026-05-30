// @ts-nocheck
/**
 * UserProfile Component — Refactored
 *
 * CHANGES:
 * - Removed all prop drilling (setShowProfileDropdown, showProfileDropdown,
 *   formattedHours, formattedMinutes, setShowModal, handleLogout)
 * - Now reads user data from Redux via useAuth hook
 * - UI state (profile dropdown) managed via Redux useUI hook
 * - Removed withApiCall HOC — use useApiQuery/useApiMutation hooks when needed
 * - Wrapped in React.memo for performance
 *
 * Same visual behavior and layout as before.
 */
import React, { memo, useMemo, useState } from "react";
import {
  ClockIcon,
  ColorIcon,
  GroupUserIcon,
  LogoutIcon,
  MessageIcon,
  MoonIcon,
  SearchIcon,
} from "../assets/data/icons";
import useAuth from "../hooks/useAuth";
import useUI from "../hooks/useUI";
import { useNavigate } from "react-router-dom";

const UserProfile = () => {
  const [showSearch, setShowSearch] = useState(false);
  const navigate = useNavigate();

  // Redux-based state — no more prop drilling
  const { userData, logout } = useAuth();
  const {
    showProfileDropdown,
    toggleProfileDropdown,
    closeProfileDropdown,
    openThemeModal,
    darkMode,
    toggleDarkMode,
  } = useUI();

  // Compute formatted time (memoized to avoid recalculation on unrelated re-renders)
  const { formattedHours, formattedMinutes } = useMemo(() => {
    const now = new Date();
    const hours = now.getHours();
    return {
      formattedHours: hours % 12 || 12,
      formattedMinutes: now.getMinutes().toString().padStart(2, "0"),
    };
  }, []);

  const toggleSearch = () => setShowSearch((prev) => !prev);

  const handleLogout = () => {
    logout();
    closeProfileDropdown();
    navigate("/login");
  };

  const handleThemeClick = () => {
    openThemeModal();
    closeProfileDropdown();
  };

  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-2">
        {showSearch ? (
          <div className="relative flex items-center transition-transform duration-300">
            <span className="absolute z-10 inset-y-0 right-2 flex items-center pl-2">
              <SearchIcon onClick={toggleSearch} />
            </span>
            <input
              type="text"
              className="border z-1 rounded px-2 py-1 text-sm max-w-80 bg-[#F1F1F1] text-gray-900 placeholder:text-gray-500 border-gray-200 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700 dark:placeholder:text-gray-400"
              placeholder="Search..."
            />
          </div>
        ) : (
          <SearchIcon onClick={toggleSearch} />
        )}
      </div>
      <span className="flex items-center text-sm font-bold gap-2">
        <ClockIcon />
        {`${formattedHours}:${formattedMinutes}`}
      </span>
      <MessageIcon />
      <div className="relative">
        <img
          src={userData?.image ? userData.image : "/images/client.webp"}
          alt="User avatar"
          className="w-6 h-6 rounded-full cursor-pointer ring-1 ring-gray-200 dark:ring-gray-700"
          onClick={toggleProfileDropdown}
        />
        {showProfileDropdown && (
          <div className="px-2 absolute text-sm right-0 top-8 bg-white border border-gray-200 rounded shadow-lg w-56 z-40 text-gray-900 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100">
            <div className="p-4">
              <p className="font-semibold">{userData?.name}</p>
              <p className="text-sm text-gray-500 dark:text-gray-300">{userData?.email}</p>
            </div>
            <ul className="divide-y divide-gray-200 dark:divide-gray-700">
              <li
                onClick={handleThemeClick}
                className="px-4 py-2 flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
              >
                <ColorIcon /> Change Theme
              </li>
              <li
                onClick={toggleDarkMode}
                className="px-4 py-2 flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
              >
                <MoonIcon /> {darkMode ? "Light Mode" : "Dark Mode"}
              </li>
              <li className="px-4 py-2 flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer">
                <GroupUserIcon /> Switch Client
              </li>
              <li
                onClick={handleLogout}
                className="px-4 py-2 flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
              >
                <LogoutIcon /> Log out
              </li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default memo(UserProfile);
