import { useState } from "react";
import { useSelector } from "react-redux";
import { RouterProvider } from "react-router-dom";
import BoxGradient from "./components/BoxGradient";
import router from "./router/router";
import Cover from "./views/cover/Cover";

export default function App() {
  const connected = useSelector((store) => store.user.connected);
  const [opened, setOpened] = useState(false);

  return (
    <BoxGradient>
      {connected && opened ? (
        <RouterProvider router={router} />
      ) : (
        <Cover setOpened={setOpened} />
      )}
    </BoxGradient>
  );
}
