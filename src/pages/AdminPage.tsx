import React from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { Box, Drawer, List, ListItem, ListItemButton, ListItemText, CssBaseline, AppBar, Toolbar, Typography } from '@mui/material';
import PeopleIcon from '@mui/icons-material/People';
import EventIcon from '@mui/icons-material/Event';
import AnalyticsIcon from '@mui/icons-material/Analytics';

const drawerWidth = 240;

const AdminPage: React.FC = () => {
  const location = useLocation();

  const menuItems = [
    { text: 'Analytics', path: 'analytics', icon: <AnalyticsIcon /> },
    { text: 'Users', path: 'users', icon: <PeopleIcon /> },
    { text: 'Events', path: 'events', icon: <EventIcon /> },
  ];

  const drawer = (
    <div>
      <Toolbar /> {/* Spacer for AppBar */}
      <List>
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton component={Link} to={item.path} selected={location.pathname === `/admin/dashboard/${item.path}`}>
              {item.icon && <span style={{ marginRight: '16px' }}>{item.icon}</span>}
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </div>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <AppBar
        position="fixed"
        sx={{ width: `calc(100% - ${drawerWidth}px)`, ml: `${drawerWidth}px`, backgroundColor: '#1A1A1A' }}
      >
        <Toolbar>
          <Typography variant="h6" noWrap component="div">
            Admin Dashboard
          </Typography>
        </Toolbar>
      </AppBar>
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          [`& .MuiDrawer-paper`]: { width: drawerWidth, boxSizing: 'border-box', backgroundColor: '#1E1E1E', color: '#fff' },
        }}
      >
        {drawer}
      </Drawer>
      <Box
        component="main"
        sx={{ flexGrow: 1, bgcolor: '#121212', p: 3, color: '#fff', minHeight: '100vh' }}
      >
        <Toolbar /> {/* Spacer for AppBar */}
        <Outlet /> {/* Nested admin routes will render here */}
      </Box>
    </Box>
  );
};

export default AdminPage; // Export as default 