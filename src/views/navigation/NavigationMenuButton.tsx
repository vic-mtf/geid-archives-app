import { useCallback, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { RootState, AppDispatch } from "@/redux/store";
import MenuOpenOutlinedIcon from "@mui/icons-material/MenuOpenOutlined";
import { IconButton, SxProps, Theme } from "@mui/material";
import { updateData } from "@/redux/data";
import capStr from "@/utils/capStr";

interface NavigationMenuButtonProps {
  hide?: boolean;
  IconProps?: {
    sx?: SxProps<Theme>;
    [key: string]: unknown;
  };
  direction?: "left" | "right";
}

export default function NavigationMenuButton({
  hide = false,
  IconProps = {},
  direction = "left",
}: NavigationMenuButtonProps) {
  const dir = useMemo(() => `open${capStr(direction)}`, [direction]);
  const open = useSelector((store: RootState) => ((store.data?.navigation ?? {}) as unknown as Record<string, unknown>)[dir] as boolean ?? false);
  const dispatch = useDispatch<AppDispatch>();
  const handleOpenNav = useCallback(() => {
    const data = { navigation: { [dir]: !open } as unknown as import("../../types").NavigationState };
    dispatch(updateData({ data }));
  }, [dispatch, open, dir]);

  return (
    (hide ? !open : true) && (
      <IconButton onClick={handleOpenNav} sx={{ mr: 2 }}>
        <MenuOpenOutlinedIcon fontSize='small' {...IconProps} />
      </IconButton>
    )
  );
}
