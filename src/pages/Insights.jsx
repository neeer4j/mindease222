          {/* Page Header */}
          <Box textAlign="center" mb={6}>
            <motion.div variants={sectionVariants} initial="hidden" animate="visible">
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', mb: 2 }}>
                <Typography
                  variant={isMobile ? 'h3' : 'h2'}
                  component="h1"
                  sx={{
                    fontWeight: 800,
                    color: theme.palette.text.primary,
                    position: 'relative',
                    zIndex: 1,
                    textShadow: `0 2px 4px ${alpha(theme.palette.primary.main, 0.2)}`,
                    background: `linear-gradient(135deg, ${theme.palette.text.primary} 0%, ${alpha(theme.palette.primary.main, 0.8)} 100%)`,
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  Insights & Analytics
                </Typography>
                <Typography 
                  variant={isMobile ? 'h3' : 'h2'}
                  sx={{ color: 'text.primary' }}
                >
                  📊
                </Typography>
              </Box>
              <Typography
                variant="h5"
                sx={{
                  color: theme.palette.text.secondary,
                  maxWidth: 800,
                  mx: 'auto',
                  position: 'relative',
                  zIndex: 1,
                  fontWeight: 400,
                  px: 2,
                }}
              >
                Dive deep into your mental well-being with detailed insights and analytics based on your logged moods, activities, and sleep.
              </Typography>
            </motion.div>
          </Box> 