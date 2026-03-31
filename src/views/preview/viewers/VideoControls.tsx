/**
 * VideoControls — Overlay de contrôles du lecteur vidéo.
 */

import React, { useMemo } from "react";
import {
  Box, IconButton, LinearProgress, Slider, Typography, Tooltip, Menu, MenuItem,
} from "@mui/material";
import PlayArrowOutlinedIcon from "@mui/icons-material/PlayArrowOutlined";
import PauseOutlinedIcon from "@mui/icons-material/PauseOutlined";
import VolumeUpOutlinedIcon from "@mui/icons-material/VolumeUpOutlined";
import VolumeOffOutlinedIcon from "@mui/icons-material/VolumeOffOutlined";
import VolumeDownOutlinedIcon from "@mui/icons-material/VolumeDownOutlined";
import FullscreenOutlinedIcon from "@mui/icons-material/FullscreenOutlined";
import FullscreenExitOutlinedIcon from "@mui/icons-material/FullscreenExitOutlined";
import SpeedOutlinedIcon from "@mui/icons-material/SpeedOutlined";
import PictureInPictureAltOutlinedIcon from "@mui/icons-material/PictureInPictureAltOutlined";
import Forward10OutlinedIcon from "@mui/icons-material/Forward10Outlined";
import Replay10OutlinedIcon from "@mui/icons-material/Replay10Outlined";

export const SPEEDS = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

export function formatTime(s: number): string {
  if (!s || isNaN(s)) return "0:00";
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = Math.floor(s % 60);
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  return `${m}:${String(sec).padStart(2, "0")}`;
}

interface VideoControlsProps {
  playing: boolean;
  showControls: boolean;
  currentTime: number;
  duration: number;
  buffered: number;
  volume: number;
  muted: boolean;
  speed: number;
  isFullscreen: boolean;
  hoverTime: number | null;
  hoverX: number;
  progressHovered: boolean;
  speedAnchor: HTMLElement | null;
  progressRef: React.RefObject<HTMLDivElement>;
  togglePlay: () => void;
  skip: (seconds: number) => void;
  seek: (e: any, val: number | number[]) => void;
  changeVolume: (e: any, val: number | number[]) => void;
  toggleMute: () => void;
  changeSpeed: (s: number) => void;
  toggleFullscreen: () => void;
  togglePiP: () => void;
  setSpeedAnchor: (el: HTMLElement | null) => void;
  setProgressHovered: (v: boolean) => void;
  setHoverTime: (v: number | null) => void;
  handleProgressHover: (e: React.MouseEvent) => void;
}

const VideoControls = React.memo(function VideoControls({
  playing, showControls, currentTime, duration, buffered, volume, muted, speed, isFullscreen,
  hoverTime, hoverX, progressHovered, speedAnchor, progressRef,
  togglePlay, skip, seek, changeVolume, toggleMute, changeSpeed,
  toggleFullscreen, togglePiP, setSpeedAnchor, setProgressHovered, setHoverTime, handleProgressHover,
}: VideoControlsProps) {

  const volumeIcon = useMemo(() => {
    if (muted || volume === 0) return <VolumeOffOutlinedIcon sx={{ fontSize: 20 }} />;
    if (volume < 0.5) return <VolumeDownOutlinedIcon sx={{ fontSize: 20 }} />;
    return <VolumeUpOutlinedIcon sx={{ fontSize: 20 }} />;
  }, [muted, volume]);

  return (
    <Box
      onClick={(e) => e.stopPropagation()}
      sx={{
        position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 10,
        background: "linear-gradient(transparent, rgba(0,0,0,0.9))",
        px: { xs: 1, sm: 2 }, pt: 8, pb: { xs: 1, sm: 1.5 },
        opacity: showControls ? 1 : 0, transition: "opacity 0.3s",
        display: "flex", flexDirection: "column",
      }}
    >
      {/* Progress bar */}
      <Box
        ref={progressRef}
        onMouseEnter={() => setProgressHovered(true)}
        onMouseLeave={() => { setProgressHovered(false); setHoverTime(null); }}
        onMouseMove={handleProgressHover}
        sx={{ position: "relative", height: 20, display: "flex", alignItems: "center", cursor: "pointer", mb: 0.5 }}
      >
        {hoverTime !== null && progressHovered && (
          <Box sx={{
            position: "fixed", left: hoverX, bottom: 68,
            transform: "translateX(-50%)",
            bgcolor: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)",
            color: "common.white", px: 1, py: 0.25, borderRadius: 1,
            fontSize: 12, fontWeight: 600, fontVariantNumeric: "tabular-nums",
            pointerEvents: "none", zIndex: 20,
          }}>
            {formatTime(hoverTime)}
          </Box>
        )}

        <LinearProgress
          variant="determinate"
          value={buffered}
          color="inherit"
          sx={{
            position: "absolute", left: 0, right: 0,
            height: progressHovered ? 6 : 3, borderRadius: 2,
            transition: "height 0.15s",
            bgcolor: "rgba(255,255,255,0.15)",
            "& .MuiLinearProgress-bar": { bgcolor: "rgba(255,255,255,0.3)", borderRadius: 2 },
          }}
        />
        <Slider
          value={currentTime}
          min={0}
          max={duration || 1}
          onChange={seek}
          size="small"
          sx={{
            position: "absolute", left: 0, right: 0, p: 0,
            color: "inherit", height: progressHovered ? 6 : 3,
            transition: "height 0.15s",
            "& .MuiSlider-rail": { bgcolor: "transparent" },
            "& .MuiSlider-track": { borderRadius: 2 },
            "& .MuiSlider-thumb": {
              width: progressHovered ? 16 : 0, height: progressHovered ? 16 : 0,
              transition: "0.15s",
              boxShadow: "0 0 8px rgba(0,0,0,0.6)",
              bgcolor: "common.white",
            },
          }}
        />
      </Box>

      {/* Controls row */}
      <Box sx={{ display: "flex", alignItems: "center", gap: { xs: 0.25, sm: 0.5 } }}>
        <IconButton size="small" onClick={togglePlay} sx={{ color: "rgba(255,255,255,0.9)" }}>
          {playing ? <PauseOutlinedIcon /> : <PlayArrowOutlinedIcon />}
        </IconButton>

        <IconButton size="small" onClick={() => skip(-10)} sx={{ color: "rgba(255,255,255,0.7)" }}>
          <Replay10OutlinedIcon sx={{ fontSize: 20 }} />
        </IconButton>
        <IconButton size="small" onClick={() => skip(10)} sx={{ color: "rgba(255,255,255,0.7)" }}>
          <Forward10OutlinedIcon sx={{ fontSize: 20 }} />
        </IconButton>

        <Typography sx={{ color: "rgba(255,255,255,0.8)", mx: 1, fontSize: 12, flexShrink: 0, fontVariantNumeric: "tabular-nums" }}>
          {formatTime(currentTime)} / {formatTime(duration)}
        </Typography>

        <Box sx={{ flex: 1 }} />

        {/* Volume */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.25, "&:hover .volume-slider": { width: 70, opacity: 1 } }}>
          <IconButton size="small" onClick={toggleMute} sx={{ color: "rgba(255,255,255,0.8)" }}>
            {volumeIcon}
          </IconButton>
          <Slider
            className="volume-slider"
            value={muted ? 0 : volume}
            min={0}
            max={1}
            step={0.05}
            onChange={changeVolume}
            size="small"
            sx={{ width: 0, opacity: 0, transition: "width 0.2s, opacity 0.2s", color: "common.white", "& .MuiSlider-thumb": { width: 10, height: 10 } }}
          />
        </Box>

        {/* Speed */}
        <Tooltip title={`${speed}x`}>
          <IconButton size="small" onClick={(_e) => setSpeedAnchor(_e.currentTarget)} sx={{ color: "rgba(255,255,255,0.8)" }}>
            {speed !== 1 ? <Typography sx={{ fontSize: 12, color: "primary.main", fontWeight: 700 }}>{speed}x</Typography> : <SpeedOutlinedIcon sx={{ fontSize: 20 }} />}
          </IconButton>
        </Tooltip>
        <Menu
          open={!!speedAnchor}
          anchorEl={speedAnchor}
          onClose={() => setSpeedAnchor(null)}
          MenuListProps={{ dense: true, sx: { px: 0.5 } }}
          slotProps={{ paper: { sx: {
            bgcolor: "rgba(0,0,0,0.85)", backdropFilter: "blur(16px)",
            border: 1, borderColor: "rgba(255,255,255,0.1)", borderRadius: 2,
          } } }}
          anchorOrigin={{ vertical: "top", horizontal: "center" }}
          transformOrigin={{ vertical: "bottom", horizontal: "center" }}
        >
          {SPEEDS.map((s) => (
            <MenuItem key={s} selected={s === speed} onClick={() => changeSpeed(s)}
              sx={{ borderRadius: 1, color: "rgba(255,255,255,0.9)", fontSize: 13, minHeight: 0, py: 0.5,
                "&.Mui-selected": { bgcolor: "rgba(255,255,255,0.1)" } }}
            >
              {s}x
            </MenuItem>
          ))}
        </Menu>

        {/* PiP */}
        <Tooltip title="Picture-in-Picture">
          <IconButton size="small" onClick={togglePiP} sx={{ color: "rgba(255,255,255,0.8)" }}>
            <PictureInPictureAltOutlinedIcon sx={{ fontSize: 20 }} />
          </IconButton>
        </Tooltip>

        {/* Fullscreen */}
        <IconButton size="small" onClick={toggleFullscreen} sx={{ color: "rgba(255,255,255,0.8)" }}>
          {isFullscreen ? <FullscreenExitOutlinedIcon sx={{ fontSize: 22 }} /> : <FullscreenOutlinedIcon sx={{ fontSize: 22 }} />}
        </IconButton>
      </Box>
    </Box>
  );
});

export default VideoControls;
