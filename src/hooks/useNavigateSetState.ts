import { useCallback } from "react";
import { isPlainObject } from "@reduxjs/toolkit";
import { useLocation, useNavigate } from "react-router-dom";
import deepMerge from "../utils/deepMerge";

interface NavigateWithStateOptions {
  to?: string;
  state: Record<string, unknown>;
}

export default function useNavigateSetState(): (options: NavigateWithStateOptions) => void {
  const navigate = useNavigate();
  const location = useLocation();

  const navigateTo = useCallback(
    ({ to = "", state: nextState }: NavigateWithStateOptions) => {
      const previousState = (location.state as Record<string, unknown>) || {};
      const state = deepMerge(previousState, nextState);
      if (isPlainObject(state)) navigate(to, { state });
    },
    [location.state, navigate]
  );

  return navigateTo;
}
