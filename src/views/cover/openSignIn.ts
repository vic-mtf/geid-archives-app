import store from "@/redux/store";
import { decrypt } from "@/utils/crypt";
import openNewWindow from "@/utils/openNewWindow";

export default function openSignIn(): void {
  const localUser = store.getState().app.user;
  const userSave = localUser && decrypt(JSON.stringify(localUser));
  const url = new URL(
    `/account/signin/${userSave ? "userfound" : "useremail"}`,
    import.meta.env.VITE_SERVER_BASE_URL as string
  );
  const win = openNewWindow({ url: url.href });
  if (win) win.name = "signin";
}
