// src/components/SummaryStats.jsx

import React from 'react';
import { Grid, Paper, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  textAlign: 'center',
  borderRadius: 16,
  backgroundColor: theme.palette.background.paper,
}));

const SummaryStats = ({ stats }) => {
  return (
    <Grid container spacing={4} justifyContent="center">
      <Grid item xs={12} sm={4}>
        <StyledPaper elevation={3}>
          <Typography variant="h6" color="textSecondary" gutterBottom>
            Total Moods Logged
          </Typography>
          <Typography variant="h4" sx={{ color: 'primary.main' }}>
            {stats.totalMoods}
          </Typography>
        </StyledPaper>
      </Grid>
      <Grid item xs={12} sm={4}>
        <StyledPaper elevation={3}>
          <Typography variant="h6" color="textSecondary" gutterBottom>
            Average Mood
          </Typography>
          <Typography variant="h4" sx={{ color: 'primary.main' }}>
            {stats.averageMood} ⭐
          </Typography>
        </StyledPaper>
      </Grid>
      <Grid item xs={12} sm={4}>
        <StyledPaper elevation={3}>
          <Typography variant="h6" color="textSecondary" gutterBottom>
            Total Activities Logged
          </Typography>
          <Typography variant="h4" sx={{ color: 'primary.main' }}>
            {stats.totalActivities}
          </Typography>
        </StyledPaper>
      </Grid>
    </Grid>
  );
};

export default SummaryStats;
