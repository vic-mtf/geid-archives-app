/**
 * GEID Archives — Service API
 *
 * Centralise toutes les URL et configurations axios pour chaque ressource.
 * Utilise l'instance axios configurée dans useAxios (baseURL depuis .env).
 *
 * Usage :
 *   const [{ data, loading, error }, refetch] = useAxios(api.archives.list());
 *   const [, create] = useAxios(api.archives.create(body), { manual: true });
 */

import type { AxiosRequestConfig } from "axios";
import type {
  ContainerBody,
  ShelfBody,
  FloorBody,
  BinderBody,
  RecordBody,
  LoginBody,
  SignupBody,
} from "../types/api";

// ── Helper ──────────────────────────────────────────────────────────────────

const authHeader = (token: string): Record<string, string> => ({
  Authorization: token.startsWith("Bearer ") ? token : `Bearer ${token}`,
});

// ── Auth — /api/auth/* ──────────────────────────────────────────────────────

export const auth = {
  /** POST /api/auth/login */
  login: (body: LoginBody): AxiosRequestConfig => ({
    url: "/api/auth/login",
    method: "POST",
    data: body,
  }),

  /** POST /api/auth/signup */
  signup: (body: SignupBody): AxiosRequestConfig => ({
    url: "/api/auth/signup",
    method: "POST",
    data: body,
  }),

  /** POST /api/auth/validate — valider le compte */
  validate: (token: string, body?: unknown): AxiosRequestConfig => ({
    url: "/api/auth/validate",
    method: "POST",
    headers: authHeader(token),
    data: body,
  }),

  /** GET /api/auth/init — initialisation */
  init: (token: string): AxiosRequestConfig => ({
    url: "/api/auth/init",
    method: "GET",
    headers: authHeader(token),
  }),

  /** GET /api/auth/users — liste des utilisateurs */
  users: (token: string): AxiosRequestConfig => ({
    url: "/api/auth/users",
    method: "GET",
    headers: authHeader(token),
  }),

  /** POST /api/auth/edit — modifier le profil */
  edit: (token: string, body: unknown): AxiosRequestConfig => ({
    url: "/api/auth/edit",
    method: "POST",
    headers: authHeader(token),
    data: body,
  }),

  /** POST /api/auth/profil — ajouter un profil */
  addProfil: (token: string, body: unknown): AxiosRequestConfig => ({
    url: "/api/auth/profil",
    method: "POST",
    headers: authHeader(token),
    data: body,
  }),
};

// ── Archives — /api/stuff/archives/* ───────────────────────────────────────

export const archives = {
  /** GET /api/stuff/archives */
  list: (token: string): AxiosRequestConfig => ({
    url: "/api/stuff/archives",
    method: "GET",
    headers: authHeader(token),
  }),

  /** GET /api/stuff/archives/:id */
  get: (token: string, id: string): AxiosRequestConfig => ({
    url: `/api/stuff/archives/${id}`,
    method: "GET",
    headers: authHeader(token),
  }),

  /** POST /api/stuff/archives */
  create: (token: string, data: FormData | unknown): AxiosRequestConfig => ({
    url: "/api/stuff/archives",
    method: "POST",
    headers: authHeader(token),
    data,
  }),

  /** PUT /api/stuff/archives/:id */
  update: (token: string, id: string, data: unknown): AxiosRequestConfig => ({
    url: `/api/stuff/archives/${id}`,
    method: "PUT",
    headers: authHeader(token),
    data,
  }),

  /** DELETE /api/stuff/archives/:id */
  remove: (token: string, id: string): AxiosRequestConfig => ({
    url: `/api/stuff/archives/${id}`,
    method: "DELETE",
    headers: authHeader(token),
  }),
};

// ── Validation — /api/stuff/validate/* ─────────────────────────────────────

export const validation = {
  /** GET /api/stuff/validate — archives en attente de validation */
  list: (token: string): AxiosRequestConfig => ({
    url: "/api/stuff/validate",
    method: "GET",
    headers: authHeader(token),
  }),

  /** POST /api/stuff/validate/:id — valider une archive */
  validate: (token: string, id: string): AxiosRequestConfig => ({
    url: `/api/stuff/validate/${id}`,
    method: "POST",
    headers: authHeader(token),
  }),
};

// ── Archivage physique — /api/stuff/archives/physical/* ────────────────────

export const containers = {
  /** GET /api/stuff/archives/physical/containers */
  list: (token: string): AxiosRequestConfig => ({
    url: "/api/stuff/archives/physical/containers",
    method: "GET",
    headers: authHeader(token),
  }),

  /** GET /api/stuff/archives/physical/containers/:id */
  get: (token: string, id: string): AxiosRequestConfig => ({
    url: `/api/stuff/archives/physical/containers/${id}`,
    method: "GET",
    headers: authHeader(token),
  }),

  /** POST /api/stuff/archives/physical/containers */
  create: (token: string, body: ContainerBody): AxiosRequestConfig => ({
    url: "/api/stuff/archives/physical/containers",
    method: "POST",
    headers: authHeader(token),
    data: body,
  }),

  /** PUT /api/stuff/archives/physical/containers/:id */
  update: (token: string, id: string, body: Partial<ContainerBody>): AxiosRequestConfig => ({
    url: `/api/stuff/archives/physical/containers/${id}`,
    method: "PUT",
    headers: authHeader(token),
    data: body,
  }),

  /** DELETE /api/stuff/archives/physical/containers/:id */
  remove: (token: string, id: string): AxiosRequestConfig => ({
    url: `/api/stuff/archives/physical/containers/${id}`,
    method: "DELETE",
    headers: authHeader(token),
  }),
};

export const shelves = {
  /** GET /api/stuff/archives/physical/shelves */
  list: (token: string): AxiosRequestConfig => ({
    url: "/api/stuff/archives/physical/shelves",
    method: "GET",
    headers: authHeader(token),
  }),

  /** GET /api/stuff/archives/physical/shelves/:id */
  get: (token: string, id: string): AxiosRequestConfig => ({
    url: `/api/stuff/archives/physical/shelves/${id}`,
    method: "GET",
    headers: authHeader(token),
  }),

  /** GET /api/stuff/archives/physical/shelves/container/:containerId */
  byContainer: (token: string, containerId: string): AxiosRequestConfig => ({
    url: `/api/stuff/archives/physical/shelves/container/${containerId}`,
    method: "GET",
    headers: authHeader(token),
  }),

  /** POST /api/stuff/archives/physical/shelves */
  create: (token: string, body: ShelfBody): AxiosRequestConfig => ({
    url: "/api/stuff/archives/physical/shelves",
    method: "POST",
    headers: authHeader(token),
    data: body,
  }),

  /** PUT /api/stuff/archives/physical/shelves/:id */
  update: (token: string, id: string, body: Partial<ShelfBody>): AxiosRequestConfig => ({
    url: `/api/stuff/archives/physical/shelves/${id}`,
    method: "PUT",
    headers: authHeader(token),
    data: body,
  }),

  /** DELETE /api/stuff/archives/physical/shelves/:id */
  remove: (token: string, id: string): AxiosRequestConfig => ({
    url: `/api/stuff/archives/physical/shelves/${id}`,
    method: "DELETE",
    headers: authHeader(token),
  }),
};

export const floors = {
  /** GET /api/stuff/archives/physical/floors */
  list: (token: string): AxiosRequestConfig => ({
    url: "/api/stuff/archives/physical/floors",
    method: "GET",
    headers: authHeader(token),
  }),

  /** GET /api/stuff/archives/physical/floors/:id */
  get: (token: string, id: string): AxiosRequestConfig => ({
    url: `/api/stuff/archives/physical/floors/${id}`,
    method: "GET",
    headers: authHeader(token),
  }),

  /** GET /api/stuff/archives/physical/floors/shelf/:shelfId */
  byShelf: (token: string, shelfId: string): AxiosRequestConfig => ({
    url: `/api/stuff/archives/physical/floors/shelf/${shelfId}`,
    method: "GET",
    headers: authHeader(token),
  }),

  /** POST /api/stuff/archives/physical/floors */
  create: (token: string, body: FloorBody): AxiosRequestConfig => ({
    url: "/api/stuff/archives/physical/floors",
    method: "POST",
    headers: authHeader(token),
    data: body,
  }),

  /** PUT /api/stuff/archives/physical/floors/:id */
  update: (token: string, id: string, body: Partial<FloorBody>): AxiosRequestConfig => ({
    url: `/api/stuff/archives/physical/floors/${id}`,
    method: "PUT",
    headers: authHeader(token),
    data: body,
  }),

  /** DELETE /api/stuff/archives/physical/floors/:id */
  remove: (token: string, id: string): AxiosRequestConfig => ({
    url: `/api/stuff/archives/physical/floors/${id}`,
    method: "DELETE",
    headers: authHeader(token),
  }),
};

export const binders = {
  /** GET /api/stuff/archives/physical/binders */
  list: (token: string): AxiosRequestConfig => ({
    url: "/api/stuff/archives/physical/binders",
    method: "GET",
    headers: authHeader(token),
  }),

  /** GET /api/stuff/archives/physical/binders/:id */
  get: (token: string, id: string): AxiosRequestConfig => ({
    url: `/api/stuff/archives/physical/binders/${id}`,
    method: "GET",
    headers: authHeader(token),
  }),

  /** GET /api/stuff/archives/physical/binders/floor/:floorId */
  byFloor: (token: string, floorId: string): AxiosRequestConfig => ({
    url: `/api/stuff/archives/physical/binders/floor/${floorId}`,
    method: "GET",
    headers: authHeader(token),
  }),

  /** POST /api/stuff/archives/physical/binders */
  create: (token: string, body: BinderBody): AxiosRequestConfig => ({
    url: "/api/stuff/archives/physical/binders",
    method: "POST",
    headers: authHeader(token),
    data: body,
  }),

  /** PUT /api/stuff/archives/physical/binders/:id */
  update: (token: string, id: string, body: Partial<BinderBody>): AxiosRequestConfig => ({
    url: `/api/stuff/archives/physical/binders/${id}`,
    method: "PUT",
    headers: authHeader(token),
    data: body,
  }),

  /** DELETE /api/stuff/archives/physical/binders/:id */
  remove: (token: string, id: string): AxiosRequestConfig => ({
    url: `/api/stuff/archives/physical/binders/${id}`,
    method: "DELETE",
    headers: authHeader(token),
  }),
};

export const records = {
  /** GET /api/stuff/archives/physical/records */
  list: (token: string): AxiosRequestConfig => ({
    url: "/api/stuff/archives/physical/records",
    method: "GET",
    headers: authHeader(token),
  }),

  /** GET /api/stuff/archives/physical/records/:id */
  get: (token: string, id: string): AxiosRequestConfig => ({
    url: `/api/stuff/archives/physical/records/${id}`,
    method: "GET",
    headers: authHeader(token),
  }),

  /** GET /api/stuff/archives/physical/records/binder/:binderId */
  byBinder: (token: string, binderId: string): AxiosRequestConfig => ({
    url: `/api/stuff/archives/physical/records/binder/${binderId}`,
    method: "GET",
    headers: authHeader(token),
  }),

  /** GET /api/stuff/archives/physical/records/qr/:qrCode */
  byQrCode: (token: string, qrCode: string): AxiosRequestConfig => ({
    url: `/api/stuff/archives/physical/records/qr/${qrCode}`,
    method: "GET",
    headers: authHeader(token),
  }),

  /** POST /api/stuff/archives/physical/records */
  create: (token: string, body: RecordBody): AxiosRequestConfig => ({
    url: "/api/stuff/archives/physical/records",
    method: "POST",
    headers: authHeader(token),
    data: body,
  }),

  /** PUT /api/stuff/archives/physical/records/:id */
  update: (token: string, id: string, body: Partial<RecordBody>): AxiosRequestConfig => ({
    url: `/api/stuff/archives/physical/records/${id}`,
    method: "PUT",
    headers: authHeader(token),
    data: body,
  }),

  /** DELETE /api/stuff/archives/physical/records/:id */
  remove: (token: string, id: string): AxiosRequestConfig => ({
    url: `/api/stuff/archives/physical/records/${id}`,
    method: "DELETE",
    headers: authHeader(token),
  }),
};

// ── Admin — /admin/* ────────────────────────────────────────────────────────

export const admin = {
  /** GET /admin/users */
  users: (token: string): AxiosRequestConfig => ({
    url: "/admin/users",
    method: "GET",
    headers: authHeader(token),
  }),

  /** POST /admin/users */
  addUser: (token: string, body: unknown): AxiosRequestConfig => ({
    url: "/admin/users",
    method: "POST",
    headers: authHeader(token),
    data: body,
  }),

  /** PUT /admin/users */
  updateUser: (token: string, body: unknown): AxiosRequestConfig => ({
    url: "/admin/users",
    method: "PUT",
    headers: authHeader(token),
    data: body,
  }),

  /** GET /admin/roles */
  roles: (token: string): AxiosRequestConfig => ({
    url: "/admin/roles",
    method: "GET",
    headers: authHeader(token),
  }),

  /** POST /admin/roles */
  addRole: (token: string, body: unknown): AxiosRequestConfig => ({
    url: "/admin/roles",
    method: "POST",
    headers: authHeader(token),
    data: body,
  }),

  /** PUT /admin/users/permissions */
  setPermission: (token: string, body: unknown): AxiosRequestConfig => ({
    url: "/admin/users/permissions",
    method: "PUT",
    headers: authHeader(token),
    data: body,
  }),

  /** GET /admin/:userId */
  getUser: (token: string, userId: string): AxiosRequestConfig => ({
    url: `/admin/${userId}`,
    method: "GET",
    headers: authHeader(token),
  }),
};

// ── Événements — /api/stuff/archives/event/* ───────────────────────────────

export const events = {
  /** GET /api/stuff/archives/event */
  list: (token: string): AxiosRequestConfig => ({
    url: "/api/stuff/archives/event",
    method: "GET",
    headers: authHeader(token),
  }),

  /** POST /api/stuff/archives/event */
  create: (token: string, body: unknown): AxiosRequestConfig => ({
    url: "/api/stuff/archives/event",
    method: "POST",
    headers: authHeader(token),
    data: body,
  }),
};

// ── Export groupé ───────────────────────────────────────────────────────────

const api = {
  auth,
  archives,
  validation,
  containers,
  shelves,
  floors,
  binders,
  records,
  admin,
  events,
};

export default api;
