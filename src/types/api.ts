// ============================================================
// GEID API — Types TypeScript (générés depuis swagger.js)
// Hiérarchie physique : Container → Shelf → Floor → Binder → Record → Archive
// ============================================================

// ── Génériques ─────────────────────────────────────────────
export interface ApiError {
  error: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total?: number;
  page?: number;
  limit?: number;
}

// ── Utilisateurs ────────────────────────────────────────────
export interface ApiUser {
  _id: string;
  email: string;
  username?: string;
  fname?: string;
  lname?: string;
  role?: string;
  grade?: string;
  phone?: string;
  permissions?: string[];
  privileges?: Privilege[];
  avatar?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface Privilege {
  app: string;
  permissions: { access: string }[];
}

export interface LoginBody {
  email: string;
  password: string;
}

export interface SignupBody {
  email: string;
  password: string;
  username?: string;
  fname?: string;
  lname?: string;
}

export interface LoginResponse {
  token: string;
  user: ApiUser;
}

export interface Role {
  _id: string;
  name: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

// ── Hiérarchie physique d'archivage ────────────────────────

export interface Container {
  _id: string;
  name: string;
  description?: string;
  location?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ContainerBody {
  name: string;
  description?: string;
  location?: string;
}

export interface Shelf {
  _id: string;
  name: string;
  container: Container | string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ShelfBody {
  name: string;
  container: string;
  description?: string;
}

export interface Floor {
  _id: string;
  number: number;
  label?: string;
  shelf: Shelf | string;
  administrativeUnit?: { _id: string; name: string } | string;
  createdAt?: string;
  updatedAt?: string;
}

export interface FloorBody {
  number: number;
  label?: string;
  shelf: string;
  administrativeUnit: string;
}

export interface Binder {
  _id: string;
  name: string;
  floor: Floor | string;
  nature: string;
  maxCapacity: number;
  currentCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface BinderBody {
  name: string;
  floor: string;
  nature: string;
  maxCapacity: number;
}

export interface PhysicalRecord {
  _id: string;
  internalNumber: string;
  refNumber: string;
  editionDate: string;
  archivingDate: string;
  subject: string;
  category: string;
  nature: string;
  binder: Binder | string;
  qrCode?: string;
  agent?: { _id: string; firstName: string; lastName: string };
  metadata?: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
}

export interface RecordBody {
  internalNumber: string;
  refNumber: string;
  editionDate: string;
  archivingDate: string;
  subject: string;
  category: string;
  nature: string;
  binder: string;
  metadata?: Record<string, unknown>;
}

// ── Archives numériques ─────────────────────────────────────
export interface Archive {
  _id: string;
  title?: string;
  designation?: string;
  destination?: string;
  typology?: string;
  reference?: string;
  role?: string;
  validated?: boolean;
  fileSize?: number;
  fileExtension?: string;
  fileName?: string;
  createdBy?: { _id?: string; firstname?: string; lastname?: string; role?: string };
  createdAt?: string;
  updatedAt?: string;
  [key: string]: unknown;
}

// ── Espace de travail ───────────────────────────────────────
export interface Workspace {
  _id: string;
  name: string;
  owner?: string;
  createdAt?: string;
  updatedAt?: string;
}

// ── Médias ──────────────────────────────────────────────────
export interface Book {
  _id: string;
  title: string;
  author?: string;
  type?: string;
  createdAt?: string;
}

export interface Film {
  _id: string;
  title: string;
  director?: string;
  createdAt?: string;
}

export interface Image {
  _id: string;
  name: string;
  url?: string;
  createdAt?: string;
}
