// ============================================================
// App Config Types
// ============================================================
export interface ColorScheme {
  main: string;
  light?: string;
  dark?: string;
  contrastText?: string;
}

export interface PrimaryColors {
  mode: "light" | "dark" | "auto";
  dark: ColorScheme;
  light: ColorScheme;
}

export interface AppColors {
  main: string;
  primary: PrimaryColors;
}

export interface Language {
  name: string;
  code: string;
}

export interface AppConfig {
  name: string;
  version: string;
  lang: string;
  languages: Language[];
  colors: AppColors;
}

// ============================================================
// User Types
// ============================================================
export interface UserProfile {
  id?: string | number;
  firstname?: string;
  lastname?: string;
  name?: string;
  email?: string;
  role?: string;
  avatar?: string | null;
  token?: string;
  [key: string]: unknown;
}

// ============================================================
// Document / Archive Types
// ============================================================
export interface DocumentCreatedBy {
  id?: string | number;
  firstname?: string;
  lastname?: string;
  role?: string;
  [key: string]: unknown;
}

export interface ArchiveDocument {
  id: string | number;
  designation?: string;
  destination?: string;
  typology?: string;
  reference?: string;
  createdAt?: string | Date;
  updatedAt?: string | Date;
  createdBy?: DocumentCreatedBy;
  fileSize?: number;
  fileExtension?: string;
  fileName?: string;
  [key: string]: unknown;
}

export interface FolderItem {
  id: string | number;
  name: string;
  type: "folder";
  children?: (FolderItem | FileItem)[];
}

export interface FileItem {
  id: string | number;
  name: string;
  type: "file";
  extension?: string;
  size?: number;
  createdAt?: string | Date;
  [key: string]: unknown;
}

export type TreeItem = FolderItem | FileItem;

// ============================================================
// Redux State Types
// ============================================================
export interface AppSliceState {
  mode: "light" | "dark" | "auto";
  lang: string;
  opacity: number;
  blur: number;
  users: UserProfile[];
  user: UserProfile | null;
  stayConnected: boolean;
}

export interface UserSliceState {
  connected: boolean;
  [key: string]: unknown;
}

export interface NavigationState {
  openLeft: boolean;
  openRight: boolean;
  archiveManagement: {
    selectedElements: (string | number)[];
  };
}

export interface DialogState {
  openDownloadFile: boolean;
}

export interface DataSliceState {
  loaded: boolean;
  docs: ArchiveDocument[];
  dialog: DialogState;
  navigation: NavigationState;
  dataVersion: number;
}

export interface RootState {
  app: AppSliceState;
  user: UserSliceState;
  data: DataSliceState;
}

// ============================================================
// API Types
// ============================================================
export interface ApiResponse<T = unknown> {
  data: T;
  status?: number;
  message?: string;
}

export interface GetDataResponse {
  docs?: ArchiveDocument[];
  [key: string]: unknown;
}

// ============================================================
// Column / DataGrid Types
// ============================================================
export interface ColumnDef {
  field: string;
  headerName?: string;
  width?: number;
  flex?: number;
  hide?: boolean;
  sortable?: boolean;
  filterable?: boolean;
  [key: string]: unknown;
}

// ============================================================
// Form Types
// ============================================================
export interface ArchiveFormValues {
  designation?: string;
  destination?: string;
  typology?: string;
  reference?: string;
  file?: File | null;
  [key: string]: unknown;
}

// ============================================================
// Utility Types
// ============================================================
export type ThemeMode = "light" | "dark" | "auto";
export type DisplayMode = "grid" | "list" | "table";

// ── Re-export API types ─────────────────────────────────────
export type {
  ApiError,
  ApiUser,
  Privilege,
  LoginBody,
  SignupBody,
  LoginResponse,
  Role,
  Container,
  ContainerBody,
  Shelf,
  ShelfBody,
  Floor,
  FloorBody,
  Binder,
  BinderBody,
  PhysicalRecord,
  RecordBody,
  PhysicalDocument,
  PhysicalDocumentBody,
  Archive,
  Workspace,
  Book,
  Film,
  Image as ApiImage,
} from "./api";
