// src/components/Layout.js

import React from 'react';
import Navbar from './Navbar';
import Footer from './Footer';
import { Box, useTheme } from '@mui/material';
import PropTypes from 'prop-types';

const Layout = ({ children, toggleTheme, currentTheme }) => {
    const theme = useTheme();

    return (
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'column',
                minHeight: '100vh',
                width: '100%',
                backgroundColor: theme.palette.background.default,
                color: theme.palette.text.primary,
                transition: "background-color 0.5s ease, color 0.5s ease",
                margin: 0,
                padding: 0,
                alignItems: 'center', // (Optional) Vertically center if content is shorter than viewport
            }}
        >
            {/* Navbar at the top */}
            <Navbar toggleTheme={toggleTheme} currentTheme={currentTheme} />

            {/* Main content area */}
            <Box
                component="main"
                sx={{
                    flexGrow: 1,
                    p: 2,
                    transition: "background-color 0.5s ease, color 0.5s ease",
                    width: '100%',
                    maxWidth: '900px', // **Narrowed maxWidth further to 900px - Experiment with this value**
                    mx: 'auto',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',    // Center items horizontally within main content area
                    // justifyContent: 'flex-start', // Default - Content starts at the top
                    justifyContent: 'center',  // **OPTIONALLY: Uncomment this to vertically center content within the MAIN area, especially if content is short**
                }}
            >
                {children}
            </Box>

            {/* Footer at the bottom */}
            <Footer />
        </Box>
    );
};

Layout.propTypes = {
    children: PropTypes.node.isRequired,
    toggleTheme: PropTypes.func.isRequired,
    currentTheme: PropTypes.string.isRequired,
};

export default Layout;s