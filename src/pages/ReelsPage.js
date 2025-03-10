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
  Button,
} from '@mui/material';
import { styled } from '@mui/system';
import { motion, AnimatePresence } from 'framer-motion';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { alpha } from '@mui/material/styles';

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
  background: theme.palette.background.gradient,
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
    const [isVisible, setIsVisible] = useState(false);
    const [loadError, setLoadError] = useState(null);
    const retryCount = useRef(0);
    const maxRetries = 3;
    const loadTimeoutRef = useRef(null);

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

    // Reset states when video changes
    useEffect(() => {
      setLoadError(null);
      retryCount.current = 0;
      setIsVideoLoading(true);
      setManuallyPaused(false);
      
      if (loadTimeoutRef.current) {
        clearTimeout(loadTimeoutRef.current);
      }
      
      // Initialize video when URL is available
      if (video.videoUrl && videoRef.current) {
        videoRef.current.src = video.videoUrl;
        loadVideo();
      }
      
      return () => {
        if (loadTimeoutRef.current) {
          clearTimeout(loadTimeoutRef.current);
        }
        if (videoRef.current) {
          videoRef.current.pause();
          videoRef.current.src = '';
        }
      };
    }, [video.videoUrl]);

    const loadVideo = useCallback(async () => {
      if (!videoRef.current || !video.videoUrl) return;

      try {
        setIsVideoLoading(true);
        setLoadError(null);
        
        console.log('Starting to load video:', video.title);
        
        // Set a timeout for video loading
        const loadPromise = new Promise((resolve, reject) => {
          loadTimeoutRef.current = setTimeout(() => {
            reject(new Error('Video loading timeout'));
          }, 15000); // 15 second timeout

          const handleCanPlay = () => {
            console.log('Video can play:', video.title);
            clearTimeout(loadTimeoutRef.current);
            resolve();
          };

          const handleError = (e) => {
            console.error('Video error event:', e);
            clearTimeout(loadTimeoutRef.current);
            reject(e);
          };

          videoRef.current.addEventListener('canplay', handleCanPlay, { once: true });
          videoRef.current.addEventListener('error', handleError, { once: true });
          
          // Force video to load
          videoRef.current.load();
        });

        await loadPromise;
        setIsVideoLoading(false);
        console.log('Video loaded successfully:', video.title);
        
        if (isVisible && !manuallyPaused) {
          console.log('Attempting to play video:', video.title);
          try {
            const playPromise = videoRef.current.play();
            if (playPromise !== undefined) {
              playPromise.catch(error => {
                console.warn('Auto-play failed:', error);
                // If autoplay fails, don't mark as error, just log it
                if (error.name === 'NotAllowedError') {
                  console.log('Autoplay not allowed, waiting for user interaction');
                }
              });
            }
          } catch (playError) {
            console.warn('Play attempt failed:', playError);
          }
        }
      } catch (error) {
        console.error('Error loading video:', error);
        setLoadError(error.message);
        
        if (retryCount.current < maxRetries) {
          retryCount.current += 1;
          console.log(`Retrying video load (${retryCount.current}/${maxRetries})`);
          setTimeout(() => loadVideo(), 2000 * Math.pow(2, retryCount.current - 1));
        } else {
          setIsVideoLoading(false);
          setLoadError('Failed to load video after multiple attempts. Please try again.');
        }
      }
    }, [video.videoUrl, video.title, isVisible, manuallyPaused]);

    // Improved Intersection Observer setup
    useEffect(() => {
      if (!videoRef.current) return;

      const options = {
        threshold: [0.5], // Simplified threshold
        rootMargin: '0px'
      };

      const handleIntersection = async (entries) => {
        const entry = entries[0];
        const wasVisible = isVisible;
        const newIsVisible = entry.isIntersecting;
        
        console.log('Intersection change:', {
          video: video.title,
          wasVisible,
          newIsVisible,
          intersectionRatio: entry.intersectionRatio
        });
        
        setIsVisible(newIsVisible);

        if (!videoRef.current) return;

        try {
          if (newIsVisible && !wasVisible && !manuallyPaused) {
            console.log('Video becoming visible, attempting to play:', video.title);
            const playPromise = videoRef.current.play();
            if (playPromise !== undefined) {
              playPromise.catch(error => {
                console.warn('Play attempt failed:', error);
                if (error.name === 'NotAllowedError') {
                  console.log('Autoplay not allowed, waiting for user interaction');
                }
              });
            }
            if (onVisible) onVisible(index);
          } else if (!newIsVisible && wasVisible) {
            console.log('Video becoming hidden, pausing:', video.title);
            videoRef.current.pause();
          }
        } catch (error) {
          console.error('Playback error:', error);
          if (!error.name.includes('NotAllowed')) {
            loadVideo();
          }
        }
      };

      const observer = new IntersectionObserver(handleIntersection, options);
      observer.observe(videoRef.current);

      return () => observer.disconnect();
    }, [video.title, index, manuallyPaused, onVisible, loadVideo, isVisible]);

    const handleVideoLoadedData = useCallback(() => {
      console.log('Video loaded:', video.title);
      setIsVideoLoading(false);
      // Attempt to play if video is visible and not manually paused
      if (isVisible && !manuallyPaused && videoRef.current) {
        videoRef.current.play().catch(console.error);
      }
    }, [isVisible, manuallyPaused, video.title]);

    const handleVideoError = useCallback((error) => {
      console.error('Error loading video:', video.videoUrl, error);
      setIsVideoLoading(false);
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
          {loadError && (
            <Box
              sx={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                textAlign: 'center',
                color: 'error.main',
                bgcolor: 'background.paper',
                p: 2,
                borderRadius: 1,
                zIndex: 2
              }}
            >
              <Typography variant="body1" gutterBottom>
                {loadError}
              </Typography>
              <Button
                variant="contained"
                color="primary"
                onClick={() => {
                  retryCount.current = 0;
                  loadVideo();
                }}
                sx={{ mt: 1 }}
              >
                Retry Loading
              </Button>
            </Box>
          )}
          <video
            ref={videoRef}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              backgroundColor: '#000',
              display: isVideoLoading || loadError ? 'none' : 'block',
            }}
            playsInline
            loop
            muted={globalMuted}
            preload="auto"
            poster={video.thumbnailUrl}
            crossOrigin="anonymous"
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
  const [globalMuted, setGlobalMuted] = useState(true);
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [nextPageToken, setNextPageToken] = useState(undefined);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userOccupation, setUserOccupation] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState(null);
  const observer = useRef();

  // Check authentication state
  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsAuthenticated(!!user);
      if (user) {
        fetchUserOccupation(user.uid);
      }
    });

    return () => unsubscribe();
  }, []);

  // Separate function to fetch user occupation
  const fetchUserOccupation = async (userId) => {
    try {
      console.log('Fetching user occupation for userId:', userId);
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        console.log('User data fetched:', userData);
        const occupation = userData.occupation || 'general';
        console.log('Setting user occupation to:', occupation);
        setUserOccupation(occupation);
      } else {
        console.log('User document does not exist, defaulting to general');
        setUserOccupation('general');
      }
    } catch (error) {
      console.error('Error fetching user occupation:', error);
      setUserOccupation('general');
    }
  };

  // Add a function to get the correct video folder based on occupation
  const getVideoFolder = (occupation) => {
    // Map multiple occupations to the same folder
    switch(occupation?.toLowerCase()) {
      case 'freelancer':
      case 'employed':
      case 'self-employed':
        return 'freelancer, self employed';
      case 'business-owner':
        return 'business';
      case 'student':
        return 'students';
      case 'retired':
        return 'retired';
      case 'unemployed':
        return 'unemployed';
      default:
        return 'general';
    }
  };

  // Modified fetchMoreVideos with better error handling and retries
  const fetchMoreVideos = useCallback(async () => {
    if (loading || !isAuthenticated) {
      console.log('Fetch conditions not met:', { loading, isAuthenticated });
      return;
    }

    if (!userOccupation) {
      console.log('No user occupation set, defaulting to general');
      setUserOccupation('general');
      return;
    }

    setLoading(true);
    setError(null);

    const storage = getStorage();
    const folderPath = getVideoFolder(userOccupation);
    console.log('Fetching videos from folder:', folderPath);

    try {
      const videosFolderRef = storageRef(storage, `videos/${folderPath}`);
      const options = { maxResults: 5 };
      if (nextPageToken) {
        options.pageToken = nextPageToken;
      }

      let listResult = await list(videosFolderRef, options);
      console.log('Initial list result:', { 
        folderPath, 
        itemCount: listResult.items.length,
        items: listResult.items.map(item => item.name)
      });

      if (listResult.items.length === 0 && folderPath !== 'general') {
        console.log('No videos in occupation folder, trying general folder');
        const generalFolderRef = storageRef(storage, 'videos/general');
        listResult = await list(generalFolderRef, options);
      }

      const newVideos = await Promise.all(
        listResult.items.map(async (item) => {
          try {
            console.log('Getting download URL for:', item.name);
            const url = await getDownloadURL(item);
            
            // Instead of testing with fetch, create video URL with no-cors mode
            const videoUrl = new URL(url);
            videoUrl.searchParams.append('alt', 'media');
            
            return {
              id: item.fullPath,
              videoUrl: videoUrl.toString(),
              title: item.name.replace(/\.[^/.]+$/, '').replace(/%20/g, ' '),
              description: '',
              likeCount: Math.floor(Math.random() * 1000),
            };
          } catch (error) {
            console.error('Error processing video:', item.name, error);
            return null;
          }
        })
      );

      // Filter out any failed video loads
      const validVideos = newVideos.filter(video => video !== null);
      console.log('Valid videos processed:', validVideos.length);
      
      if (validVideos.length === 0) {
        console.log('No valid videos found');
        setError('No videos available at this time. Please try again later.');
        setHasMore(false);
      } else {
        setVideos(prev => {
          const updatedVideos = [...prev, ...validVideos];
          return updatedVideos;
        });
        setNextPageToken(listResult.nextPageToken);
        setHasMore(!!listResult.nextPageToken);
      }
    } catch (error) {
      console.error('Error fetching videos:', error);
      setError('Failed to load videos. Please try refreshing the page.');
      if (error.code === 'storage/object-not-found' && folderPath !== 'general') {
        console.log('Folder not found, falling back to general folder');
        setUserOccupation('general');
      }
    } finally {
      setLoading(false);
    }
  }, [loading, nextPageToken, userOccupation, isAuthenticated]);

  // Fetch videos when occupation is set or changed
  useEffect(() => {
    let isMounted = true;

    const initFetch = async () => {
      if (userOccupation && isAuthenticated && isMounted) {
        console.log('Initiating video fetch for occupation:', userOccupation);
        setVideos([]);
        setNextPageToken(undefined);
        setHasMore(true);
        await fetchMoreVideos();
      }
    };

    initFetch();

    return () => {
      isMounted = false;
    };
  }, [userOccupation, isAuthenticated]); // Remove fetchMoreVideos from dependency array

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
        {error && (
          <Box sx={{ 
            p: 2, 
            textAlign: 'center',
            color: 'error.main',
            bgcolor: 'background.paper',
            borderRadius: 1,
            m: 2
          }}>
            <Typography>{error}</Typography>
          </Box>
        )}
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
        {!hasMore && !loading && videos.length > 0 && (
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
