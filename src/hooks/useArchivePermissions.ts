/**
 * useArchivePermissions — lit les droits archives depuis le store Redux.
 *
 * L'objet `auth` est injecté dans le slice `user` lors du login
 * (via BroadcastChannel depuis geid-platform).
 *
 * Structure attendue dans state.user :
 *   auth: {
 *     privileges: [
 *       { app: 'archives', permissions: [{ struct: string, access: 'read'|'write' }] }
 *     ]
 *   }
 *
 * Retourne :
 *   isAdmin  — true si struct='all' en écriture (voit toutes les unités)
 *   canWrite — au moins une permission d'écriture (validation, modification, suppression, lifecycle)
 *   canRead  — au moins une permission (lecture simple)
 *   structs  — liste brute des permissions [{ struct, access }]
 *   hasWriteOn(unit) — vérifie si l'utilisateur peut écrire sur une unité spécifique
 */

import { useMemo } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "../redux/store";

interface StructPermission {
  struct: string;
  access: "read" | "write";
}

export interface ArchivePermissions {
  isAdmin: boolean;
  canWrite: boolean;
  canRead: boolean;
  structs: StructPermission[];
  hasWriteOn: (administrativeUnit: string) => boolean;
}

export default function useArchivePermissions(): ArchivePermissions {
  const auth = useSelector(
    (store: RootState) => (store.user as Record<string, unknown>).auth as {
      privileges?: Array<{
        app: string;
        permissions: Array<{ struct: string; access: string }>;
      }>;
    } | undefined
  );

  return useMemo<ArchivePermissions>(() => {
    const archPriv = auth?.privileges?.find((p) => p.app === "archives");
    const perms = (archPriv?.permissions ?? []) as StructPermission[];

    const isAdmin  = perms.some((p) => p.struct === "all" && p.access === "write");
    const canWrite = perms.some((p) => p.access === "write");
    const canRead  = perms.length > 0;

    const hasWriteOn = (unit: string) =>
      isAdmin || perms.some((p) => p.struct === unit && p.access === "write");

    return { isAdmin, canWrite, canRead, structs: perms, hasWriteOn };
  }, [auth]);
}
