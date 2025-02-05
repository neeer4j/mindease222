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

import VolumeOffIcon from '@mui/icons-material/VolumeOff';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import FavoriteIcon from '@mui/icons-material/Favorite';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import ShareIcon from '@mui/icons-material/Share';

// Import Firebase Storage functions (ensure Firebase is configured)
import { getStorage, ref as storageRef, list, getDownloadURL } from 'firebase/storage';

// ------------------------------------------------------------------
// Styled Components & Scroll Snap Setup
// ------------------------------------------------------------------
const ReelsContainer = styled(Box)(({ theme, isMobile, bottomNavHeight }) => ({
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

const ReelsWrapper = styled(Box)(({ isMobile }) => ({
  width: isMobile ? '100%' : '600px',
  height: '100%',
  margin: isMobile ? 0 : '0 auto',
}));

// We require full visibility (threshold: 1) so that a video is considered active only when fully in view.
const ReelItem = styled(motion.div)(({ isMobile, bottomNavHeight }) => ({
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

const RightSideControls = styled(Box)(({ theme }) => ({
  position: 'absolute',
  right: 16,
  bottom: 100,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  zIndex: 3,
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

const ProfileBox = styled(Box)(({ theme, isMobile }) => ({
  position: 'absolute',
  bottom: 100,
  left: 16,
  zIndex: 4,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-start',
  gap: theme.spacing(1),
  ...(isMobile ? { bottom: 80 } : {}),
}));

const ProfileRow = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
}));

const ProfileAvatar = styled(Box)(({ theme }) => ({
  width: 48,
  height: 48,
  borderRadius: '50%',
  backgroundColor: theme.palette.grey[400],
  overflow: 'hidden',
  '& img': {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
}));

const FollowButton = styled(Button)(({ theme }) => ({
  color: '#fff',
  borderColor: '#fff',
  textTransform: 'none',
  fontWeight: 'bold',
  '&:hover': {
    borderColor: '#fff',
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
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

// ------------------------------------------------------------------
// VideoReelItem Component
// ------------------------------------------------------------------
// We add two new props: "index" and "onVisible". When the video is fully in view,
// onVisible(index) is called.
const VideoReelItem = forwardRef(({ video, isMobile, bottomNavHeight, index, onVisible }, ref) => {
  const videoRef = useRef(null);

  const [isVideoLoading, setIsVideoLoading] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [showBigHeart, setShowBigHeart] = useState(false);
  const [manuallyPaused, setManuallyPaused] = useState(false);
  const [showVolumeIcon, setShowVolumeIcon] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [likeCount, setLikeCount] = useState(video.likeCount || 120);
  const [commentCount] = useState(video.commentCount || 25);
  const [shareCount] = useState(video.shareCount || 10);

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

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = isMuted;
    }
  }, [isMuted]);

  // Intersection Observer: Auto play/pause only when fully visible.
  useEffect(() => {
    const handleIntersection = (entries) => {
      entries.forEach((entry) => {
        if (!videoRef.current) return;
        // When fully visible (intersectionRatio === 1), play and notify parent.
        if (!manuallyPaused && entry.intersectionRatio === 1) {
          videoRef.current.play().catch((error) => {
            console.error('Error playing video:', error);
          });
          if (onVisible) onVisible(index);
        } else {
          videoRef.current.pause();
        }
      });
    };

    const observer = new IntersectionObserver(handleIntersection, {
      threshold: 1,
    });

    if (videoRef.current) {
      observer.observe(videoRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, [manuallyPaused, onVisible, index]);

  const handleVideoLoadedData = useCallback(() => {
    setIsVideoLoading(false);
  }, []);

  const handleVideoError = useCallback(() => {
    setIsVideoLoading(false);
    console.error('Error loading video:', video.videoUrl);
  }, [video.videoUrl]);

  const togglePlayPause = useCallback(() => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play().catch(console.error);
      setManuallyPaused(false);
    } else {
      videoRef.current.pause();
      setManuallyPaused(true);
    }
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
      setIsMuted((prev) => !prev);
      setShowVolumeIcon(true);
      setTimeout(() => setShowVolumeIcon(false), 1000);
    },
    []
  );

  const handleCommentClick = useCallback(
    (e) => {
      e.stopPropagation();
      alert('Open comments…');
    },
    []
  );

  const handleShareClick = useCallback(
    (e) => {
      e.stopPropagation();
      alert('Share function triggered…');
    },
    []
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

        <ProfileBox isMobile={isMobile}>
          <ProfileRow>
            <ProfileAvatar>
              <img
                src="https://mui.com/static/images/avatar/2.jpg"
                alt="User Avatar"
              />
            </ProfileAvatar>
            <Box>
              <Typography
                variant="subtitle1"
                sx={{
                  color: '#fff',
                  fontWeight: 'bold',
                  textShadow: '1px 1px 2px rgba(0,0,0,0.7)',
                }}
              >
                @{video.username || 'Username'}
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  color: '#fff',
                  textShadow: '1px 1px 2px rgba(0,0,0,0.6)',
                }}
              >
                MindEase AI Therapist
              </Typography>
            </Box>
          </ProfileRow>
          <FollowButton variant="outlined" size="small">
            Follow
          </FollowButton>
        </ProfileBox>

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
            onClick={handleCommentClick}
            whileTap={{ scale: 1.2 }}
            transition={{ type: 'spring', stiffness: 300 }}
          >
            <ChatBubbleOutlineIcon
              sx={{
                color: '#fff',
                fontSize: 30,
                textShadow: '1px 1px 2px rgba(0,0,0,0.7)',
              }}
            />
            <IconCountText>{commentCount}</IconCountText>
          </IconButtonWrapper>

          <IconButtonWrapper
            onClick={handleShareClick}
            whileTap={{ scale: 1.2 }}
            transition={{ type: 'spring', stiffness: 300 }}
          >
            <ShareIcon
              sx={{
                color: '#fff',
                fontSize: 30,
                textShadow: '1px 1px 2px rgba(0,0,0,0.7)',
              }}
            />
            <IconCountText>{shareCount}</IconCountText>
          </IconButtonWrapper>

          <IconButtonWrapper
            onClick={handleVolumeClick}
            whileTap={{ scale: 1.2 }}
            transition={{ type: 'spring', stiffness: 300 }}
          >
            {isMuted ? (
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
            {isMuted ? MemoizedVolumeOffIcon : MemoizedVolumeUpIcon}
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
});

// ------------------------------------------------------------------
// Main ReelsPage Component with Selective Session Caching
// ------------------------------------------------------------------
const ReelsPage = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [bottomNavHeight, setBottomNavHeight] = useState(56);
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

  // Whenever videos or currentIndex changes, update the cache.
  // We cache the current video plus the next two (i.e. 3 videos total).
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
            description: 'A video loaded from Firebase Storage.',
            username: 'FirebaseUser',
            likeCount: Math.floor(Math.random() * 1000),
            commentCount: Math.floor(Math.random() * 100),
            shareCount: Math.floor(Math.random() * 50),
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

  // Filter out duplicates (if any) based on video.id.
  const uniqueVideos = [...new Map(videos.map((video) => [video.id, video])).values()];

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
