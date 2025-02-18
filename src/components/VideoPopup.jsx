import React, { useState, useEffect } from 'react';
import { Box, IconButton, Paper, Fab, Tooltip, useTheme, useMediaQuery } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import VideoCallIcon from '@mui/icons-material/VideoCall';
import Draggable from 'react-draggable';

const VideoPopup = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [hasSeenInitialVideo, setHasSeenInitialVideo] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  useEffect(() => {
    const hasSeenVideo = localStorage.getItem('hasSeenIntroVideo');
    setHasSeenInitialVideo(!!hasSeenVideo);
    if (!hasSeenVideo) {
      setIsOpen(true);
    }
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    if (!hasSeenInitialVideo) {
      localStorage.setItem('hasSeenIntroVideo', 'true');
      setHasSeenInitialVideo(true);
    }
  };

  const handleToggleVideo = () => {
    setIsOpen(prev => !prev);
  };

  return (
    <>
      {/* Video Popup */}
      {isOpen && (
        <>
          {isMobile ? (
            // Mobile Layout with overlay
            <Box
              sx={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                zIndex: 1000,
              }}
            >
              <Paper
                sx={{
                  position: 'relative',
                  width: '90%',
                  height: '180px',
                  maxWidth: '320px',
                  borderRadius: 2,
                  boxShadow: 3,
                  overflow: 'hidden',
                }}
              >
                <IconButton
                  onClick={handleClose}
                  sx={{
                    position: 'absolute',
                    right: 4,
                    top: 2,
                    color: 'white',
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    zIndex: 2,
                    padding: '4px',
                    '&:hover': {
                      backgroundColor: 'rgba(0,0,0,0.7)',
                    },
                    '& .MuiSvgIcon-root': {
                      fontSize: '1rem',
                    },
                  }}
                  aria-label="Close video"
                >
                  <CloseIcon />
                </IconButton>
                <Box
                  component="video"
                  width="100%"
                  height="100%"
                  sx={{ 
                    objectFit: 'contain',
                    background: '#000',
                  }}
                  controls
                  src="https://firebasestorage.googleapis.com/v0/b/mindease-dbed7.firebasestorage.app/o/titlevideo%2Fmindeasepromo.mp4?alt=media&token=e87befb7-ae15-4b9e-9f19-59ed3389b85f"
                  poster="/images/banner.png"
                />
              </Paper>
            </Box>
          ) : (
            // Desktop Layout with PiP
            <Draggable bounds="parent" handle=".drag-handle">
              <Paper
                sx={{
                  position: 'fixed',
                  bottom: 20,
                  right: 20,
                  width: 300,
                  height: 200,
                  borderRadius: 2,
                  boxShadow: 3,
                  overflow: 'hidden',
                  zIndex: 1000,
                }}
              >
                <Box
                  className="drag-handle"
                  sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '24px',
                    background: 'rgba(0,0,0,0.5)',
                    cursor: 'move',
                    zIndex: 1,
                  }}
                />
                <IconButton
                  onClick={handleClose}
                  sx={{
                    position: 'absolute',
                    right: 4,
                    top: 2,
                    color: 'white',
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    zIndex: 2,
                    padding: '4px',
                    '&:hover': {
                      backgroundColor: 'rgba(0,0,0,0.7)',
                    },
                    '& .MuiSvgIcon-root': {
                      fontSize: '1rem',
                    },
                  }}
                  aria-label="Close video"
                >
                  <CloseIcon />
                </IconButton>
                <Box
                  component="video"
                  width="100%"
                  height="100%"
                  sx={{ 
                    objectFit: 'contain',
                    background: '#000',
                  }}
                  controls
                  src="https://firebasestorage.googleapis.com/v0/b/mindease-dbed7.firebasestorage.app/o/titlevideo%2Fmindeasepromo.mp4?alt=media&token=e87befb7-ae15-4b9e-9f19-59ed3389b85f"
                  poster="/images/banner.png"
                />
              </Paper>
            </Draggable>
          )}
        </>
      )}

      {/* Toggle Button */}
      <Tooltip title="Toggle Welcome Video" placement="left">
        <Fab
          size={isMobile ? "small" : "medium"}
          color="primary"
          sx={{
            position: 'fixed',
            bottom: isMobile ? 65 : 20,
            right: isMobile ? 16 : 20,
            zIndex: 999,
            display: isOpen ? 'none' : 'flex',
            transform: 'scale(0.85)',
            pointerEvents: 'auto',
          }}
          onClick={handleToggleVideo}
        >
          <VideoCallIcon fontSize={isMobile ? "small" : "medium"} />
        </Fab>
      </Tooltip>
    </>
  );
};

export default VideoPopup;