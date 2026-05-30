import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export type Notification = {
  id: string;
  type: "success" | "error" | "warning" | "info";
  message: string;
  duration?: number;
};

export type UIState = {
  isSidebarOpen: boolean;
  theme: "light" | "dark";
  notifications: Notification[];
  modalContent: unknown;
  modalProps: Record<string, unknown>;
  themeColor: string;
  darkMode: boolean;
  refetch: boolean;
  menuAction: unknown;
  showProfileDropdown: boolean;
  showThemeModal: boolean;
};

const readBoolean = (key: string, fallback: boolean) => {
  const value = localStorage.getItem(key);
  if (value === null) {
    return fallback;
  }
  return value === "true";
};

const readJson = <T,>(key: string, fallback: T): T => {
  try {
    const rawValue = localStorage.getItem(key);
    if (!rawValue) {
      return fallback;
    }
    return JSON.parse(rawValue) as T;
  } catch {
    return fallback;
  }
};

const readTheme = (): "light" | "dark" => {
  const savedTheme = localStorage.getItem("theme");
  if (savedTheme === "light" || savedTheme === "dark") {
    return savedTheme;
  }

  return readBoolean("darkMode", false) ? "dark" : "light";
};

const initialState: UIState = {
  isSidebarOpen: readBoolean("isSidebarOpen", false),
  theme: readTheme(),
  notifications: readJson<Notification[]>("notifications", []),
  modalContent: null,
  modalProps: {},
  themeColor: localStorage.getItem("selectedTheme") || "142.1 76.2% 36.3%",
  darkMode: readBoolean("darkMode", false),
  refetch: false,
  menuAction: null,
  showProfileDropdown: false,
  showThemeModal: false,
};

const persistTheme = (theme: "light" | "dark") => {
  localStorage.setItem("theme", theme);
  localStorage.setItem("darkMode", theme === "dark" ? "true" : "false");
};

const persistNotifications = (notifications: Notification[]) => {
  localStorage.setItem("notifications", JSON.stringify(notifications));
};

const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    toggleSidebar: (state) => {
      state.isSidebarOpen = !state.isSidebarOpen;
      localStorage.setItem("isSidebarOpen", state.isSidebarOpen ? "true" : "false");
    },
    setTheme: (state, action: PayloadAction<"light" | "dark">) => {
      state.theme = action.payload;
      state.darkMode = action.payload === "dark";
      persistTheme(action.payload);
    },
    addNotification: (state, action: PayloadAction<Notification>) => {
      state.notifications = [...state.notifications, action.payload];
      persistNotifications(state.notifications);
    },
    removeNotification: (state, action: PayloadAction<string>) => {
      state.notifications = state.notifications.filter(
        (notification) => notification.id !== action.payload
      );
      persistNotifications(state.notifications);
    },
    openModal: (state, action) => {
      state.modalContent = action.payload.component || action.payload;
      state.modalProps = action.payload.props || {};
    },
    closeModal: (state) => {
      state.modalContent = null;
      state.modalProps = {};
    },
    triggerRefetch: (state) => {
      state.refetch = !state.refetch;
    },
    triggerMenuAction: (state, action) => {
      state.menuAction = action.payload;
    },
    setThemeColor: (state, action) => {
      state.themeColor = action.payload;
    },
    toggleDarkMode: (state) => {
      state.darkMode = !state.darkMode;
      state.theme = state.darkMode ? "dark" : "light";
      persistTheme(state.theme);
    },
    toggleProfileDropdown: (state) => {
      state.showProfileDropdown = !state.showProfileDropdown;
    },
    closeProfileDropdown: (state) => {
      state.showProfileDropdown = false;
    },
    toggleThemeModal: (state) => {
      state.showThemeModal = !state.showThemeModal;
    },
    closeThemeModal: (state) => {
      state.showThemeModal = false;
    },
    openThemeModal: (state) => {
      state.showThemeModal = true;
    },
  },
});

export const {
  toggleSidebar,
  setTheme,
  addNotification,
  removeNotification,
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

export const selectIsSidebarOpen = (state: { ui: UIState }) => state.ui.isSidebarOpen;
export const selectTheme = (state: { ui: UIState }) => state.ui.theme;
export const selectNotifications = (state: { ui: UIState }) => state.ui.notifications;
export const selectModalContent = (state: { ui: UIState }) => state.ui.modalContent;
export const selectModalProps = (state: { ui: UIState }) => state.ui.modalProps;
export const selectThemeColor = (state: { ui: UIState }) => state.ui.themeColor;
export const selectDarkMode = (state: { ui: UIState }) => state.ui.darkMode;
export const selectRefetch = (state: { ui: UIState }) => state.ui.refetch;
export const selectMenuAction = (state: { ui: UIState }) => state.ui.menuAction;
export const selectShowProfileDropdown = (state: { ui: UIState }) => state.ui.showProfileDropdown;
export const selectShowThemeModal = (state: { ui: UIState }) => state.ui.showThemeModal;

export default uiSlice.reducer;
