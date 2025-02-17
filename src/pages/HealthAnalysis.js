import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  CircularProgress,
  Button,
  Grid,
  Card,
  CardContent,
  Alert,
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

const HealthAnalysis = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [healthData, setHealthData] = useState(null);
  const [isAuthorized, setIsAuthorized] = useState(false);

  const CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID;
  const SCOPES = [
    'https://www.googleapis.com/auth/fitness.activity.read',
    'https://www.googleapis.com/auth/fitness.heart_rate.read',
    'https://www.googleapis.com/auth/fitness.sleep.read'
  ];

  useEffect(() => {
    loadGoogleFitApi();
  }, []);

  const loadGoogleFitApi = () => {
    const script = document.createElement('script');
    script.src = 'https://apis.google.com/js/api.js';
    script.onload = () => {
      window.gapi.load('client:auth2', initClient);
    };
    document.body.appendChild(script);
  };

  const initClient = () => {
    window.gapi.client.init({
      clientId: CLIENT_ID,
      scope: SCOPES.join(' ')
    }).then(() => {
      checkAuthStatus();
    }).catch((error) => {
      setError('Error initializing Google Fit API: ' + error.message);
      setLoading(false);
    });
  };

  const checkAuthStatus = () => {
    const isSignedIn = window.gapi.auth2.getAuthInstance().isSignedIn.get();
    setIsAuthorized(isSignedIn);
    setLoading(false);
  };

  const handleAuthClick = () => {
    if (!window.gapi.auth2.getAuthInstance().isSignedIn.get()) {
      window.gapi.auth2.getAuthInstance().signIn().then(() => {
        setIsAuthorized(true);
        fetchHealthData();
      }).catch((error) => {
        setError('Error signing in: ' + error.message);
      });
    }
  };

  const fetchHealthData = async () => {
    setLoading(true);
    try {
      const now = new Date();
      const startTime = new Date();
      startTime.setDate(now.getDate() - 7); // Get data for the last 7 days

      // Fetch steps data
      const stepsResponse = await window.gapi.client.request({
        path: 'https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate',
        method: 'POST',
        body: {
          aggregateBy: [{
            dataTypeName: 'com.google.step_count.delta',
          }],
          startTimeMillis: startTime.getTime(),
          endTimeMillis: now.getTime(),
        }
      });

      // Fetch heart rate data
      const heartRateResponse = await window.gapi.client.request({
        path: 'https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate',
        method: 'POST',
        body: {
          aggregateBy: [{
            dataTypeName: 'com.google.heart_rate.bpm',
          }],
          startTimeMillis: startTime.getTime(),
          endTimeMillis: now.getTime(),
        }
      });

      const healthData = {
        steps: processStepsData(stepsResponse.result),
        heartRate: processHeartRateData(heartRateResponse.result),
        lastUpdated: new Date().toISOString()
      };

      setHealthData(healthData);
      
      // Store the data in Firestore
      if (user) {
        const userHealthRef = doc(db, 'users', user.uid, 'health', 'latest');
        await setDoc(userHealthRef, healthData);
      }

    } catch (error) {
      setError('Error fetching health data: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const processStepsData = (data) => {
    // Process and return steps data
    const steps = data.bucket?.[0]?.dataset?.[0]?.point?.[0]?.value?.[0]?.intVal || 0;
    return { total: steps, daily: steps / 7 }; // Average for the week
  };

  const processHeartRateData = (data) => {
    // Process and return heart rate data
    const points = data.bucket?.[0]?.dataset?.[0]?.point || [];
    const values = points.map(point => point.value?.[0]?.fpVal || 0).filter(val => val > 0);
    const average = values.length ? values.reduce((a, b) => a + b) / values.length : 0;
    return { average, min: Math.min(...values), max: Math.max(...values) };
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom component="h1">
        Health Analysis
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {!isAuthorized ? (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="h6" gutterBottom>
            Connect to Google Fit
          </Typography>
          <Typography variant="body1" paragraph>
            Connect your Google Fit account to see your health metrics.
          </Typography>
          <Button
            variant="contained"
            color="primary"
            onClick={handleAuthClick}
          >
            Connect Google Fit
          </Button>
        </Paper>
      ) : (
        <>
          <Grid container spacing={3}>
            {healthData && (
              <>
                <Grid item xs={12} md={6}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Steps
                      </Typography>
                      <Typography variant="h4">
                        {healthData.steps.total.toLocaleString()}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Daily Average: {Math.round(healthData.steps.daily).toLocaleString()}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Heart Rate
                      </Typography>
                      <Typography variant="h4">
                        {Math.round(healthData.heartRate.average)} BPM
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Range: {Math.round(healthData.heartRate.min)} - {Math.round(healthData.heartRate.max)} BPM
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </>
            )}
          </Grid>
          
          <Box mt={3} display="flex" justifyContent="center">
            <Button
              variant="contained"
              color="primary"
              onClick={fetchHealthData}
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : 'Refresh Data'}
            </Button>
          </Box>
        </>
      )}
    </Container>
  );
};

export default HealthAnalysis;