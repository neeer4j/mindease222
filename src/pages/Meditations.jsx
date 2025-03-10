// src/pages/Meditations.jsx
import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Container,
  Typography,
  Button,
  Grid,
  Box,
  useTheme,
  useMediaQuery,
  Card,
  CardContent,
  CardActions,
  IconButton,
  Slider,
  Tooltip,
  Avatar,
  TextField,
  InputAdornment,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PlayArrow as PlayArrowIcon,
  Pause as PauseIcon,
  Stop as StopIcon,
  VolumeUp as VolumeUpIcon,
  VolumeOff as VolumeOffIcon,
  LibraryMusic as LibraryMusicIcon,
  Search as SearchIcon,
  Clear as ClearIcon,
  KeyboardArrowUp as KeyboardArrowUpIcon,
} from '@mui/icons-material';
import { styled } from '@mui/system';
import PageLayout from '../components/PageLayout';
import MeditationSplash from '../components/MeditationSplash';
import SplashScreenToggle from '../components/SplashScreenToggle';
import { alpha } from '@mui/material/styles';
import { Fade } from '@mui/material';

// Add keyframes at the top of the file after imports
const gradientKeyframes = `
@keyframes gradient {
  0% { background-position: 0% center }
  50% { background-position: -100% center }
  100% { background-position: 0% center }
}`;

// Create and inject the style element
const styleElement = document.createElement('style');
styleElement.textContent = gradientKeyframes;
document.head.appendChild(styleElement);

// ----------------------
// Styled Components
// ----------------------

const GradientButton = styled(Button)(({ theme }) => ({
  background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${alpha(theme.palette.primary.light, 0.9)} 100%)`,
  color: theme.palette.primary.contrastText,
  borderRadius: '20px',
  padding: '14px 28px',
  boxShadow: `0 4px 15px ${alpha(theme.palette.primary.main, 0.25)}`,
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  '&:hover': {
    background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`,
    boxShadow: `0 8px 25px ${alpha(theme.palette.primary.main, 0.35)}`,
    transform: 'translateY(-2px)',
  },
  '&:active': {
    transform: 'translateY(1px)',
  },
}));

const MeditationCard = styled(Card)(({ theme, isPlaying }) => ({
  background: theme.palette.mode === 'dark'
    ? `linear-gradient(165deg, ${alpha(theme.palette.primary.dark, 0.15)} 0%, ${alpha(theme.palette.background.paper, 0.95)} 100%)`
    : `linear-gradient(165deg, ${alpha(theme.palette.primary.light, 0.1)} 0%, ${alpha(theme.palette.background.paper, 0.95)} 100%)`,
  backdropFilter: 'blur(10px)',
  borderRadius: '30px',
  boxShadow: isPlaying
    ? `0 15px 35px ${alpha(theme.palette.primary.main, 0.2)}`
    : `0 8px 20px ${alpha(theme.palette.primary.main, 0.1)}`,
  overflow: 'hidden',
  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'flex-start',
  padding: theme.spacing(3),
  border: isPlaying
    ? `2px solid ${alpha(theme.palette.primary.main, 0.8)}`
    : `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
  '&:hover': {
    transform: 'translateY(-8px) scale(1.02)',
    boxShadow: `0 20px 40px ${alpha(theme.palette.primary.main, 0.25)}`,
    border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`,
  },
}));

// Custom Slider styling with a wavy track using an SVG background
const wavySliderSx = {
  height: 8,
  '& .MuiSlider-track': {
    border: 'none',
    background:
      'url("data:image/svg+xml,%3Csvg width=\'200\' height=\'8\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M0 4 Q20 0,40 4 T80 4 T120 4 T160 4 T200 4 L200 8 L0 8 Z\' fill=\'%231976d2\'/%3E%3C/svg%3E")',
    backgroundSize: 'cover',
  },
  '& .MuiSlider-rail': {
    opacity: 0.2,
    height: 8,
  },
  '& .MuiSlider-thumb': {
    width: 24,
    height: 24,
    '&:hover, &.Mui-focusVisible': {
      boxShadow: '0 0 0 8px rgba(25, 118, 210, 0.16)',
    },
  },
};

// Update PlayerContainer styling for smoother transitions
const PlayerContainer = styled(Box)(({ theme, show }) => ({
  position: 'fixed',
  bottom: theme.spacing(8),
  left: '50%',
  transform: show ? 'translate(-50%, 0)' : 'translate(-50%, 100%)',
  width: 'calc(100% - ${theme.spacing(4)})',
  maxWidth: '1168px',
  background: theme.palette.mode === 'light'
    ? `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.95)} 0%, ${alpha(theme.palette.background.paper, 0.98)} 100%)`
    : `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.9)} 0%, ${alpha(theme.palette.background.paper, 0.95)} 100%)`,
  backdropFilter: 'blur(20px)',
  padding: theme.spacing(3),
  display: show ? 'block' : 'none',
  borderRadius: '24px',
  border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
  boxShadow: `0 -4px 30px ${alpha(theme.palette.primary.main, 0.15)}`,
  zIndex: 1000,
  [theme.breakpoints.down('sm')]: {
    width: 'calc(100% - ${theme.spacing(2)})',
    padding: theme.spacing(2),
    borderRadius: '20px',
    bottom: theme.spacing(7),
  }
}));

const ProgressSlider = styled(Slider)(({ theme }) => ({
  height: 4,
  padding: 0,
  '& .MuiSlider-thumb': {
    width: 12,
    height: 12,
    transition: 'none',
    '&:hover, &.Mui-focusVisible': {
      boxShadow: `0 0 0 8px ${alpha(theme.palette.primary.main, 0.16)}`,
    },
    '&.Mui-active': {
      width: 16,
      height: 16,
    },
  },
  '& .MuiSlider-rail, & .MuiSlider-track': {
    background: `linear-gradient(to right, ${theme.palette.primary.main}, ${theme.palette.primary.light})`,
    border: 'none',
    borderRadius: 2,
  }
}));

// Update ToggleButton styling
const ToggleButton = styled(IconButton)(({ theme, isVisible }) => ({
  position: 'absolute',
  top: -18,
  left: '50%',
  transform: `translate(-50%, 0) rotate(${isVisible ? 180 : 0}deg)`,
  background: theme.palette.mode === 'light'
    ? `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.9)} 0%, ${alpha(theme.palette.primary.light, 0.9)} 100%)`
    : `linear-gradient(135deg, ${alpha(theme.palette.primary.dark, 0.9)} 0%, ${alpha(theme.palette.primary.main, 0.9)} 100%)`,
  color: 'white',
  width: 36,
  height: 36,
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  '&:hover': {
    background: theme.palette.mode === 'light'
      ? `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.light} 100%)`
      : `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${alpha(theme.palette.primary.main, 0.9)} 100%)`,
    transform: `translate(-50%, 0) rotate(${isVisible ? 180 : 0}deg) scale(1.1)`,
  },
  boxShadow: theme.shadows[3],
  [theme.breakpoints.down('sm')]: {
    width: 32,
    height: 32,
    top: -16
  }
}));

// ----------------------
// Sample Meditation Data
// ----------------------
const meditationsData = [
  {
    id: 1,
    title: 'Morning Calm Meditation',
    description: 'Start your day with a peaceful meditation to center yourself and cultivate inner peace.',
    duration: '10:00',
    audioSrc: '/audio/morning-calm.mp3',
    image: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
    category: 'Morning',
    keywords: ['calm', 'morning', 'focus', 'positive'],
  },
  {
    id: 2,
    title: 'Deep Sleep Relaxation',
    description: 'Drift into a peaceful slumber with this calming guided meditation for deep, restorative sleep.',
    duration: '15:00',
    audioSrc: '/audio/deep-sleep.mp3',
    image: 'https://images.unsplash.com/photo-1511295742362-92c96b1cf484?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
    category: 'Sleep',
    keywords: ['sleep', 'relax', 'night', 'restful'],
  },
  {
    id: 3,
    title: 'Stress Relief Breathwork',
    description: 'Release tension and find calm through guided breathing exercises designed to reduce anxiety.',
    duration: '05:00',
    audioSrc: '/audio/stress-relief.mp3',
    image: 'https://images.unsplash.com/photo-1528715471579-d1bcf0ba5e83?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
    category: 'Stress Relief',
    keywords: ['stress', 'anxiety', 'breath', 'relief'],
  },
  {
    id: 4,
    title: 'Gratitude Meditation',
    description: 'Open your heart and mind to abundance through this uplifting gratitude practice.',
    duration: '08:00',
    audioSrc: '/audio/gratitude.mp3',
    image: 'https://images.unsplash.com/photo-1518241353330-0f7941c2d9b5?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
    category: 'Gratitude',
    keywords: ['gratitude', 'positive', 'well-being', 'thankful'],
  },
  {
    id: 5,
    title: 'Focus and Concentration',
    description: 'Sharpen your mind and enhance your focus with this mindfulness-based concentration practice.',
    duration: '12:00',
    audioSrc: '/audio/focus-concentration.mp3',
    image: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
    category: 'Focus',
    keywords: ['focus', 'concentration', 'attention', 'mindfulness'],
  },
  {
    id: 6,
    title: 'Body Scan Meditation',
    description: 'Journey through your body with this deeply relaxing guided meditation for complete relaxation.',
    duration: '20:00',
    audioSrc: '/audio/body-scan.mp3',
    image: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
    category: 'Relaxation',
    keywords: ['body scan', 'relaxation', 'awareness', 'mind-body'],
  },
];

// ----------------------
// Main Component
// ----------------------
const Meditations = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const allMeditations = useMemo(() => meditationsData, []);
  const [currentMeditation, setCurrentMeditation] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.7);
  const [isMuted, setIsMuted] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [actualDurations, setActualDurations] = useState({});
  const [showSplash, setShowSplash] = useState(() => {
    const hasSeenTutorial = localStorage.getItem('meditationsTutorialSeen');
    return !hasSeenTutorial;
  });
  const [isPlayerVisible, setIsPlayerVisible] = useState(true);

  const audioRef = useRef(null);
  const playerRef = useRef(null);

  // Define handleTimeUpdate before it's used
  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  // Time update effect for smoother updates
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.addEventListener('timeupdate', handleTimeUpdate);
    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
    };
  }, []);

  // Preload audio metadata for each meditation to get actual durations
  useEffect(() => {
    allMeditations.forEach((meditation) => {
      const audio = new Audio(meditation.audioSrc);
      audio.addEventListener('loadedmetadata', () => {
        setActualDurations((prev) => ({
          ...prev,
          [meditation.id]: audio.duration,
        }));
      });
    });
  }, [allMeditations]);

  // Cleanup effect for audio
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
        audioRef.current.load();
      }
    };
  }, []);

  // Update audio playback effect to be more stable
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const playAudio = async () => {
      if (isPlaying) {
        try {
          // Ensure audio is ready before playing
          if (audio.readyState >= 2) {
            await audio.play();
          } else {
            await new Promise((resolve) => {
              audio.addEventListener('canplay', resolve, { once: true });
            });
            await audio.play();
          }
        } catch (error) {
          console.error("Playback failed:", error);
          setIsPlaying(false);
        }
      } else {
        audio.pause();
      }
    };

    playAudio();

    // Cleanup function
    return () => {
      if (audio) {
        audio.pause();
      }
    };
  }, [isPlaying]);

  // Audio volume/mute effect
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
      audioRef.current.muted = isMuted;
    }
  }, [volume, isMuted]);

  // Scroll helper: scrolls to the player with an offset for fixed headers
  const scrollToPlayer = () => {
    const headerOffset = 70; // Adjust this value to your header height
    if (playerRef.current) {
      const elementPosition = playerRef.current.getBoundingClientRect().top + window.pageYOffset;
      window.scrollTo({ top: elementPosition - headerOffset, behavior: 'smooth' });
    }
  };

  // When clicking on a card (outside play button), scroll to player and load meditation (but don't auto-play)
  const handleCardClick = (meditation) => {
    scrollToPlayer();
    if (!currentMeditation || currentMeditation.id !== meditation.id) {
      setCurrentMeditation(meditation);
      setIsPlaying(false);
      setCurrentTime(0);
      if (audioRef.current) {
        audioRef.current.src = meditation.audioSrc;
        audioRef.current.load();
      }
    }
  };

  // Toggle play/pause and scroll to player if needed
  const handlePlayPauseToggle = async (meditation) => {
    scrollToPlayer();
    
    // If clicking the same meditation that's currently playing
    if (currentMeditation && currentMeditation.id === meditation.id) {
      setIsPlaying((prev) => !prev);
      return;
    }

    // If there's a current audio playing, stop it first
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }

    // Set up the new meditation
    setCurrentMeditation(meditation);
    setIsPlaying(true);
    setCurrentTime(0);

    // Load and play the new audio
    if (audioRef.current) {
      try {
        audioRef.current.src = meditation.audioSrc;
        await audioRef.current.load();
        await audioRef.current.play();
      } catch (error) {
        console.error("Playback failed:", error);
        setIsPlaying(false);
      }
    }
  };

  const handleStop = () => {
    setIsPlaying(false);
    setCurrentTime(0);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setCurrentMeditation(null);
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  // Update handleSeek to be more stable
  const handleSeek = (event, newValue) => {
    if (!audioRef.current) return;
    const audio = audioRef.current;
    
    // Pause updates while seeking
    const wasPlaying = !audio.paused;
    if (wasPlaying) {
      audio.pause();
    }
    
    audio.currentTime = newValue;
    setCurrentTime(newValue);
    
    if (wasPlaying) {
      audio.play().catch(error => console.error("Playback failed:", error));
    }
  };

  const handleVolumeChange = (event, newValue) => {
    setVolume(newValue);
  };

  const handleMuteToggle = () => {
    setIsMuted((prev) => !prev);
  };

  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  // Filtering and search logic
  const filteredMeditations = useMemo(() => {
    let filtered = allMeditations;
    if (selectedCategory !== 'All') {
      filtered = filtered.filter((meditation) => meditation.category === selectedCategory);
    }
    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (meditation) =>
          meditation.title.toLowerCase().includes(lowerQuery) ||
          meditation.description.toLowerCase().includes(lowerQuery) ||
          meditation.keywords.some((keyword) => keyword.toLowerCase().includes(lowerQuery))
      );
    }
    return filtered;
  }, [allMeditations, selectedCategory, searchQuery]);

  const availableCategories = useMemo(() => {
    const categories = ['All'];
    allMeditations.forEach((meditation) => {
      if (!categories.includes(meditation.category)) {
        categories.push(meditation.category);
      }
    });
    return categories;
  }, [allMeditations]);

  // ----------------------
  // Styling for Paper with Faded Top Edge
  // ----------------------
  const paperSx = {
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    background: 'linear-gradient(to top, rgba(0, 0, 0, 1) 0%, rgba(0, 0, 0, 0.7) 100%)',
    boxShadow: 'none',
    border: 'none',
    borderTopLeftRadius: '24px',
    borderTopRightRadius: '24px',
    overflow: 'hidden',
    // Pseudo-element for smooth faded top border
    '&::before': {
      content: '""',
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: '20px',
      background: 'linear-gradient(to bottom, rgba(0, 0, 0, 0.5), transparent)',
      pointerEvents: 'none',
    },
  };

  // ----------------------
  // Styling for the drop-up menu
  // ----------------------
  const menuSx = {
    '& .MuiMenuItem-root': {
      fontSize: { xs: '0.75rem', sm: '0.875rem' },
      paddingY: 1,
      paddingX: 2,
    },
  };

  const menuPaperProps = {
    sx: {
      backgroundColor: 'rgba(0, 0, 0, 0.85)',
      borderRadius: '24px',
      boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.15)',
      backdropFilter: 'blur(10px)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      overflow: 'visible',
      mt: 1,
    },
  };

  const handleTutorialComplete = () => {
    localStorage.setItem('meditationsTutorialSeen', 'true');
    setShowSplash(false);
  };

  const handleShowSplash = () => {
    setShowSplash(true);
  };

  const togglePlayer = () => {
    setIsPlayerVisible(prev => !prev);
  };

  // Add Player component
  const Player = ({ meditation, isPlaying, onPlayPause, onStop, currentTime, duration, onSeek, volume, onVolumeChange, onMuteToggle, isMuted }) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    return (
      <PlayerContainer show={!!meditation} ref={playerRef}>
        <Box>
          <Grid container spacing={2} alignItems="center">
            {/* Title and Controls */}
            <Grid item xs={12} sm={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar
                  src={meditation?.image}
                  variant="rounded"
                  sx={{
                    width: isMobile ? 40 : 50,
                    height: isMobile ? 40 : 50,
                    borderRadius: '12px',
                    boxShadow: theme.shadows[4]
                  }}
                />
                <Box>
                  <Typography variant={isMobile ? "body1" : "h6"} sx={{ fontWeight: 600 }}>
                    {meditation?.title}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {meditation?.duration}
                  </Typography>
                </Box>
              </Box>
            </Grid>

            {/* Playback Controls */}
            <Grid item xs={12} sm={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
                <IconButton onClick={onStop} size={isMobile ? "small" : "medium"}>
                  <StopIcon />
                </IconButton>
                <IconButton 
                  onClick={onPlayPause}
                  sx={{
                    bgcolor: 'primary.main',
                    color: 'white',
                    '&:hover': { bgcolor: 'primary.dark' },
                    width: isMobile ? 40 : 48,
                    height: isMobile ? 40 : 48,
                  }}
                >
                  {isPlaying ? <PauseIcon /> : <PlayArrowIcon />}
                </IconButton>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 120 }}>
                  <IconButton onClick={onMuteToggle} size={isMobile ? "small" : "medium"}>
                    {isMuted ? <VolumeOffIcon /> : <VolumeUpIcon />}
                  </IconButton>
                  <Slider
                    size="small"
                    value={volume}
                    onChange={onVolumeChange}
                    min={0}
                    max={1}
                    step={0.1}
                    sx={{ width: 80 }}
                  />
                </Box>
              </Box>
            </Grid>

            {/* Progress Bar */}
            <Grid item xs={12}>
              <Box sx={{ px: isMobile ? 1 : 2 }}>
                <ProgressSlider
                  value={currentTime}
                  onChange={onSeek}
                  min={0}
                  max={duration}
                  step={1}
                />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                  <Typography variant="caption" color="text.secondary">
                    {formatTime(currentTime)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {formatTime(duration)}
                  </Typography>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </Box>
      </PlayerContainer>
    );
  };

  return (
    <PageLayout>
      {showSplash && <MeditationSplash onComplete={handleTutorialComplete} />}
      <Box 
        sx={{ 
          maxWidth: '1200px', 
          margin: '0 auto',
          width: '100%',
          paddingX: { xs: 1, sm: 2, md: 3 },
          paddingBottom: { xs: 10, sm: 12 },
          overflow: 'hidden', // Add this to prevent horizontal scroll
          position: 'relative'
        }}
      >
        {/* Hero Section */}
        <Box 
          sx={{
            textAlign: 'center',
            position: 'relative',
            mb: { xs: 4, md: 6 },
            mt: { xs: 2, md: 4 },
            width: '100%', // Add this to ensure proper width
            '&::after': {
              content: '""',
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '100%', // Change from 200% to 100%
              height: '100%', // Change from 200% to 100%
              background: `radial-gradient(circle, ${alpha(theme.palette.primary.main, 0.1)} 0%, transparent 70%)`,
              zIndex: 0,
              pointerEvents: 'none' // Add this to prevent interaction issues
            }
          }}
        >
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.7 }}
          >
            <Typography
              variant={isMobile ? 'h3' : 'h2'}
              component="h1"
              sx={{
                fontWeight: 800,
                color: theme.palette.text.primary,
                mb: 2,
                position: 'relative',
                zIndex: 1,
                textShadow: `0 2px 4px ${alpha(theme.palette.primary.main, 0.2)}`,
                background: `linear-gradient(to right, ${theme.palette.text.primary} 0%, ${alpha(theme.palette.primary.main, 0.8)} 50%, ${theme.palette.text.primary} 100%)`,
                backgroundSize: '200% auto',
                animation: 'gradient 8s linear infinite',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Find Your Inner Peace
            </Typography>
            <Typography
              variant="h5"
              sx={{
                color: theme.palette.text.secondary,
                maxWidth: 800,
                mx: 'auto',
                mb: 4,
                position: 'relative',
                zIndex: 1,
                fontWeight: 400,
                px: 2,
              }}
            >
              Discover a collection of guided meditations designed to bring balance and tranquility to your daily life
            </Typography>
          </motion.div>

          {/* Search and Filter Section */}
          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              gap: 2,
              justifyContent: 'center',
              alignItems: 'center',
              maxWidth: 800,
              mx: 'auto',
              p: 3,
              borderRadius: '20px',
              background: alpha(theme.palette.background.paper, 0.8),
              backdropFilter: 'blur(10px)',
              boxShadow: `0 8px 32px ${alpha(theme.palette.primary.main, 0.1)}`,
              position: 'relative',
              zIndex: 1,
              px: { xs: 2, sm: 3 },
            }}
          >
            <TextField
              fullWidth
              placeholder="Search meditations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              variant="outlined"
              InputProps={{
                startAdornment: <SearchIcon color="action" sx={{ mr: 1 }} />,
                endAdornment: searchQuery && (
                  <IconButton size="small" onClick={() => setSearchQuery('')}>
                    <ClearIcon />
                  </IconButton>
                ),
                sx: {
                  borderRadius: '15px',
                  backgroundColor: theme.palette.background.paper,
                  '&:hover': {
                    backgroundColor: theme.palette.background.paper,
                  },
                },
              }}
              sx={{ flex: 2 }}
            />
            <FormControl sx={{ minWidth: { xs: '100%', sm: 200 }, flex: { sm: 1 } }}>
              <Select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                displayEmpty
                sx={{
                  borderRadius: '15px',
                  backgroundColor: theme.palette.background.paper,
                }}
              >
                <MenuItem value="All">All Categories</MenuItem>
                {availableCategories.filter(cat => cat !== 'All').map((category) => (
                  <MenuItem key={category} value={category}>{category}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </Box>

        {/* Meditation Cards Grid */}
        <Grid 
          container 
          spacing={{ xs: 2, sm: 3, md: 4 }} 
          sx={{ 
            position: 'relative', 
            zIndex: 1,
            mt: { xs: 2, sm: 3 }
          }}
        >
          {filteredMeditations.map((meditation) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={meditation.id}>
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5, delay: meditation.id * 0.1 }}
                style={{ height: '100%' }}
              >
                <MeditationCard isPlaying={currentMeditation?.id === meditation.id && isPlaying}>
                  <Box sx={{ position: 'relative', mb: 3, height: { xs: 160, sm: 200 } }}>
                    <Avatar
                      alt={meditation.title}
                      src={meditation.image}
                      variant="rounded"
                      sx={{
                        width: '100%',
                        height: '100%',
                        borderRadius: '24px',
                        boxShadow: `0 8px 20px ${alpha(theme.palette.primary.main, 0.15)}`,
                      }}
                    />
                    <Box
                      sx={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        height: '50%',
                        background: 'linear-gradient(to top, rgba(0,0,0,0.4), transparent)',
                        borderRadius: '0 0 24px 24px',
                      }}
                    />
                    <Chip
                      label={meditation.category}
                      color="primary"
                      size={isMobile ? "small" : "medium"}
                      sx={{
                        position: 'absolute',
                        top: 16,
                        right: 16,
                        borderRadius: '12px',
                        fontWeight: 600,
                        backdropFilter: 'blur(4px)',
                      }}
                    />
                    <Chip
                      label={meditation.duration}
                      size={isMobile ? "small" : "medium"}
                      sx={{
                        position: 'absolute',
                        bottom: 16,
                        right: 16,
                        borderRadius: '12px',
                        fontWeight: 600,
                        backgroundColor: alpha(theme.palette.background.paper, 0.8),
                        backdropFilter: 'blur(4px)',
                      }}
                    />
                  </Box>

                  <Typography
                    variant={isMobile ? "subtitle1" : "h6"}
                    sx={{
                      fontWeight: 700,
                      mb: 2,
                      color: theme.palette.text.primary,
                      height: { xs: '48px', sm: '56px' },
                      overflow: 'hidden',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                    }}
                  >
                    {meditation.title}
                  </Typography>

                  <Typography
                    variant="body2"
                    sx={{
                      color: theme.palette.text.secondary,
                      mb: 3,
                      height: { xs: '72px', sm: '80px' },
                      overflow: 'hidden',
                      display: '-webkit-box',
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical',
                      fontSize: isMobile ? '0.875rem' : '0.95rem',
                    }}
                  >
                    {meditation.description}
                  </Typography>

                  <Box sx={{ mt: 'auto' }}>
                    <GradientButton
                      fullWidth
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePlayPauseToggle(meditation);
                      }}
                      startIcon={currentMeditation?.id === meditation.id && isPlaying ? <PauseIcon /> : <PlayArrowIcon />}
                      sx={{
                        py: { xs: 1.5, sm: 2 },
                        fontSize: { xs: '0.9rem', sm: '1rem' },
                      }}
                    >
                      {currentMeditation?.id === meditation.id && isPlaying ? 'Pause' : 'Play Now'}
                    </GradientButton>
                  </Box>
                </MeditationCard>
              </motion.div>
            </Grid>
          ))}
        </Grid>

        {filteredMeditations.length === 0 && (
          <Box
            sx={{
              textAlign: 'center',
              py: { xs: 6, sm: 8 },
              px: { xs: 2, sm: 3 },
              borderRadius: '20px',
              backgroundColor: alpha(theme.palette.background.paper, 0.6),
              backdropFilter: 'blur(10px)',
              mt: 4,
              mx: 2,
            }}
          >
            <Typography variant="h6" color="text.secondary">
              No meditations found matching your criteria.
            </Typography>
            <Typography variant="body1" color="text.secondary" mt={1}>
              Please adjust your search or filters to find more meditations.
            </Typography>
          </Box>
        )}

        {/* Audio Player */}
        <audio
          ref={audioRef}
          src={currentMeditation?.audioSrc}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={handleStop}
        />

        {/* Persistent Player - Only render when there's a current meditation */}
        {currentMeditation && (
          <Player
            meditation={currentMeditation}
            isPlaying={isPlaying}
            onPlayPause={() => setIsPlaying(!isPlaying)}
            onStop={handleStop}
            currentTime={currentTime}
            duration={duration}
            onSeek={handleSeek}
            volume={volume}
            onVolumeChange={handleVolumeChange}
            onMuteToggle={handleMuteToggle}
            isMuted={isMuted}
          />
        )}
      </Box>
      <SplashScreenToggle onShowSplash={handleShowSplash} />
    </PageLayout>
  );
};

export default Meditations;
