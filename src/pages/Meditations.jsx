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
} from '@mui/icons-material';
import { styled } from '@mui/system';
import PageLayout from '../components/PageLayout';

// ----------------------
// Styled Components
// ----------------------

const GradientButton = styled(Button)(({ theme }) => ({
  background: `linear-gradient(45deg, ${theme.palette.primary.light} 30%, ${theme.palette.primary.main} 90%)`,
  color: theme.palette.primary.contrastText,
  borderRadius: '12px',
  padding: '10px 22px',
  boxShadow: theme.shadows[4],
  transition: 'background 0.5s, box-shadow 0.3s, transform 0.3s',
  '&:hover': {
    background: `linear-gradient(45deg, ${theme.palette.primary.main} 30%, ${theme.palette.primary.dark} 90%)`,
    boxShadow: theme.shadows[6],
    transform: 'scale(1.03)',
  },
}));

const MeditationCard = styled(Card)(({ theme, isPlaying }) => ({
  background: theme.palette.background.paper,
  backdropFilter: 'blur(8px)',
  borderRadius: '28px',
  boxShadow: theme.shadows[3],
  overflow: 'hidden',
  transition: 'transform 0.3s ease, box-shadow 0.3s ease, backdropFilter 0.3s ease, border 0.3s ease',
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between',
  padding: theme.spacing(3),
  border: `1px solid ${theme.palette.divider}`,
  ...(isPlaying && {
    border: `2px solid ${theme.palette.primary.main}`,
    boxShadow: theme.shadows[7],
    transform: 'scale(1.02)',
    backdropFilter: 'none',
  }),
  '&:hover': {
    transform: 'translateY(-7px)',
    boxShadow: theme.shadows[7],
    backdropFilter: 'none',
    border: `1px solid ${theme.palette.primary.light}`,
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

// ----------------------
// Sample Meditation Data
// ----------------------
const meditationsData = [
  {
    id: 1,
    title: 'Morning Calm Meditation',
    description: 'Start your day with a peaceful meditation to center yourself.',
    duration: '10:00',
    audioSrc: '/audio/morning-calm.mp3',
    image: '/images/meditation-1.jpg',
    category: 'Morning',
    keywords: ['calm', 'morning', 'focus', 'positive'],
  },
  {
    id: 2,
    title: 'Deep Sleep Relaxation',
    description: 'Guided meditation for deep relaxation and restful sleep.',
    duration: '15:00',
    audioSrc: '/audio/deep-sleep.mp3',
    image: '/images/meditation-2.jpg',
    category: 'Sleep',
    keywords: ['sleep', 'relax', 'night', 'restful'],
  },
  {
    id: 3,
    title: 'Stress Relief Breathwork',
    description: 'Quick breathwork exercise to relieve stress and anxiety.',
    duration: '05:00',
    audioSrc: '/audio/stress-relief.mp3',
    image: '/images/meditation-3.jpg',
    category: 'Stress Relief',
    keywords: ['stress', 'anxiety', 'breath', 'relief'],
  },
  {
    id: 4,
    title: 'Gratitude Meditation',
    description: 'Cultivate gratitude and enhance positivity and well-being.',
    duration: '08:00',
    audioSrc: '/audio/gratitude.mp3',
    image: '/images/meditation-4.jpg',
    category: 'Gratitude',
    keywords: ['gratitude', 'positive', 'well-being', 'thankful'],
  },
  {
    id: 5,
    title: 'Focus and Concentration',
    description: 'Improve your focus and concentration with this guided session.',
    duration: '12:00',
    audioSrc: '/audio/focus-concentration.mp3',
    image: '/images/meditation-5.jpg',
    category: 'Focus',
    keywords: ['focus', 'concentration', 'attention', 'mindfulness'],
  },
  {
    id: 6,
    title: 'Body Scan Meditation',
    description: 'A gentle body scan to increase body awareness and relaxation.',
    duration: '20:00',
    audioSrc: '/audio/body-scan.mp3',
    image: '/images/meditation-6.jpg',
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

  const audioRef = useRef(null);
  const playerRef = useRef(null);

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

  // Audio playback effect
  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.play().catch((error) => console.error("Playback failed:", error));
      } else {
        audioRef.current.pause();
      }
    }
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
  const handlePlayPauseToggle = (meditation) => {
    scrollToPlayer();
    if (currentMeditation && currentMeditation.id === meditation.id) {
      setIsPlaying((prev) => !prev);
    } else {
      setCurrentMeditation(meditation);
      setIsPlaying(true);
      setCurrentTime(0);
      if (audioRef.current) {
        audioRef.current.src = meditation.audioSrc;
        audioRef.current.load();
        audioRef.current.play().catch((error) => console.error("Playback failed:", error));
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

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleSeek = (event, newValue) => {
    setCurrentTime(newValue);
    if (audioRef.current) {
      audioRef.current.currentTime = newValue;
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

  return (
    <PageLayout>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.8 }}
        style={{
          minHeight: '100vh',
          background: theme.palette.background.gradient || theme.palette.background.default,
          paddingTop: theme.spacing(8),
          paddingBottom: theme.spacing(14),
          color: theme.palette.text.primary,
        }}
      >
        <Container maxWidth="lg">
          {/* Hero Section */}
          <Box mb={6} textAlign="center">
            <motion.div
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.7, delay: 0.2 }}
            >
              <Typography
                variant={isMobile ? 'h3' : 'h2'}
                component="h1"
                gutterBottom
                sx={{
                  fontWeight: 900,
                  color: theme.palette.text.primary,
                  textShadow: `2px 2px 3px ${theme.palette.grey[300]}`,
                  lineHeight: 1.2,
                }}
              >
                Find Your Moment of Calm
              </Typography>
              <Typography
                variant="h6"
                color="textSecondary"
                paragraph
                sx={{
                  maxWidth: 750,
                  margin: '0 auto',
                  fontSize: '1.1rem',
                  fontWeight: 400,
                }}
              >
                Explore our diverse collection of guided meditations designed to bring peace and balance to your day.
              </Typography>
            </motion.div>

            {/* Search and Filter Section */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <Box
                mt={4}
                display="flex"
                justifyContent="center"
                gap={2}
                flexDirection={isMobile ? 'column' : 'row'}
                alignItems="center"
              >
                <TextField
                  label="Search Meditations"
                  variant="outlined"
                  size="small"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon color="action" />
                      </InputAdornment>
                    ),
                    endAdornment: searchQuery && (
                      <InputAdornment position="end">
                        <IconButton onClick={() => setSearchQuery('')} edge="end" aria-label="clear search">
                          <ClearIcon color="action" />
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    flex: '1 1 200px',
                    maxWidth: isMobile ? '100%' : '300px',
                    mb: isMobile ? 2 : 0,
                  }}
                />

                <FormControl variant="outlined" size="small" sx={{ flex: '0 0 auto', minWidth: 120 }}>
                  <InputLabel id="category-filter-label">Category</InputLabel>
                  <Select
                    labelId="category-filter-label"
                    id="category-filter"
                    value={selectedCategory}
                    label="Category"
                    onChange={(e) => setSelectedCategory(e.target.value)}
                  >
                    {availableCategories.map((category) => (
                      <MenuItem key={category} value={category}>
                        {category}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
            </motion.div>
          </Box>

          {/* Meditation Player Section */}
          {currentMeditation && (
            <Box ref={playerRef} mb={8}>
              <motion.div
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <Card sx={{ p: 3, borderRadius: '24px', boxShadow: theme.shadows[4], backgroundColor: theme.palette.background.paper }}>
                  <CardContent>
                    <Box display="flex" flexDirection="column" alignItems="center" textAlign="center">
                      <Avatar
                        alt={currentMeditation.title}
                        src={currentMeditation.image}
                        sx={{
                          width: isMobile ? 100 : 120,
                          height: isMobile ? 100 : 120,
                          mb: 3,
                          boxShadow: theme.shadows[2],
                          borderRadius: '16px',
                        }}
                      />
                      <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 700 }}>
                        {currentMeditation.title}
                      </Typography>
                      <Typography variant="subtitle1" color="textSecondary" paragraph>
                        {currentMeditation.description}
                      </Typography>

                      {/* Audio Controls */}
                      {isMobile ? (
                        // Mobile layout: stack controls vertically with spacing
                        <Box display="flex" flexDirection="column" alignItems="center" width="100%" gap={2}>
                          <Box display="flex" gap={2}>
                            <IconButton onClick={() => handlePlayPauseToggle(currentMeditation)} aria-label={isPlaying ? 'Pause meditation' : 'Play meditation'}>
                              {isPlaying ? (
                                <PauseIcon color="primary" fontSize="large" />
                              ) : (
                                <PlayArrowIcon color="action" fontSize="large" />
                              )}
                            </IconButton>
                            <IconButton onClick={handleStop} aria-label="Stop meditation">
                              <StopIcon color="action" fontSize="large" />
                            </IconButton>
                          </Box>
                          <Box display="flex" alignItems="center" width="100%">
                            <Typography variant="body2" color="textSecondary" mr={1}>
                              {formatTime(currentTime)}
                            </Typography>
                            <Slider
                              value={currentTime}
                              min={0}
                              max={duration}
                              onChange={handleSeek}
                              aria-labelledby="media-seek-bar"
                              sx={wavySliderSx}
                              style={{ flexGrow: 1, margin: '0 8px' }}
                            />
                            <Typography variant="body2" color="textSecondary" ml={1}>
                              {formatTime(duration)}
                            </Typography>
                          </Box>
                          <Box display="flex" alignItems="center" gap={1}>
                            <IconButton onClick={handleMuteToggle} aria-label={isMuted ? 'Unmute' : 'Mute'}>
                              {isMuted ? <VolumeOffIcon color="action" /> : <VolumeUpIcon color="action" />}
                            </IconButton>
                            <Slider
                              value={isMuted ? 0 : volume}
                              min={0}
                              max={1}
                              step={0.01}
                              onChange={handleVolumeChange}
                              aria-labelledby="media-volume-slider"
                              sx={{
                                width: 100,
                                color: theme.palette.primary.main,
                                '& .MuiSlider-thumb': {
                                  '&:hover, &.Mui-focusVisible': {
                                    boxShadow: `0 0 0 10px ${theme.palette.primary.light}40`,
                                  },
                                },
                              }}
                              disabled={isMuted}
                            />
                          </Box>
                        </Box>
                      ) : (
                        // Desktop layout: controls in a single row
                        <Box display="flex" alignItems="center" justifyContent="space-between" width="100%" flexDirection="row">
                          <Box display="flex" alignItems="center" justifyContent="center" mr={3}>
                            <IconButton onClick={() => handlePlayPauseToggle(currentMeditation)} aria-label={isPlaying ? 'Pause meditation' : 'Play meditation'}>
                              {isPlaying ? (
                                <PauseIcon color="primary" fontSize="large" />
                              ) : (
                                <PlayArrowIcon color="action" fontSize="large" />
                              )}
                            </IconButton>
                            <IconButton onClick={handleStop} aria-label="Stop meditation">
                              <StopIcon color="action" fontSize="large" />
                            </IconButton>
                          </Box>
                          <Box flexGrow={1} mx={2} display="flex" alignItems="center">
                            <Typography variant="body2" color="textSecondary" mr={1}>
                              {formatTime(currentTime)}
                            </Typography>
                            <Slider value={currentTime} min={0} max={duration} onChange={handleSeek} aria-labelledby="media-seek-bar" sx={wavySliderSx} />
                            <Typography variant="body2" color="textSecondary" ml={1}>
                              {formatTime(duration)}
                            </Typography>
                          </Box>
                          <Box display="flex" alignItems="center" ml={3}>
                            <IconButton onClick={handleMuteToggle} aria-label={isMuted ? 'Unmute' : 'Mute'}>
                              {isMuted ? <VolumeOffIcon color="action" /> : <VolumeUpIcon color="action" />}
                            </IconButton>
                            <Slider
                              value={isMuted ? 0 : volume}
                              min={0}
                              max={1}
                              step={0.01}
                              onChange={handleVolumeChange}
                              aria-labelledby="media-volume-slider"
                              sx={{
                                width: 100,
                                ml: 1,
                                color: theme.palette.primary.main,
                                '& .MuiSlider-thumb': {
                                  '&:hover, &.Mui-focusVisible': {
                                    boxShadow: `0 0 0 10px ${theme.palette.primary.light}40`,
                                  },
                                },
                              }}
                              disabled={isMuted}
                            />
                          </Box>
                        </Box>
                      )}
                    </Box>
                  </CardContent>
                </Card>
              </motion.div>
            </Box>
          )}

          {/* Meditation List Section */}
          <Box mt={8} mb={isMobile ? 8 : 5}>
            <Typography
              variant={isMobile ? 'h4' : 'h3'}
              align="center"
              gutterBottom
              sx={{
                fontWeight: 800,
                color: theme.palette.text.primary,
                px: isMobile ? theme.spacing(2) : 0,
                textShadow: `1px 1px 1px ${theme.palette.grey[300]}`,
                lineHeight: 1.3,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <LibraryMusicIcon sx={{ mr: 1, fontSize: '1.2em', color: theme.palette.primary.main }} />
              Explore Meditations
            </Typography>
            <Typography
              variant="h6"
              align="center"
              color="textSecondary"
              gutterBottom
              sx={{
                px: isMobile ? theme.spacing(3) : 0,
                maxWidth: 750,
                mx: 'auto',
                fontSize: '1.05rem',
                fontWeight: 400,
              }}
            >
              Browse our collection of guided meditations. Use search and categories to find exactly what you need.
            </Typography>

            <Grid container spacing={isMobile ? 3 : 4} mt={5} justifyContent="center">
              {filteredMeditations.map((meditation) => (
                <Grid item xs={12} sm={6} md={4} lg={3} key={meditation.id}>
                  <motion.div
                    initial={{ scale: 0.96, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: meditation.id * 0.05 }}
                    whileHover={{ scale: 1.03 }}
                    onClick={() => handleCardClick(meditation)}
                    style={{ cursor: 'pointer' }}
                  >
                    <MeditationCard isPlaying={currentMeditation?.id === meditation.id && isPlaying}>
                      <Box sx={{ textAlign: 'center', pt: 3 }}>
                        <Avatar
                          alt={meditation.title}
                          src={meditation.image}
                          sx={{
                            width: isMobile ? 70 : 90,
                            height: isMobile ? 70 : 90,
                            mx: 'auto',
                            boxShadow: theme.shadows[3],
                            borderRadius: '16px',
                          }}
                        />
                      </Box>
                      <CardContent sx={{ py: 3 }}>
                        <Typography
                          variant={isMobile ? 'h6' : 'h5'}
                          sx={{
                            fontWeight: 700,
                            color: theme.palette.text.primary,
                            textAlign: 'center',
                            mt: 3,
                            mb: 1,
                            textShadow: `1px 1px 1px ${theme.palette.grey[200]}`,
                            minHeight: '50px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                          gutterBottom
                        >
                          {meditation.title}
                        </Typography>
                        <Typography
                          variant="body2"
                          color="textSecondary"
                          sx={{ textAlign: 'center', fontSize: '1rem', lineHeight: 1.5, minHeight: '60px' }}
                        >
                          {meditation.description}
                        </Typography>
                        <Box mt={2} display="flex" justifyContent="center">
                          <Chip label={meditation.category} size="small" color="primary" sx={{ borderRadius: '8px' }} />
                        </Box>
                      </CardContent>
                      <CardActions sx={{ justifyContent: 'center', p: 3 }}>
                        <Tooltip title={`Play ${meditation.title}`}>
                          <motion.div
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePlayPauseToggle(meditation);
                            }}
                          >
                            <GradientButton
                              variant="contained"
                              fullWidth
                              disabled={
                                currentMeditation?.id === meditation.id &&
                                isPlaying === false &&
                                audioRef.current &&
                                !audioRef.current.paused
                              }
                              sx={{
                                py: isMobile ? 1.2 : 1.6,
                                fontSize: '1rem',
                                borderRadius: '14px',
                              }}
                            >
                              {currentMeditation?.id === meditation.id && isPlaying ? 'Pause' : 'Play'} -{' '}
                              {currentMeditation?.id === meditation.id
                                ? formatTime(duration)
                                : actualDurations[meditation.id]
                                ? formatTime(actualDurations[meditation.id])
                                : meditation.duration}
                            </GradientButton>
                          </motion.div>
                        </Tooltip>
                      </CardActions>
                    </MeditationCard>
                  </motion.div>
                </Grid>
              ))}
            </Grid>
            {filteredMeditations.length === 0 && (
              <Typography variant="subtitle1" color="textSecondary" align="center" mt={4}>
                No meditations found matching your criteria. Please adjust your search or filters.
              </Typography>
            )}
          </Box>

          {/* Hidden audio element */}
          <audio
            ref={audioRef}
            src={currentMeditation ? currentMeditation.audioSrc : ''}
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onEnded={handleStop}
          />
        </Container>
      </motion.div>
    </PageLayout>
  );
};

export default Meditations;
