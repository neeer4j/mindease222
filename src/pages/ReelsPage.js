// src/pages/ReelsPage.js

import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  forwardRef,
  useMemo,
} from 'react';
import {
  Box,
  Typography,
  Skeleton,
  Card,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { styled } from '@mui/system';
import { motion, AnimatePresence } from 'framer-motion';

// Existing Icons
import VolumeOffIcon from '@mui/icons-material/VolumeOff';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import FavoriteIcon from '@mui/icons-material/Favorite';

// NEW: Play/Pause Icons for the tap animation
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';

// Import Firebase Storage functions (ensure Firebase is configured)
import { getStorage, ref as storageRef, list, getDownloadURL } from 'firebase/storage';

// ------------------------------------------------------------------
// Styled Components & Scroll Snap Setup
// ------------------------------------------------------------------

const ReelsContainer = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'isMobile' && prop !== 'bottomNavHeight',
})(({ theme, isMobile, bottomNavHeight }) => ({
  width: '100%',
  height: isMobile ? `calc(100vh - ${bottomNavHeight}px)` : '100vh',
  overflowY: 'auto',
  scrollSnapType: 'y mandatory',
  scrollBehavior: 'smooth',
  backgroundColor: theme.palette.background.default,
  '&::-webkit-scrollbar': {
    display: 'none',
  },
  msOverflowStyle: 'none',
  scrollbarWidth: 'none',
}));

const ReelsWrapper = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'isMobile',
})(({ isMobile }) => ({
  width: isMobile ? '100%' : '600px',
  height: '100%',
  margin: isMobile ? 0 : '0 auto',
}));

const ReelItem = styled(motion.div, {
  shouldForwardProp: (prop) => prop !== 'isMobile' && prop !== 'bottomNavHeight',
})(({ isMobile, bottomNavHeight }) => ({
  height: isMobile ? `calc(100vh - ${bottomNavHeight}px)` : '100vh',
  scrollSnapAlign: 'start',
  scrollSnapStop: 'always',
  position: 'relative',
  overflow: 'hidden',
}));

const VideoCard = styled(Card)(({ theme }) => ({
  borderRadius: '12px',
  overflow: 'hidden',
  position: 'relative',
  height: '100%',
  boxShadow: '0 0 10px rgba(0,0,0,0.3)',
}));

const BottomGradientOverlay = styled(Box)(() => ({
  position: 'absolute',
  bottom: 0,
  left: 0,
  right: 0,
  height: '35%',
  background: 'linear-gradient(to top, rgba(0, 0, 0, 0.8), transparent)',
  pointerEvents: 'none',
  zIndex: 1,
}));

const VolumeOverlay = styled(Box)(({ theme }) => ({
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  backgroundColor: 'rgba(0, 0, 0, 0.6)',
  borderRadius: '50%',
  padding: theme.spacing(1),
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 10,
}));

const BigHeartOverlay = styled(motion.div)(({ theme }) => ({
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  pointerEvents: 'none',
  zIndex: 11,
}));

// Increase z-index so that the volume button is not overlapped by text.
const RightSideControls = styled(Box)(() => ({
  position: 'absolute',
  right: 16,
  bottom: 100,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  zIndex: 6,
}));

const IconButtonWrapper = styled(motion.div)(({ theme }) => ({
  marginBottom: theme.spacing(2),
  cursor: 'pointer',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
}));

const IconCountText = styled(Typography)(({ theme }) => ({
  color: '#fff',
  fontSize: '0.9rem',
  marginTop: theme.spacing(0.5),
  textShadow: '1px 1px 2px rgba(0,0,0,0.7)',
}));

const VideoTextInfo = styled(Box)(() => ({
  position: 'absolute',
  bottom: 16,
  left: 16,
  right: 16,
  zIndex: 5,
  padding: '8px',
  display: 'flex',
  flexDirection: 'column',
  gap: '4px',
}));

// NEW: Progress (seek) bar at the bottom of the video
const ProgressBarContainer = styled(Box)(() => ({
  position: 'absolute',
  bottom: 0,
  left: 0,
  width: '100%',
  height: '4px',
  backgroundColor: 'rgba(255,255,255,0.3)',
  zIndex: 9,
  cursor: 'pointer',
}));

const ProgressBar = styled(Box)(({ progress }) => ({
  width: `${progress}%`,
  height: '100%',
  backgroundColor: '#fff',
  transition: 'width 0.1s linear', // Using linear transition for a continuous feel
}));

// ------------------------------------------------------------------
// VideoReelItem Component
// ------------------------------------------------------------------

const VideoReelItem = forwardRef(
  (
    { video, isMobile, bottomNavHeight, index, onVisible, globalMuted, setGlobalMuted },
    ref
  ) => {
    const videoRef = useRef(null);
    const [isVideoLoading, setIsVideoLoading] = useState(true);
    const [isLiked, setIsLiked] = useState(false);
    const [showBigHeart, setShowBigHeart] = useState(false);
    const [manuallyPaused, setManuallyPaused] = useState(false);
    const [showVolumeIcon, setShowVolumeIcon] = useState(false);
    const [likeCount, setLikeCount] = useState(video.likeCount || 120);

    // NEW: For play/pause icon animation on single tap
    const [playPauseIcon, setPlayPauseIcon] = useState(null); // 'play' or 'pause'
    const [showPlayPauseIcon, setShowPlayPauseIcon] = useState(false);

    // NEW: For progress bar
    const [videoProgress, setVideoProgress] = useState(0);

    // For single/double-tap logic
    const SINGLE_TAP_DELAY = 300;
    const lastTapRef = useRef(0);
    const singleTapTimeoutRef = useRef(null);

    const MemoizedVolumeUpIcon = useMemo(
      () => <VolumeUpIcon sx={{ color: '#fff', fontSize: 40 }} />,
      []
    );
    const MemoizedVolumeOffIcon = useMemo(
      () => <VolumeOffIcon sx={{ color: '#fff', fontSize: 40 }} />,
      []
    );

    // Set muted state from global value.
    useEffect(() => {
      if (videoRef.current) {
        videoRef.current.muted = globalMuted;
      }
    }, [globalMuted]);

    // Intersection Observer: autoplay when sufficiently visible and pause otherwise.
    useEffect(() => {
      const handleIntersection = (entries) => {
        entries.forEach((entry) => {
          if (!videoRef.current) return;
          // On mobile, use a threshold of 0.5 to trigger autoplay when at least 50% is visible.
          if (!manuallyPaused && entry.intersectionRatio >= (isMobile ? 0.5 : 1)) {
            videoRef.current
              .play()
              .catch((error) => console.error('Error playing video:', error));
            if (onVisible) onVisible(index);
          } else {
            videoRef.current.pause();
          }
        });
      };

      const observer = new IntersectionObserver(handleIntersection, {
        threshold: isMobile ? 0.5 : 1,
      });

      if (videoRef.current) {
        observer.observe(videoRef.current);
      }

      return () => {
        observer.disconnect();
      };
    }, [manuallyPaused, onVisible, index, isMobile]);

    const handleVideoLoadedData = useCallback(() => {
      setIsVideoLoading(false);
    }, []);

    const handleVideoError = useCallback(() => {
      setIsVideoLoading(false);
      console.error('Error loading video:', video.videoUrl);
    }, [video.videoUrl]);

    // Continuously update progress using requestAnimationFrame.
    useEffect(() => {
      let animationFrameId;
      const updateProgress = () => {
        if (videoRef.current && videoRef.current.duration) {
          const progress = (videoRef.current.currentTime / videoRef.current.duration) * 100;
          setVideoProgress(progress);
        }
        animationFrameId = requestAnimationFrame(updateProgress);
      };
      updateProgress();
      return () => cancelAnimationFrame(animationFrameId);
    }, []);

    // Allow seeking by clicking or touching on the progress bar.
    const handleSeek = useCallback((e) => {
      if (!videoRef.current || !videoRef.current.duration) return;
      // Support both mouse and touch events.
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const rect = e.currentTarget.getBoundingClientRect();
      const clickX = clientX - rect.left;
      const newTime = (clickX / rect.width) * videoRef.current.duration;
      videoRef.current.currentTime = newTime;
      setVideoProgress((newTime / videoRef.current.duration) * 100);
    }, []);

    // Modified togglePlayPause to show an icon animation.
    const togglePlayPause = useCallback(() => {
      if (!videoRef.current) return;
      if (videoRef.current.paused) {
        videoRef.current.play().catch(console.error);
        setManuallyPaused(false);
        setPlayPauseIcon('pause');
      } else {
        videoRef.current.pause();
        setManuallyPaused(true);
        setPlayPauseIcon('play');
      }
      setShowPlayPauseIcon(true);
      setTimeout(() => setShowPlayPauseIcon(false), 800);
    }, []);

    const doLike = useCallback(() => {
      setIsLiked((prev) => !prev);
      setShowBigHeart(true);
      setTimeout(() => setShowBigHeart(false), 800);
      setLikeCount((prev) => (isLiked ? prev - 1 : prev + 1));
    }, [isLiked]);

    const handleVideoClick = useCallback(
      (e) => {
        e.stopPropagation();
        const now = Date.now();
        const timeSinceLastTap = now - lastTapRef.current;
        if (timeSinceLastTap < SINGLE_TAP_DELAY) {
          if (singleTapTimeoutRef.current) {
            clearTimeout(singleTapTimeoutRef.current);
            singleTapTimeoutRef.current = null;
          }
          doLike();
        } else {
          lastTapRef.current = now;
          singleTapTimeoutRef.current = setTimeout(() => {
            togglePlayPause();
          }, SINGLE_TAP_DELAY);
        }
      },
      [togglePlayPause, doLike]
    );

    const handleVolumeClick = useCallback(
      (e) => {
        e.stopPropagation();
        // Toggle the global muted state.
        setGlobalMuted((prev) => !prev);
        setShowVolumeIcon(true);
        setTimeout(() => setShowVolumeIcon(false), 1000);
      },
      [setGlobalMuted]
    );

    return (
      <ReelItem ref={ref} isMobile={isMobile} bottomNavHeight={bottomNavHeight}>
        <VideoCard onClick={handleVideoClick}>
          {isVideoLoading && (
            <Skeleton
              variant="rectangular"
              width="100%"
              height="100%"
              animation="wave"
              sx={{ borderRadius: 0 }}
            />
          )}
          <video
            ref={videoRef}
            src={
              video.videoUrl ||
              'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'
            }
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              display: isVideoLoading ? 'none' : 'block',
            }}
            onLoadedData={handleVideoLoadedData}
            onError={handleVideoError}
            controls={false}
            loop
            playsInline
            preload="metadata"
          />

          <BottomGradientOverlay />

          {/* Play/Pause icon animation overlay */}
          <AnimatePresence>
            {showPlayPauseIcon && (
              <motion.div
                initial={{ opacity: 1 }}
                animate={{ opacity: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.8 }}
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  zIndex: 9,
                }}
              >
                {playPauseIcon === 'play' ? (
                  <PlayArrowIcon sx={{ color: '#fff', fontSize: 80 }} />
                ) : (
                  <PauseIcon sx={{ color: '#fff', fontSize: 80 }} />
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Progress Bar (seek) */}
          <ProgressBarContainer
            onClick={handleSeek}
            onTouchStart={handleSeek}
            onTouchMove={handleSeek}
          >
            <ProgressBar progress={videoProgress} />
          </ProgressBarContainer>

          <RightSideControls>
            <IconButtonWrapper
              onClick={(e) => {
                e.stopPropagation();
                doLike();
              }}
              whileTap={{ scale: 1.2 }}
              transition={{ type: 'spring', stiffness: 300 }}
            >
              <FavoriteIcon
                sx={{
                  color: isLiked ? '#ff1744' : '#fff',
                  fontSize: 32,
                  textShadow: '1px 1px 2px rgba(0,0,0,0.7)',
                }}
              />
              <IconCountText>{likeCount}</IconCountText>
            </IconButtonWrapper>

            <IconButtonWrapper
              onClick={handleVolumeClick}
              whileTap={{ scale: 1.2 }}
              transition={{ type: 'spring', stiffness: 300 }}
            >
              {globalMuted ? (
                <VolumeOffIcon
                  sx={{
                    color: '#fff',
                    fontSize: 30,
                    textShadow: '1px 1px 2px rgba(0,0,0,0.7)',
                  }}
                />
              ) : (
                <VolumeUpIcon
                  sx={{
                    color: '#fff',
                    fontSize: 30,
                    textShadow: '1px 1px 2px rgba(0,0,0,0.7)',
                  }}
                />
              )}
            </IconButtonWrapper>
          </RightSideControls>

          <VideoTextInfo>
            <Typography
              variant="h6"
              sx={{
                color: '#fff',
                fontWeight: 'bold',
                textShadow: '1px 1px 2px rgba(0,0,0,0.7)',
              }}
            >
              {video.title}
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: '#fff',
                textShadow: '1px 1px 2px rgba(0,0,0,0.7)',
              }}
            >
              {video.description}
            </Typography>
          </VideoTextInfo>

          {showVolumeIcon && (
            <VolumeOverlay>
              {globalMuted ? MemoizedVolumeOffIcon : MemoizedVolumeUpIcon}
            </VolumeOverlay>
          )}

          <AnimatePresence>
            {showBigHeart && (
              <BigHeartOverlay
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 1.3, opacity: 0 }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
              >
                <FavoriteIcon sx={{ color: '#ff1744', fontSize: 100 }} />
              </BigHeartOverlay>
            )}
          </AnimatePresence>
        </VideoCard>
      </ReelItem>
    );
  }
);

// ------------------------------------------------------------------
// Main ReelsPage Component with Session Caching & Infinite Scroll
// ------------------------------------------------------------------
const ReelsPage = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [bottomNavHeight] = useState(56);
  // Global state: start with videos muted (for autoplay policy). Once unmuted, remain unmuted.
  const [globalMuted, setGlobalMuted] = useState(true);
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [nextPageToken, setNextPageToken] = useState(undefined);
  // Track the index of the currently fully visible video.
  const [currentIndex, setCurrentIndex] = useState(0);
  const observer = useRef();

  // On mount, load cached videos (if any) from session storage.
  useEffect(() => {
    const cachedVideos = sessionStorage.getItem('cachedVideos');
    if (cachedVideos) {
      setVideos(JSON.parse(cachedVideos));
    } else {
      fetchMoreVideos();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Cache the current video plus the next two videos.
  useEffect(() => {
    if (videos.length > 0) {
      const cacheRange = videos.slice(currentIndex, currentIndex + 3);
      sessionStorage.setItem('cachedVideos', JSON.stringify(cacheRange));
    }
  }, [videos, currentIndex]);

  // Fetch videos from Firebase Storage.
  const fetchMoreVideos = useCallback(() => {
    if (loading) return;
    setLoading(true);
    const storage = getStorage();
    const videosFolderRef = storageRef(storage, 'videos');
    const options = { maxResults: 5 };
    if (nextPageToken) {
      options.pageToken = nextPageToken;
    }
    list(videosFolderRef, options)
      .then((res) => {
        const videoPromises = res.items.map((item) =>
          getDownloadURL(item).then((url) => ({
            id: item.fullPath,
            videoUrl: url,
            title: item.name.replace(/\.[^/.]+$/, ''),
            description: '',
            likeCount: Math.floor(Math.random() * 1000),
          }))
        );
        Promise.all(videoPromises).then((newVideos) => {
          setVideos((prevVideos) => [...prevVideos, ...newVideos]);
          setNextPageToken(res.nextPageToken);
          if (!res.nextPageToken) {
            setHasMore(false);
          }
          setLoading(false);
        });
      })
      .catch((error) => {
        console.error('Error loading videos from Firebase Storage:', error);
        setLoading(false);
      });
  }, [loading, nextPageToken]);

  // Infinite scroll: observe the last video element.
  const lastVideoElementRef = useCallback(
    (node) => {
      if (loading) return;
      if (observer.current) observer.current.disconnect();
      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore) {
          fetchMoreVideos();
        }
      });
      if (node) observer.current.observe(node);
    },
    [loading, hasMore, fetchMoreVideos]
  );

  // Remove duplicate videos by ID.
  const uniqueVideos = [
    ...new Map(videos.map((video) => [video.id, video])).values(),
  ];

  return (
    <ReelsContainer isMobile={isMobile} bottomNavHeight={bottomNavHeight}>
      <ReelsWrapper isMobile={isMobile}>
        {uniqueVideos.map((video, index) => (
          <VideoReelItem
            key={video.id}
            video={video}
            index={index}
            isMobile={isMobile}
            bottomNavHeight={bottomNavHeight}
            onVisible={(i) => setCurrentIndex(i)}
            globalMuted={globalMuted}
            setGlobalMuted={setGlobalMuted}
            ref={uniqueVideos.length === index + 1 ? lastVideoElementRef : undefined}
          />
        ))}
        {loading && (
          <Skeleton
            variant="rectangular"
            width="100%"
            height={isMobile ? `calc(100vh - ${bottomNavHeight}px)` : 300}
            sx={{ borderRadius: 2, mb: 2 }}
          />
        )}
        {!hasMore && (
          <Box sx={{ textAlign: 'center', p: 2 }}>
            <Typography variant="body2" color="textSecondary">
              No more videos to display.
            </Typography>
          </Box>
        )}
      </ReelsWrapper>
    </ReelsContainer>
  );
};

export default ReelsPage;
