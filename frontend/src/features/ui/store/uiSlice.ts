import { createSlice, PayloadAction } from "@reduxjs/toolkit";

type UIState = {
  activeTheme: "light" | "dark";
};

const initialState: UIState = {
  activeTheme: "light"
};

const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    setTheme: (state, action: PayloadAction<UIState["activeTheme"]>) => {
      state.activeTheme = action.payload;
    }
  }
});

export const { setTheme } = uiSlice.actions;
export const uiReducer = uiSlice.reducer;
