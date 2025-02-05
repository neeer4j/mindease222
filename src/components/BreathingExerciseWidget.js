// src/components/BreathingExerciseWidget.js
import React, { useState, useEffect, useRef } from 'react';
import { Box, Typography } from '@mui/material';
import { styled, keyframes } from '@mui/system';

// Define keyframe animations for each phase.
const expandAnimation = keyframes`
  from { transform: scale(1); }
  to { transform: scale(1.2); }
`;

const contractAnimation = keyframes`
  from { transform: scale(1.2); }
  to { transform: scale(1); }
`;

// Redesigned BreathingCircle with a radial gradient background and box shadow.
const BreathingCircle = styled(Box)(({ theme }) => ({
  width: '100px',
  height: '100px',
  borderRadius: '50%',
  border: `3px solid ${theme.palette.primary.main}`,
  background: `radial-gradient(circle, ${theme.palette.primary.light} 0%, ${theme.palette.secondary.light} 100%)`,
  boxShadow: `0 0 15px ${theme.palette.primary.main}`,
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
}));

// Define the breathing steps: only two phases—"Breathe In" and "Breathe Out"—are used.
const steps = [
  {
    instruction: "Breathe In",
    duration: 4000,
    // Animation grows the circle.
    animation: (duration) => `${expandAnimation} ${duration}ms ease-in-out forwards`,
  },
  {
    instruction: "Breathe Out",
    duration: 6000,
    // Animation contracts the circle.
    animation: (duration) => `${contractAnimation} ${duration}ms ease-in-out forwards`,
  },
];

const BreathingExerciseWidget = () => {
  const [instruction, setInstruction] = useState("Breathe In");
  const [animationStyle, setAnimationStyle] = useState({});
  const timerRef = useRef(null);
  const stepIndexRef = useRef(0);

  useEffect(() => {
    const runStep = () => {
      const currentStep = steps[stepIndexRef.current];
      setInstruction(currentStep.instruction);
      setAnimationStyle({ animation: currentStep.animation(currentStep.duration) });

      timerRef.current = setTimeout(() => {
        // Cycle to the next step.
        stepIndexRef.current = (stepIndexRef.current + 1) % steps.length;
        runStep();
      }, currentStep.duration);
    };

    runStep();

    return () => clearTimeout(timerRef.current);
  }, []);

  return (
    <Box display="flex" flexDirection="column" alignItems="center">
      <BreathingCircle sx={animationStyle} />
      <Typography variant="h6" mt={2}>
        {instruction}
      </Typography>
    </Box>
  );
};

export default BreathingExerciseWidget;
