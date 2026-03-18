import { useEffect, useRef, useState, useCallback } from "react";
import { Button, Typography } from "@mui/material";
import useAxios from "../../../hooks/useAxios";
import { useSnackbar } from "notistack";
import { useSelector } from "react-redux";
import type { RootState } from "../../../redux/store";
import textStyle from "../../../styles/text.module.css";
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
  const [, refresh, cancel] = useAxios(
    {
      url: "api/stuff/archives/",
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
            enqueueSnackbar(
              <Typography>
                <Typography
                  title={name}
                  maxWidth={300}
                  fontSize={15}
                  fontWeight='bold'
                  className={textStyle.monoCrop}
                  sx={{ p: 0.5 }}>
                  {name}
                </Typography>
                Le fichier a été envoyé au service d'archivage
              </Typography>,
              { variant: "success" }
            );
          })
          .catch(() => {
            closeSnackbar();
            enqueueSnackbar(
              <Typography>
                <Typography
                  title={name}
                  maxWidth={300}
                  fontSize={15}
                  fontWeight='bold'
                  className={textStyle.monoCrop}
                  sx={{ p: 0.5 }}>
                  {name}
                </Typography>
                Impossible de soumettre ce fichier !
              </Typography>,
              { variant: "error" }
            );
          });
      }, 3000);
      enqueueSnackbar(
        <Typography>
          <Typography
            title={name}
            maxWidth={300}
            fontSize={15}
            fontWeight='bold'
            className={textStyle.monoCrop}
            sx={{ p: 0.5 }}>
            {name}
          </Typography>
          Transfert du fichier au service d'archivage en cours...
        </Typography>,
        {
          action: (id) => (
            <Button
              children='Annuler'
              color='inherit'
              onClick={() => {
                cancel();
                window.clearTimeout(timer);
                closeSnackbar(id);
              }}
            />
          ),
          autoHideDuration: null,
        }
      );
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
