import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import persistReducer from "redux-persist/es/persistReducer";
import storage from "redux-persist/lib/storage/session";
import deepMerge from "../utils/deepMerge";
import type { UserSliceState } from "../types";

const initialState: UserSliceState = {
  connected: false,
};

const user = createSlice({
  name: "user",
  initialState,
  reducers: {
    updateUser(state, actions: PayloadAction<{ data: Partial<UserSliceState> }>) {
      const { data } = actions.payload;
      const states = deepMerge(state as unknown as Record<string, unknown>, data as unknown as Record<string, unknown>) as unknown as UserSliceState;
      (Object.keys(states) as (keyof UserSliceState)[]).forEach((key) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (state as any)[key] = states[key];
      });
    },
    disconnected(state) {
      state.connected = false;
    },
  },
});

export const { disconnected, updateUser } = user.actions;
export default persistReducer(
  {
    storage,
    key: "__ROOT_GEID_USER_CONFIG_APP",
  },
  user.reducer
);
