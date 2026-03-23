import { useEffect, useRef, useState, useCallback } from "react";
import { Button } from "@mui/material";
import useAxios from "@/hooks/useAxios";
import { useSnackbar } from "notistack";
import { useSelector, useDispatch } from "react-redux";
import type { RootState, AppDispatch } from "@/redux/store";
import { incrementVersion } from "@/redux/data";
import FormContent from "./FormContent";
import React from "react";

interface FileItem {
  name?: string;
  doc?: { _id?: string };
  [key: string]: unknown;
}

export default function ArchivesFrom() {
  const [file, setFile] = useState<FileItem | null>(null);
  const token = useSelector((store: RootState) => (store.user as Record<string, unknown>).token as string);
  const dispatch = useDispatch<AppDispatch>();
  const [, refresh, cancel] = useAxios(
    {
      url: "/api/stuff/archives",
      method: "post",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
    { manual: true }
  );
  const [fieldsError, setFieldsError] = useState<string[]>([]);
  const findError = (field: string) => !!~fieldsError?.indexOf(field);
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();
  const type = useRef<string | null | undefined>(undefined);
  const subType = useRef<string | null | undefined>(undefined);
  const designation = useRef<string | null | undefined>(undefined);
  const description = useRef<string | null | undefined>(undefined);
  const folder = useRef<string | null | undefined>(undefined);
  const getFieldsRef = useCallback(
    () => ({
      type,
      subType,
      designation,
      description,
      folder,
    }),
    []
  );

  const handleSendFile = (file: unknown) => (event: React.FormEvent) => {
    event.preventDefault();
    const errors: string[] = [];
    const fileItem = file as FileItem;
    const name = fileItem?.name;
    const data: Record<string, unknown> = { doc: fileItem?.doc?._id };
    const docFields = getFieldsRef();
    if (fieldsError.length) setFieldsError([]);
    Object.keys(docFields).forEach((key) => {
      const fieldKey = key as keyof typeof docFields;
      if (!docFields[fieldKey]?.current) errors.push(key);
      else data[key] = docFields[fieldKey]?.current;
    });
    data.type = {
      type: data.type,
      subType: data.subType,
    };

    delete data.subType;
    if (errors.length) setFieldsError(errors);
    else {
      const timer = setTimeout(() => {
        refresh({ data })
          .then(() => {
            closeSnackbar();
            dispatch(incrementVersion());
            enqueueSnackbar(`"${name}" a bien été transmis au service d'archivage.`, {
              variant: "success",
              title: "Fichier envoyé !",
            });
          })
          .catch(() => {
            closeSnackbar();
            enqueueSnackbar(
              `Le transfert de "${name}" a échoué. Vérifiez votre connexion et réessayez.`,
              { variant: "error", title: "Erreur de transfert" }
            );
          });
      }, 3000);
      enqueueSnackbar("Préparation et envoi en cours… vous pouvez annuler.", {
        title: `Envoi de "${name}"`,
        action: (id) => (
          <Button
            children="Annuler"
            color="inherit"
            size="small"
            onClick={() => {
              cancel();
              window.clearTimeout(timer);
              closeSnackbar(id);
            }}
          />
        ),
        autoHideDuration: null,
      });
      setFile(null);
    }
  };

  useEffect(() => {
    const rootEl = document.getElementById("root");
    const name = "_open_archives_form";
    const docFields = getFieldsRef();
    const handleOpenMediaForm = (event: Event) => setFile((event as CustomEvent).detail.file);
    rootEl?.addEventListener(name, handleOpenMediaForm);
    if (file === null)
      Object.keys(docFields).forEach((field) => {
        const fieldKey = field as keyof typeof docFields;
        if (docFields[fieldKey]) docFields[fieldKey]!.current = undefined;
      });
    return () => {
      rootEl?.removeEventListener(name, handleOpenMediaForm);
    };
  }, [file, getFieldsRef]);

  return (
    <FormContent
      file={file}
      key={file as unknown as string}
      findError={findError}
      handleSendFile={handleSendFile}
      docFields={getFieldsRef()}
      onClose={(event) => {
        event.preventDefault();
        setFile(null);
      }}
    />
  );
}
