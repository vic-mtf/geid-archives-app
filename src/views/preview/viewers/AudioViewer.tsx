/**
 * AudioViewer — Lecteur audio avance avec couverture, egaliseur anime.
 *
 * - Couverture (thumbnail du fichier) floue en arriere-plan
 * - Mini egaliseur anime pendant la lecture
 * - Memes controles que le video : play/pause, seek, volume, vitesse
 * - Cache blob local
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSelector } from "react-redux";
import {
  Box, CircularProgress, IconButton, LinearProgress, Slider, Typography, Tooltip, Menu, MenuItem,
} from "@mui/material";
import PlayArrowOutlinedIcon from "@mui/icons-material/PlayArrowOutlined";
import PauseOutlinedIcon from "@mui/icons-material/PauseOutlined";
import VolumeUpOutlinedIcon from "@mui/icons-material/VolumeUpOutlined";
import VolumeOffOutlinedIcon from "@mui/icons-material/VolumeOffOutlined";
import VolumeDownOutlinedIcon from "@mui/icons-material/VolumeDownOutlined";
import SkipNextOutlinedIcon from "@mui/icons-material/SkipNextOutlined";
import SkipPreviousOutlinedIcon from "@mui/icons-material/SkipPreviousOutlined";
import SpeedOutlinedIcon from "@mui/icons-material/SpeedOutlined";
import MusicNoteOutlinedIcon from "@mui/icons-material/MusicNoteOutlined";
import useAdaptiveThumbnail from "@/hooks/useAdaptiveThumbnail";
import type { RootState } from "@/redux/store";

// ── Cache ──
const audioCache = new Map<string, string>();
const MAX_CACHE = 30;
function evictOldest() {
  if (audioCache.size <= MAX_CACHE) return;
  const first = audioCache.keys().next().value;
  if (first) { URL.revokeObjectURL(audioCache.get(first)!); audioCache.delete(first); }
}

function formatTime(s: number): string {
  if (!s || isNaN(s)) return "0:00";
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = Math.floor(s % 60);
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  return `${m}:${String(sec).padStart(2, "0")}`;
}

const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2];
const BAR_COUNT = 32;

interface AudioViewerProps {
  fileUrl: string;
  filename: string;
}

/** Mini egaliseur anime */
const Equalizer = React.memo(function Equalizer({ playing }: { playing: boolean }) {
  return (
    <Box sx={{ display: "flex", alignItems: "flex-end", gap: "3px", height: 40 }}>
      {Array.from({ length: BAR_COUNT }).map((_, i) => (
        <Box
          key={i}
          sx={{
            width: 3, borderRadius: 1,
            bgcolor: "primary.main",
            opacity: 0.8,
            height: playing ? undefined : 4,
            animation: playing ? `eqBar ${0.4 + Math.random() * 0.6}s ease-in-out infinite alternate` : "none",
            animationDelay: `${i * 0.05}s`,
            "@keyframes eqBar": {
              "0%": { height: 4 },
              "100%": { height: 8 + Math.random() * 32 },
            },
          }}
        />
      ))}
    </Box>
  );
});

const AudioViewer = React.memo(function AudioViewer({ fileUrl, filename }: AudioViewerProps) {
  const token = useSelector((store: RootState) => store.user.token);
  const audioRef = useRef<HTMLAudioElement>(null);

  const { src: coverSrc, isBlurred: coverBlurred } = useAdaptiveThumbnail(fileUrl);

  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [buffered, setBuffered] = useState(0);
  const [speedAnchor, setSpeedAnchor] = useState<null | HTMLElement>(null);

  // Fetch avec cache
  useEffect(() => {
    if (!fileUrl || !token) return;
    let cancelled = false;

    const cached = audioCache.get(fileUrl);
    if (cached) { setBlobUrl(cached); setLoading(false); return; }

    setLoading(true);
    fetch(fileUrl, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => res.blob())
      .then((blob) => {
        if (cancelled) return;
        evictOldest();
        const url = URL.createObjectURL(blob);
        audioCache.set(fileUrl, url);
        setBlobUrl(url);
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [fileUrl, token]);

  // Audio events
  const onLoadedMetadata = useCallback(() => { if (audioRef.current) setDuration(audioRef.current.duration); }, []);
  const onTimeUpdate = useCallback(() => { if (audioRef.current) setCurrentTime(audioRef.current.currentTime); }, []);
  const onPlay = useCallback(() => setPlaying(true), []);
  const onPause = useCallback(() => setPlaying(false), []);
  const onEnded = useCallback(() => setPlaying(false), []);
  const onProgress = useCallback(() => {
    if (!audioRef.current || !audioRef.current.buffered.length) return;
    const end = audioRef.current.buffered.end(audioRef.current.buffered.length - 1);
    setBuffered(audioRef.current.duration > 0 ? (end / audioRef.current.duration) * 100 : 0);
  }, []);

  // Controls
  const togglePlay = useCallback(() => {
    if (!audioRef.current) return;
    if (playing) audioRef.current.pause(); else audioRef.current.play().catch(() => {});
  }, [playing]);

  const seek = useCallback((_: any, val: number | number[]) => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = val as number;
    setCurrentTime(val as number);
  }, []);

  const skip = useCallback((seconds: number) => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = Math.max(0, Math.min(duration, audioRef.current.currentTime + seconds));
  }, [duration]);

  const changeVolume = useCallback((_: any, val: number | number[]) => {
    if (!audioRef.current) return;
    const v = val as number;
    audioRef.current.volume = v;
    setVolume(v);
    setMuted(v === 0);
  }, []);

  const toggleMute = useCallback(() => {
    if (!audioRef.current) return;
    const m = !muted;
    audioRef.current.muted = m;
    setMuted(m);
  }, [muted]);

  const changeSpeed = useCallback((s: number) => {
    if (!audioRef.current) return;
    audioRef.current.playbackRate = s;
    setSpeed(s);
    setSpeedAnchor(null);
  }, []);

  // Autoplay
  useEffect(() => { if (blobUrl && audioRef.current) audioRef.current.play().catch(() => {}); }, [blobUrl]);

  // Keyboard
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === " ") { e.preventDefault(); togglePlay(); }
      else if (e.key === "m") toggleMute();
      else if (e.key === "ArrowLeft") { e.preventDefault(); skip(-5); }
      else if (e.key === "ArrowRight") { e.preventDefault(); skip(5); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [togglePlay, toggleMute, skip]);

  const volumeIcon = useMemo(() => {
    if (muted || volume === 0) return <VolumeOffOutlinedIcon sx={{ fontSize: 20 }} />;
    if (volume < 0.5) return <VolumeDownOutlinedIcon sx={{ fontSize: 20 }} />;
    return <VolumeUpOutlinedIcon sx={{ fontSize: 20 }} />;
  }, [muted, volume]);


  return (
    <Box sx={{ position: "relative", width: "100%", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>

      {/* Couverture floue en arriere-plan */}
      {coverSrc && (
        <Box component="img" src={coverSrc} sx={{
          position: "absolute", inset: 0, width: "100%", height: "100%",
          objectFit: "cover", filter: "blur(40px) brightness(0.4) saturate(1.5)",
          pointerEvents: "none",
        }} />
      )}
      {!coverSrc && (
        <Box sx={{ position: "absolute", inset: 0, bgcolor: "rgba(0,0,0,0.6)" }} />
      )}

      {/* Audio element cache */}
      {blobUrl && (
        <audio
          ref={audioRef}
          src={blobUrl}
          onLoadedMetadata={onLoadedMetadata}
          onTimeUpdate={onTimeUpdate}
          onPlay={onPlay}
          onPause={onPause}
          onEnded={onEnded}
          onProgress={onProgress}
          style={{ display: "none" }}
        />
      )}

      {/* Contenu central */}
      <Box sx={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3, maxWidth: 500, width: "100%", px: 3 }}>

        {/* Couverture ou icone */}
        <Box sx={{
          width: 200, height: 200, borderRadius: 4, overflow: "hidden",
          boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
          display: "flex", alignItems: "center", justifyContent: "center",
          bgcolor: "rgba(255,255,255,0.05)",
          border: 1, borderColor: "rgba(255,255,255,0.1)",
        }}>
          {coverSrc ? (
            <Box component="img" src={coverSrc} sx={{
              width: "100%", height: "100%", objectFit: "cover",
              filter: coverBlurred ? "blur(4px)" : "none",
              transition: "filter 0.3s",
            }} />
          ) : (
            <MusicNoteOutlinedIcon sx={{ fontSize: 80, color: "common.white", opacity: 0.3 }} />
          )}
        </Box>

        {/* Titre */}
        <Typography variant="h6" noWrap sx={{ color: "common.white", textAlign: "center", width: "100%", fontWeight: 600 }}>
          {filename}
        </Typography>

        {/* Egaliseur */}
        {loading ? (
          <CircularProgress sx={{ color: "common.white" }} />
        ) : (
          <Equalizer playing={playing} />
        )}

        {/* Barre de progression */}
        <Box sx={{ width: "100%", position: "relative", height: 20, display: "flex", alignItems: "center" }}>
          <LinearProgress
            variant="determinate"
            value={buffered}
            color="inherit"
            sx={{
              position: "absolute", left: 0, right: 0, height: 3, borderRadius: 2,
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
              color: "inherit", height: 3,
              "& .MuiSlider-rail": { bgcolor: "transparent" },
              "& .MuiSlider-track": { borderRadius: 2 },
              "& .MuiSlider-thumb": { width: 14, height: 14, bgcolor: "common.white", boxShadow: "0 0 8px rgba(0,0,0,0.5)" },
            }}
          />
        </Box>

        {/* Temps */}
        <Box sx={{ display: "flex", justifyContent: "space-between", width: "100%", mt: -2 }}>
          <Typography sx={{ color: "rgba(255,255,255,0.7)", fontSize: 12, fontVariantNumeric: "tabular-nums" }}>
            {formatTime(currentTime)}
          </Typography>
          <Typography sx={{ color: "rgba(255,255,255,0.7)", fontSize: 12, fontVariantNumeric: "tabular-nums" }}>
            {formatTime(duration)}
          </Typography>
        </Box>

        {/* Controles */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          {/* Volume */}
          <Box sx={{ display: "flex", alignItems: "center", "&:hover .vol-slider": { width: 60, opacity: 1 } }}>
            <IconButton size="small" onClick={toggleMute} sx={{ color: "rgba(255,255,255,0.8)" }}>
              {volumeIcon}
            </IconButton>
            <Slider
              className="vol-slider"
              value={muted ? 0 : volume}
              min={0} max={1} step={0.05}
              onChange={changeVolume}
              size="small"
              sx={{ width: 0, opacity: 0, transition: "width 0.2s, opacity 0.2s", color: "common.white", "& .MuiSlider-thumb": { width: 10, height: 10 } }}
            />
          </Box>

          <IconButton onClick={() => skip(-10)} sx={{ color: "rgba(255,255,255,0.7)" }}>
            <SkipPreviousOutlinedIcon />
          </IconButton>

          <IconButton
            onClick={togglePlay}
            sx={{
              color: "common.white", bgcolor: "rgba(255,255,255,0.15)",
              width: 56, height: 56,
              "&:hover": { bgcolor: "rgba(255,255,255,0.25)" },
            }}
          >
            {playing ? <PauseOutlinedIcon sx={{ fontSize: 32 }} /> : <PlayArrowOutlinedIcon sx={{ fontSize: 32 }} />}
          </IconButton>

          <IconButton onClick={() => skip(10)} sx={{ color: "rgba(255,255,255,0.7)" }}>
            <SkipNextOutlinedIcon />
          </IconButton>

          {/* Vitesse */}
          <Tooltip title={`${speed}x`}>
            <IconButton size="small" onClick={(e) => setSpeedAnchor(e.currentTarget)} sx={{ color: "rgba(255,255,255,0.8)" }}>
              {speed !== 1 ? <Typography sx={{ fontSize: 12, color: "primary.main", fontWeight: 700 }}>{speed}x</Typography> : <SpeedOutlinedIcon sx={{ fontSize: 20 }} />}
            </IconButton>
          </Tooltip>
          <Menu
            open={!!speedAnchor}
            anchorEl={speedAnchor}
            onClose={() => setSpeedAnchor(null)}
            MenuListProps={{ dense: true, sx: { px: 0.5 } }}
            slotProps={{ paper: { sx: { bgcolor: "rgba(0,0,0,0.85)", backdropFilter: "blur(16px)", border: 1, borderColor: "rgba(255,255,255,0.1)", borderRadius: 2 } } }}
            anchorOrigin={{ vertical: "top", horizontal: "center" }}
            transformOrigin={{ vertical: "bottom", horizontal: "center" }}
          >
            {SPEEDS.map((s) => (
              <MenuItem key={s} selected={s === speed} onClick={() => changeSpeed(s)}
                sx={{ borderRadius: 1, color: "rgba(255,255,255,0.9)", fontSize: 13, minHeight: 0, py: 0.5, "&.Mui-selected": { bgcolor: "rgba(255,255,255,0.1)" } }}
              >
                {s}x
              </MenuItem>
            ))}
          </Menu>
        </Box>
      </Box>
    </Box>
  );
});

export default AudioViewer;
