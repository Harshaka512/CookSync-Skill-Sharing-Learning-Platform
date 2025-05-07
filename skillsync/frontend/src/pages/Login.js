import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Button,
  Paper,
  Divider,
} from '@mui/material';
import GoogleIcon from '@mui/icons-material/Google';
import { useAuth } from '../contexts/AuthContext';

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleGoogleLogin = () => {
    login();
  };

  return (
    <Container component="main" maxWidth="xs">
      <Paper
        elevation={3}
        sx={{
          marginTop: 8,
          padding: 4,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Typography component="h1" variant="h5" gutterBottom>
          Sign In to Cooking Edition
        </Typography>
        
        <Typography variant="body1" color="text.secondary" align="center" sx={{ mb: 3 }}>
          Join our community of cooking enthusiasts and share your culinary journey
        </Typography>
        
        <Button
          variant="contained"
          startIcon={<GoogleIcon />}
          onClick={handleGoogleLogin}
          sx={{ mt: 2, mb: 2, width: '100%' }}
        >
          Sign in with Google
        </Button>
        
        <Divider sx={{ width: '100%', my: 2 }}>OR</Divider>
        
        <Typography variant="body2" color="text.secondary" align="center">
          By signing in, you agree to our Terms of Service and Privacy Policy
        </Typography>
      </Paper>
    </Container>
  );
};

export default Login; 