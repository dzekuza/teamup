import React, { useState } from 'react';
import { AppBar, Toolbar, Box, Avatar, IconButton, Menu, MenuItem } from '@mui/material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Logo from './Logo';
import { Button } from './ui/button';
import CreateEventDialog from './CreateEventDialog';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const [createEventDialogOpen, setCreateEventDialogOpen] = useState(false);

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleProfile = () => {
    handleClose();
    navigate('/profile');
  };

  const handleLogout = async () => {
    handleClose();
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Failed to log out:', error);
    }
  };

  const handleOpenCreateEventDialog = () => {
    setCreateEventDialogOpen(true);
  };

  const handleCloseCreateEventDialog = () => {
    setCreateEventDialogOpen(false);
  };

  const handleEventCreated = () => {
    // Refresh the events list or show a success message
    window.location.reload();
  };

  return (
    <>
      <AppBar position="static" sx={{ backgroundColor: '#020304' }}>
        <Toolbar>
          <Box component={RouterLink} to="/" sx={{ flexGrow: 1, textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
            <Logo width={40} height={44} variant="light" />
          </Box>
          <Box>
            {user ? (
              <>
                <Button 
                  onClick={handleOpenCreateEventDialog}
                  className="bg-[#B4D91E] text-[#020304] hover:bg-[#B4D91E]/90 mr-2"
                >
                  Create Event
                </Button>
                <IconButton
                  size="large"
                  aria-label="account of current user"
                  aria-controls="menu-appbar"
                  aria-haspopup="true"
                  onClick={handleMenu}
                  color="inherit"
                >
                  <Avatar sx={{ width: 32, height: 32 }}>
                    {user.displayName?.[0] || user.email?.[0] || '?'}
                  </Avatar>
                </IconButton>
                <Menu
                  id="menu-appbar"
                  anchorEl={anchorEl}
                  anchorOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                  }}
                  keepMounted
                  transformOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                  }}
                  open={Boolean(anchorEl)}
                  onClose={handleClose}
                >
                  <MenuItem onClick={handleProfile}>Profile</MenuItem>
                  <MenuItem onClick={handleLogout}>Logout</MenuItem>
                </Menu>
              </>
            ) : (
              <>
                <Button 
                  variant="ghost" 
                  onClick={() => navigate('/login')}
                  className="text-white hover:bg-white/10 mr-2"
                >
                  Login
                </Button>
                <Button 
                  variant="ghost" 
                  onClick={() => navigate('/register')}
                  className="text-white hover:bg-white/10"
                >
                  Register
                </Button>
              </>
            )}
          </Box>
        </Toolbar>
      </AppBar>
      <CreateEventDialog 
        open={createEventDialogOpen} 
        onClose={handleCloseCreateEventDialog} 
        onEventCreated={handleEventCreated} 
      />
    </>
  );
};

export default Navbar; 