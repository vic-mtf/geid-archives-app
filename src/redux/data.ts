import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import deepMerge from "../utils/deepMerge";
import type { DataSliceState } from "../types";

const initialState: DataSliceState = {
  loaded: false,
  docs: [],
  dialog: {
    openDownloadFile: false,
  },
  navigation: {
    openLeft: true,
    openRight: false,
    archiveManagement: {
      selectedElements: [],
    },
  },
};

const data = createSlice({
  name: "data",
  initialState,
  reducers: {
    updateData(state, actions: PayloadAction<{ data: Partial<DataSliceState> }>) {
      const { data } = actions.payload;
      const states = deepMerge(state as unknown as Record<string, unknown>, data as unknown as Record<string, unknown>) as unknown as DataSliceState;
      (Object.keys(states) as (keyof DataSliceState)[]).forEach((key) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (state as any)[key] = states[key];
      });
    },
    removeData(state) {
      (Object.keys(state) as (keyof DataSliceState)[]).forEach((key) => {
        delete state[key];
      });
    },
  },
});

export const { updateData, removeData } = data.actions;
export default data.reducer;
