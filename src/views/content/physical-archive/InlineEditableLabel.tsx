/**
 * InlineEditableLabel — Label éditable au double-clic.
 *
 * Comportement identique au renommage de fichier dans un explorateur :
 *   - Affiche un texte normal
 *   - Double-clic → le texte devient un champ éditable
 *   - Entrée ou perte de focus → sauvegarde
 *   - Échap → annule
 */

import { useState, useRef, useCallback } from "react";
import { CircularProgress, InputBase, Typography } from "@mui/material";
import type { SxProps, Theme } from "@mui/material";

interface InlineEditableLabelProps {
  value: string;
  editable: boolean;
  onSave: (newValue: string) => Promise<void> | void;
  variant?: "body2" | "caption" | "body1";
  fontWeight?: number;
  noWrap?: boolean;
  sx?: SxProps<Theme>;
}

export default function InlineEditableLabel({
  value,
  editable,
  onSave,
  variant = "body2",
  fontWeight,
  noWrap,
  sx,
}: InlineEditableLabelProps) {
  const [editing, setEditing] = useState(false);
  const [tempValue, setTempValue] = useState(value);
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const startEdit = useCallback(() => {
    if (!editable) return;
    setTempValue(value);
    setEditing(true);
    // Focus après le rendu
    setTimeout(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    }, 0);
  }, [editable, value]);

  const cancel = useCallback(() => {
    setEditing(false);
    setTempValue(value);
  }, [value]);

  const save = useCallback(async () => {
    const trimmed = tempValue.trim();
    if (!trimmed || trimmed === value) {
      cancel();
      return;
    }
    setSaving(true);
    try {
      await onSave(trimmed);
      setEditing(false);
    } catch {
      cancel();
    } finally {
      setSaving(false);
    }
  }, [tempValue, value, onSave, cancel]);

  if (editing) {
    return (
      <InputBase
        inputRef={inputRef}
        value={tempValue}
        onChange={(e) => setTempValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") { e.preventDefault(); save(); }
          if (e.key === "Escape") { e.preventDefault(); cancel(); }
          e.stopPropagation();
        }}
        onBlur={save}
        onClick={(e) => e.stopPropagation()}
        onDoubleClick={(e) => e.stopPropagation()}
        disabled={saving}
        endAdornment={saving ? <CircularProgress size={12} /> : null}
        sx={{
          fontSize: variant === "caption" ? "0.75rem" : "0.85rem",
          fontWeight: fontWeight ?? 400,
          px: 0.5,
          py: 0,
          borderRadius: 0.5,
          bgcolor: "action.hover",
          border: "1px solid",
          borderColor: "primary.main",
          minWidth: 60,
          "& input": { py: 0, px: 0.25 },
          ...sx,
        }}
      />
    );
  }

  return (
    <Typography
      variant={variant}
      fontWeight={fontWeight}
      noWrap={noWrap}
      onDoubleClick={(e) => {
        e.stopPropagation();
        startEdit();
      }}
      sx={{
        cursor: editable ? "text" : "default",
        "&:hover": editable ? { textDecoration: "underline dotted", textUnderlineOffset: 3 } : {},
        ...sx,
      }}
    >
      {value}
    </Typography>
  );
}
