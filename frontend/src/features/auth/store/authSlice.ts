import { createSlice, PayloadAction } from "@reduxjs/toolkit";

type AuthState = {
  accessToken: string | null;
  user: {
    id: string;
    email: string;
    role: string;
  } | null;
};

const initialState: AuthState = {
  accessToken: null,
  user: null
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    loginSuccess: (state, action: PayloadAction<AuthState>) => {
      state.accessToken = action.payload.accessToken;
      state.user = action.payload.user;
    },
    logout: (state) => {
      state.accessToken = null;
      state.user = null;
    }
  }
});

export const { loginSuccess, logout } = authSlice.actions;
export const authReducer = authSlice.reducer;
