import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import deepMerge from "../utils/deepMerge";
import type { DataSliceState, NavigationState } from "../types";

// Deep partial: each nested object can also be partially provided (deepMerge handles the merge at runtime)
type DataSliceUpdate = Partial<Omit<DataSliceState, "navigation">> & {
  navigation?: Partial<NavigationState>;
};

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
  dataVersion: 0,
};

const data = createSlice({
  name: "data",
  initialState,
  reducers: {
    updateData(state, actions: PayloadAction<{ data: DataSliceUpdate }>) {
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
    // Incrémente le compteur pour signaler aux composants de refetch leurs données
    incrementVersion(state) {
      state.dataVersion = (state.dataVersion ?? 0) + 1;
    },
  },
});

export const { updateData, removeData, incrementVersion } = data.actions;
export default data.reducer;
