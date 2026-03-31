/**
 * VideoViewer — Lecteur video avance avec streaming, PiP, gestes tactiles.
 *
 * - Barre de progression inherit, epaissie au hover, preview thumbnail
 * - Double-clic fullscreen, PiP
 * - Poster/couverture floue tant que la video n'est pas chargee
 * - Gestes tactiles : swipe horizontal pour avancer/reculer
 * - Raccourcis clavier : espace, f, m, fleches, PiP (p)
 */

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import { Box, CircularProgress, Typography } from "@mui/material";
import PlayArrowOutlinedIcon from "@mui/icons-material/PlayArrowOutlined";
import useAdaptiveThumbnail from "@/hooks/useAdaptiveThumbnail";
import type { RootState } from "@/redux/store";
import VideoControls from "./VideoControls";

interface VideoViewerProps {
  fileUrl: string;
  filename: string;
}



// ── Cache module-level : blob URLs persistent entre ouvertures ──
const videoCache = new Map<string, string>(); // fileUrl → blobURL
const MAX_CACHE = 20;

function evictOldest() {
  if (videoCache.size <= MAX_CACHE) return;
  const first = videoCache.keys().next().value;
  if (first) {
    URL.revokeObjectURL(videoCache.get(first)!);
    videoCache.delete(first);
  }
}

const VideoViewer = React.memo(function VideoViewer({ fileUrl }: VideoViewerProps) {
  const { t } = useTranslation();
  const token = useSelector((store: RootState) => store.user.token);
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);

  // Poster/couverture via thumbnail
  const { src: posterSrc, isBlurred: posterBlurred } = useAdaptiveThumbnail(fileUrl);

  const [streamUrl, setStreamUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [videoReady, setVideoReady] = useState(false);

  // Player state
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [buffered, setBuffered] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [speedAnchor, setSpeedAnchor] = useState<null | HTMLElement>(null);
  const [hoverTime, setHoverTime] = useState<number | null>(null);
  const [hoverX, setHoverX] = useState(0);
  const [progressHovered, setProgressHovered] = useState(false);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Touch gesture
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);

  // Charger la video : cache local d'abord, sinon stream token
  useEffect(() => {
    if (!fileUrl || !token) return;
    let cancelled = false;
    setError(false);
    setVideoReady(false);

    // 1. Cache local → lecture instantanee
    const cachedBlob = videoCache.get(fileUrl);
    if (cachedBlob) {
      setStreamUrl(cachedBlob);
      
      setLoading(false);
      return;
    }

    // 2. Pas en cache → telecharger le blob complet
    setLoading(true);
    setStreamUrl(null);
    

    fetch(fileUrl, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => { if (!res.ok) throw new Error(); return res.blob(); })
      .then((blob) => {
        if (cancelled) return;
        evictOldest();
        const blobUrl = URL.createObjectURL(blob);
        videoCache.set(fileUrl, blobUrl);
        setStreamUrl(blobUrl);
        
        setLoading(false);
      })
      .catch(() => { if (!cancelled) { setError(true); setLoading(false); } });
    return () => { cancelled = true; };
  }, [fileUrl, token]);

  // Video events
  const onLoadedMetadata = useCallback(() => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
      setVideoReady(true);
    }
  }, []);
  const onCanPlay = useCallback(() => setVideoReady(true), []);
  const onTimeUpdate = useCallback(() => {
    if (videoRef.current) setCurrentTime(videoRef.current.currentTime);
  }, []);
  const onPlay = useCallback(() => setPlaying(true), []);
  const onPause = useCallback(() => setPlaying(false), []);
  const onEnded = useCallback(() => setPlaying(false), []);
  const onProgress = useCallback(() => {
    if (!videoRef.current || !videoRef.current.buffered.length) return;
    const end = videoRef.current.buffered.end(videoRef.current.buffered.length - 1);
    setBuffered(videoRef.current.duration > 0 ? (end / videoRef.current.duration) * 100 : 0);
  }, []);

  // Controls
  const togglePlay = useCallback(() => {
    if (!videoRef.current) return;
    if (playing) videoRef.current.pause();
    else videoRef.current.play().catch(() => {});
  }, [playing]);

  const seek = useCallback((_: any, val: number | number[]) => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = val as number;
    setCurrentTime(val as number);
  }, []);

  const skip = useCallback((seconds: number) => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = Math.max(0, Math.min(duration, videoRef.current.currentTime + seconds));
  }, [duration]);

  const changeVolume = useCallback((_: any, val: number | number[]) => {
    if (!videoRef.current) return;
    const v = val as number;
    videoRef.current.volume = v;
    setVolume(v);
    setMuted(v === 0);
  }, []);

  const toggleMute = useCallback(() => {
    if (!videoRef.current) return;
    const newMuted = !muted;
    videoRef.current.muted = newMuted;
    setMuted(newMuted);
  }, [muted]);

  const changeSpeed = useCallback((s: number) => {
    if (!videoRef.current) return;
    videoRef.current.playbackRate = s;
    setSpeed(s);
    setSpeedAnchor(null);
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return;
    if (document.fullscreenElement) { document.exitFullscreen(); setIsFullscreen(false); }
    else { containerRef.current.requestFullscreen().catch(() => {}); setIsFullscreen(true); }
  }, []);

  const togglePiP = useCallback(async () => {
    if (!videoRef.current) return;
    try {
      if (document.pictureInPictureElement) await document.exitPictureInPicture();
      else await videoRef.current.requestPictureInPicture();
    } catch { /* PiP non supporte */ }
  }, []);

  // Auto-hide controls
  const resetHideTimer = useCallback(() => {
    setShowControls(true);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => { if (playing) setShowControls(false); }, 3000);
  }, [playing]);

  useEffect(() => { resetHideTimer(); }, [playing, resetHideTimer]);

  // Fullscreen change listener
  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  // Autoplay
  useEffect(() => {
    if (streamUrl && videoRef.current) videoRef.current.play().catch(() => {});
  }, [streamUrl]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === " ") { e.preventDefault(); togglePlay(); }
      else if (e.key === "f") toggleFullscreen();
      else if (e.key === "m") toggleMute();
      else if (e.key === "p") togglePiP();
      else if (e.key === "ArrowLeft") { e.preventDefault(); skip(-5); }
      else if (e.key === "ArrowRight") { e.preventDefault(); skip(5); }
      else if (e.key === "ArrowUp") { e.preventDefault(); changeVolume(null, Math.min(1, volume + 0.1)); }
      else if (e.key === "ArrowDown") { e.preventDefault(); changeVolume(null, Math.max(0, volume - 0.1)); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [togglePlay, toggleFullscreen, toggleMute, togglePiP, skip, changeVolume, volume]);

  // Double-click → fullscreen
  const clickCount = useRef(0);
  const clickTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleVideoClick = useCallback((_: React.MouseEvent) => {
    clickCount.current++;
    if (clickCount.current === 1) {
      clickTimer.current = setTimeout(() => {
        if (clickCount.current === 1) togglePlay();
        clickCount.current = 0;
      }, 250);
    } else if (clickCount.current === 2) {
      if (clickTimer.current) clearTimeout(clickTimer.current);
      clickCount.current = 0;
      toggleFullscreen();
    }
  }, [togglePlay, toggleFullscreen]);

  // Touch gestures
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY, time: Date.now() };
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    const touch = e.changedTouches[0];
    const dx = touch.clientX - touchStartRef.current.x;
    const dy = touch.clientY - touchStartRef.current.y;
    const dt = Date.now() - touchStartRef.current.time;
    touchStartRef.current = null;
    // Swipe horizontal (> 60px, < 300ms, plus horizontal que vertical)
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 2 && dt < 300) {
      skip(dx > 0 ? 10 : -10);
    }
  }, [skip]);

  // Progress bar hover → show time preview
  const handleProgressHover = useCallback((e: React.MouseEvent) => {
    if (!progressRef.current || !duration) return;
    const rect = progressRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, x / rect.width));
    setHoverTime(ratio * duration);
    setHoverX(e.clientX);
  }, [duration]);

  if (loading) {
    return (
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", width: "100%", height: "100%", position: "relative" }}>
        {/* Poster en arriere-plan pendant le chargement */}
        {posterSrc && (
          <Box component="img" src={posterSrc} sx={{
            position: "absolute", inset: 0, width: "100%", height: "100%",
            objectFit: "contain", filter: posterBlurred ? "blur(8px)" : "blur(2px)", opacity: 0.5,
          }} />
        )}
        <CircularProgress sx={{ color: "common.white", zIndex: 1 }} />
      </Box>
    );
  }

  if (error || !streamUrl) {
    return (
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", width: "100%", height: "100%" }}>
        <Typography sx={{ color: "common.white" }}>{t("viewer.noPreview")}</Typography>
      </Box>
    );
  }


  return (
    <Box
      ref={containerRef}
      onMouseMove={resetHideTimer}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      sx={{ position: "relative", width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", bgcolor: "common.black" }}
    >
      {/* Poster floue en arriere-plan tant que la video n'est pas prete */}
      {posterSrc && !videoReady && (
        <Box component="img" src={posterSrc} sx={{
          position: "absolute", inset: 0, width: "100%", height: "100%",
          objectFit: "contain", filter: posterBlurred ? "blur(12px)" : "blur(4px)", opacity: 0.6,
          transition: "opacity 0.5s",
        }} />
      )}

      {/* Video element */}
      <Box
        component="video"
        ref={videoRef}
        src={streamUrl}
        onLoadedMetadata={onLoadedMetadata}
        onCanPlay={onCanPlay}
        onTimeUpdate={onTimeUpdate}
        onPlay={onPlay}
        onPause={onPause}
        onEnded={onEnded}
        onProgress={onProgress}
        onClick={handleVideoClick}
        sx={{
          maxWidth: "100%", maxHeight: "100%", borderRadius: 0, outline: "none",
          cursor: "pointer", zIndex: 1,
        }}
      />

      {/* Big play button center */}
      {!playing && videoReady && (
        <Box onClick={handleVideoClick} sx={{
          position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 2, cursor: "pointer",
        }}>
          <Box sx={{
            bgcolor: "rgba(0,0,0,0.45)", borderRadius: "50%", width: 72, height: 72,
            display: "flex", alignItems: "center", justifyContent: "center",
            backdropFilter: "blur(8px)", transition: "transform 0.15s",
            "&:hover": { transform: "scale(1.1)" },
          }}>
            <PlayArrowOutlinedIcon sx={{ color: "common.white", fontSize: 44 }} />
          </Box>
        </Box>
      )}

      {/* Loading spinner overlay */}
      {!videoReady && !loading && (
        <Box sx={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2 }}>
          <CircularProgress sx={{ color: "common.white" }} />
        </Box>
      )}

      {/* Controls overlay */}
      <VideoControls
        playing={playing}
        showControls={showControls}
        currentTime={currentTime}
        duration={duration}
        buffered={buffered}
        volume={volume}
        muted={muted}
        speed={speed}
        isFullscreen={isFullscreen}
        hoverTime={hoverTime}
        hoverX={hoverX}
        progressHovered={progressHovered}
        speedAnchor={speedAnchor}
        progressRef={progressRef}
        togglePlay={togglePlay}
        skip={skip}
        seek={seek}
        changeVolume={changeVolume}
        toggleMute={toggleMute}
        changeSpeed={changeSpeed}
        toggleFullscreen={toggleFullscreen}
        togglePiP={togglePiP}
        setSpeedAnchor={setSpeedAnchor}
        setProgressHovered={setProgressHovered}
        setHoverTime={setHoverTime}
        handleProgressHover={handleProgressHover}
      />
    </Box>
  );
});

export default VideoViewer;
