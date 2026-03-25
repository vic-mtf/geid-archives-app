import { StrictMode } from "react";
import ReactDOM from "react-dom/client";
import { Provider as ReduxProvider } from "react-redux";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import "dayjs/locale/fr";
import store from "./redux/store";
import "./i18n/i18n";
import "./styles/index.css";
import App from "./App";
import ConfigAppProvider from "./providers/ConfigAppProvider";
import NoticeStackProvider from "./providers/NoticeStackProvider";
import SocketIOProvider from "./providers/SocketIOProvider";

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
            <SocketIOProvider>
              <App />
            </SocketIOProvider>
          </NoticeStackProvider>
        </ConfigAppProvider>
      </LocalizationProvider>
    </ReduxProvider>
  </StrictMode>
);
