import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import persistReducer from "redux-persist/es/persistReducer";
import storage from "redux-persist/lib/storage";
import appConfig from "../configs/app-config.json";
import deepMerge from "../utils/deepMerge";
import type { AppSliceState, UserProfile } from "../types";

const {
  lang,
  colors: {
    primary: { mode },
  },
} = appConfig;

const initialState: AppSliceState = {
  mode: mode as "light" | "dark" | "auto",
  lang,
  opacity: 0.75,
  blur: 15,
  users: [],
  user: null,
  stayConnected: false,
};

const app = createSlice({
  name: "app",
  initialState,
  reducers: {
    updateAppData(state, actions: PayloadAction<{ data: Partial<AppSliceState> }>) {
      const { data } = actions.payload;
      const states = deepMerge(state as unknown as Record<string, unknown>, data as unknown as Record<string, unknown>) as unknown as AppSliceState;
      (Object.keys(states) as (keyof AppSliceState)[]).forEach((key) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (state as any)[key] = states[key];
      });
    },
    switchTheme(state, actions: PayloadAction<"light" | "dark" | "auto" | undefined>) {
      state.mode = actions.payload ?? (mode as "light" | "dark" | "auto");
    },
    changeLang(state, actions: PayloadAction<string | undefined>) {
      state.lang = actions.payload ?? lang;
    },
    setUser(state, actions: PayloadAction<UserProfile | null>) {
      state.user = actions.payload;
    },
    removeUser(state, actions: PayloadAction<number | undefined>) {
      const index = actions.payload;
      if (typeof index === "number") delete state.users[index];
      else state.user = null;
    },
  },
});

export const { switchTheme, changeLang, removeUser, setUser, updateAppData } =
  app.actions;

export default persistReducer(
  {
    storage,
    key: "__ROOT_GEID_GLOBAL_CONFIG_APP",
  },
  app.reducer
);
