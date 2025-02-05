import React, { useState, useEffect } from 'react';
import { Box } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';

const HeroCarousel = ({ images }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Only run if images array is not empty
  useEffect(() => {
    if (images.length > 0) {
      const interval = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % images.length);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [images]);

  return (
    <Box
      sx={{
        position: 'relative',
        width: { xs: '100%', md: '90%' },
        maxWidth: '500px',
        height: { xs: '250px', md: '400px' },
        borderRadius: '28px',
        overflow: 'hidden',
        margin: '0 auto',
      }}
    >
      <AnimatePresence mode="wait">
        {images.length > 0 && (
          <motion.img
            key={images[currentIndex]} // Use the image URL as the key
            src={images[currentIndex]}
            alt={`Hero Image ${currentIndex + 1}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5 }}
            style={{
              position: 'absolute',
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
            loading="lazy"
          />
        )}
      </AnimatePresence>
    </Box>
  );
};

export default HeroCarousel;
