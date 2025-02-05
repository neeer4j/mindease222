// src/App.js
import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
  useNavigate,
} from "react-router-dom";
import {
  ThemeProvider,
  CssBaseline,
  Box,
  useMediaQuery,
  GlobalStyles,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { AuthProvider } from "./contexts/AuthContext";
import { MoodProvider } from "./contexts/MoodContext";
import { ActivityProvider } from "./contexts/ActivityContext";
import { SleepProvider } from "./contexts/SleepContext";
import { ChatProvider } from "./contexts/ChatContext";
import { TherapistFindProvider } from "./contexts/TherapistFindContext"; // <-- Import the provider
import { auth, getRedirectResult } from "./firebase";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Landing from "./pages/Landing";
import ProtectedRoute from "./components/ProtectedRoute";
import Dashboard from "./pages/Dashboard";
import BookFacility from "./pages/BookFacility";
import ComplaintsPage from "./pages/ComplaintsPage";
import PaymentsPage from "./pages/PaymentsPage";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import UserProfile from "./pages/UserProfile";
import NotFound from "./pages/NotFound";
import Unauthorized from "./pages/Unauthorized";
import Chat from "./pages/Chat";
import MoodTracker from "./pages/MoodTracker";
import ActivityLogging from "./pages/ActivityLogging";
import Insights from "./pages/Insights";
import Meditations from "./pages/Meditations";
import SleepQualityMonitor from "./pages/SleepQualityMonitor";
// Import the new Therapist Recommendations page
import TherapistRecommendations from "./pages/TherapistRecommendations";
// NEW: Import the Reels page
import ReelsPage from "./pages/ReelsPage";
import getTheme from "./theme";
import { AnimatePresence } from "framer-motion";
import BottomNav from "./components/BottomNav";

// Debugging log
console.log("Rendering App...");

function AppRoutes({ toggleTheme }) {
  return (
    <AnimatePresence mode="wait">
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/book-facility"
          element={
            <ProtectedRoute>
              <BookFacility />
            </ProtectedRoute>
          }
        />
        {/* Pass toggleTheme to Chat */}
        <Route
          path="/chat"
          element={
            <ProtectedRoute>
              <Chat toggleTheme={toggleTheme} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/complaints"
          element={
            <ProtectedRoute>
              <ComplaintsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/payments"
          element={
            <ProtectedRoute>
              <PaymentsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <UserProfile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/mood-tracker"
          element={
            <ProtectedRoute>
              <MoodTracker />
            </ProtectedRoute>
          }
        />
        <Route
          path="/activity-logging"
          element={
            <ProtectedRoute>
              <ActivityLogging />
            </ProtectedRoute>
          }
        />
        <Route
          path="/insights"
          element={
            <ProtectedRoute>
              <Insights />
            </ProtectedRoute>
          }
        />
        <Route
          path="/meditations"
          element={
            <ProtectedRoute>
              <Meditations />
            </ProtectedRoute>
          }
        />
        <Route
          path="/sleep-tracker"
          element={
            <ProtectedRoute>
              <SleepQualityMonitor />
            </ProtectedRoute>
          }
        />
        {/* New Therapist Recommendations Route */}
        <Route
          path="/therapist-recommendations"
          element={
            <ProtectedRoute>
              <TherapistRecommendations />
            </ProtectedRoute>
          }
        />
        {/* NEW: Reels Route */}
        <Route
          path="/reels"
          element={
            <ProtectedRoute>
              <ReelsPage />
            </ProtectedRoute>
          }
        />
        <Route path="/unauthorized" element={<Unauthorized />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AnimatePresence>
  );
}

function RedirectHandler() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleRedirectResult = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (result) {
          const firebaseUser = result.user;
          console.log("Redirect Sign-In User:", firebaseUser);
          navigate("/dashboard");
        }
      } catch (err) {
        console.error("Error handling redirect result:", err);
      }
    };

    handleRedirectResult();
  }, [navigate]);

  return null;
}

const MainContent = ({ toggleTheme, mode }) => {
  const muiTheme = useTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down("sm"));
  const location = useLocation();

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
        transition: "background-color 0.5s ease, color 0.5s ease",
        backgroundColor: muiTheme.palette.background.default,
        color: muiTheme.palette.text.primary,
      }}
    >
      <Navbar toggleTheme={toggleTheme} mode={mode} />
      <Box component="main" sx={{ flexGrow: 1 }}>
        <RedirectHandler />
        <AppRoutes toggleTheme={toggleTheme} />
      </Box>
      {!isMobile && <Footer />} {/* Footer only for non-mobile */}
    </Box>
  );
};

function App() {
  const [mode, setMode] = useState(() => localStorage.getItem("themeMode") || "dark");

  useEffect(() => {
    localStorage.setItem("themeMode", mode);
  }, [mode]);

  const toggleTheme = () => {
    setMode((prevMode) => (prevMode === "light" ? "dark" : "light"));
  };

  const theme = getTheme(mode);
  console.log("Current Theme Object:", theme);

  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <GlobalStyles
        styles={{
          "::-webkit-scrollbar": {
            width: "6px",
          },
          "::-webkit-scrollbar-track": {
            background: theme.palette.background.paper,
            borderRadius: "3px",
          },
          "::-webkit-scrollbar-thumb": {
            backgroundColor: theme.palette.primary.main,
            borderRadius: "3px",
          },
        }}
      />
      <AuthProvider>
        <MoodProvider>
          <ActivityProvider>
            <SleepProvider>
              <ChatProvider>
                <TherapistFindProvider>
                  <Router>
                    <MainContent toggleTheme={toggleTheme} mode={mode} />
                    {isMobile && <BottomNav />}
                  </Router>
                </TherapistFindProvider>
              </ChatProvider>
            </SleepProvider>
          </ActivityProvider>
        </MoodProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
