import { StrictMode } from "react";
import ReactDOM from "react-dom/client";
import { Provider as ReduxProvider } from "react-redux";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import "dayjs/locale/fr";
import store from "./redux/store";
import "./styles/index.css";
import App from "./App";
import ConfigAppProvider from "./components/ConfigAppProvider";
import NoticeStackProvider from "./components/NoticeStackProvider";

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Root element not found");
}

const root = ReactDOM.createRoot(rootElement);

root.render(
  <StrictMode>
    <ReduxProvider store={store}>
      <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="fr">
        <ConfigAppProvider>
          <NoticeStackProvider>
            <App />
          </NoticeStackProvider>
        </ConfigAppProvider>
      </LocalizationProvider>
    </ReduxProvider>
  </StrictMode>
);
