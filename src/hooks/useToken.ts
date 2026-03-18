import { useSelector } from "react-redux";
import type { RootState } from "../redux/store";

export default function useToken(): string | null {
  const token = useSelector((state: RootState) => (state.user as { token?: string }).token);
  return token ? `Bearer ${token}` : null;
}
