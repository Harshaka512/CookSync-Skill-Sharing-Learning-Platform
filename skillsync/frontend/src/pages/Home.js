import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Button,
  Container,
  Grid,
  Typography,
  Card,
  CardContent,
} from '@mui/material';
import RestaurantMenuIcon from '@mui/icons-material/RestaurantMenu';
import PeopleIcon from '@mui/icons-material/People';
import CreateIcon from '@mui/icons-material/Create';
import GoogleIcon from '@mui/icons-material/Google';
import { useAuth } from '../contexts/AuthContext';

const Home = () => {
  const { user, login } = useAuth();

  const features = [
    {
      icon: <RestaurantMenuIcon fontSize="large" />,
      title: 'Discover Recipes',
      description: 'Explore a wide variety of recipes from around the world.',
    },
    {
      icon: <PeopleIcon fontSize="large" />,
      title: 'Join the Community',
      description: 'Connect with food lovers and share your culinary experiences.',
    },
    {
      icon: <CreateIcon fontSize="large" />,
      title: 'Share Your Creations',
      description: 'Create and share your own recipes with the community.',
    },
  ];

  const handleGoogleLogin = () => {
    login();
  };

  return (
    <Box>
      {/* Hero Section */}
      <Box
        sx={{
          bgcolor: 'background.paper',
          pt: 8,
          pb: 6,
        }}
      >
        <Container maxWidth="sm">
          <Typography
            component="h1"
            variant="h2"
            align="center"
            color="text.primary"
            gutterBottom
          >
            Cooking Edition
          </Typography>
          <Typography variant="h5" align="center" color="text.secondary" paragraph>
            Share your culinary journey with the world. Discover recipes, connect with food lovers, and inspire others.
          </Typography>
          <Box
            sx={{
              mt: 4,
              display: 'flex',
              justifyContent: 'center',
              gap: 2,
            }}
          >
            {user ? (
              <Button
                component={RouterLink}
                to="/dashboard"
                variant="contained"
                size="large"
              >
                Go to Dashboard
              </Button>
            ) : (
              <Button
                variant="contained"
                size="large"
                startIcon={<GoogleIcon />}
                onClick={handleGoogleLogin}
              >
                Sign in with Google
              </Button>
            )}
          </Box>
        </Container>
      </Box>

      {/* Features Section */}
      <Container sx={{ py: 8 }} maxWidth="md">
        <Grid container spacing={4}>
          {features.map((feature, index) => (
            <Grid item key={index} xs={12} sm={4}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  textAlign: 'center',
                }}
              >
                <CardContent>
                  <Box sx={{ color: 'primary.main', mb: 2 }}>
                    {feature.icon}
                  </Box>
                  <Typography gutterBottom variant="h5" component="h2">
                    {feature.title}
                  </Typography>
                  <Typography color="text.secondary">
                    {feature.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* CTA Section */}
      <Box sx={{ bgcolor: 'background.paper', py: 8 }}>
        <Container maxWidth="sm">
          <Typography variant="h4" align="center" color="text.primary" gutterBottom>
            Ready to start your culinary journey?
          </Typography>
          <Typography variant="subtitle1" align="center" color="text.secondary" paragraph>
            Join our community today and start sharing your recipes with the world.
          </Typography>
          <Box
            sx={{
              mt: 4,
              display: 'flex',
              justifyContent: 'center',
            }}
          >
            {user ? (
              <Button
                component={RouterLink}
                to="/posts/create"
                variant="contained"
                size="large"
              >
                Create Your First Post
              </Button>
            ) : (
              <Button
                variant="contained"
                size="large"
                startIcon={<GoogleIcon />}
                onClick={handleGoogleLogin}
              >
                Sign in with Google
              </Button>
            )}
          </Box>
        </Container>
      </Box>
    </Box>
  );
};

export default Home; 