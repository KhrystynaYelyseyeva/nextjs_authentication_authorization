"use client";

import { useState, MouseEvent } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  IconButton,
  Menu,
  MenuItem,
  Avatar,
  ListItemIcon,
  Divider,
  Tooltip,
  useTheme,
} from "@mui/material";
import {
  AccountCircle,
  Home,
  Dashboard,
  AdminPanelSettings,
  Login,
  PersonAdd,
  Logout,
} from "@mui/icons-material";
import { useAuth } from "@/contexts/AuthContext";

export const Header = () => {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const pathname = usePathname();
  const theme = useTheme();

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleMenuOpen = (event: MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleSignOut = () => {
    handleMenuClose();
    logout();
  };

  const isCurrentPage = (path: string) => {
    if (path === "/") {
      return pathname === path;
    }
    return pathname?.startsWith(path);
  };

  /**
   * Navigation items based on authentication status
   */
  const navItems = [
    {
      label: "Home",
      path: "/",
      icon: <Home />,
      show: true,
    },
    {
      label: "Dashboard",
      path: "/dashboard",
      icon: <Dashboard />,
      show: isAuthenticated,
    },
    {
      label: "Admin",
      path: "/admin",
      icon: <AdminPanelSettings />,
      show: isAuthenticated && isAdmin,
    },
    {
      label: "Login",
      path: "/login",
      icon: <Login />,
      show: !isAuthenticated,
    },
    {
      label: "Sign Up",
      path: "/signup",
      icon: <PersonAdd />,
      show: !isAuthenticated,
    },
  ];

  /**
   * Filter navigation items based on auth status
   */
  const visibleNavItems = navItems.filter((item) => item.show);

  return (
    <AppBar position="static" elevation={2} sx={{ borderRadius: 0 }}>
      <Toolbar>
        <Typography
          variant="h6"
          component="div"
          sx={{
            flexGrow: 1,
            fontWeight: 700,
          }}
        >
          <Link href="/" style={{ color: "white", textDecoration: "none" }}>
            Next.js GraphQL Auth
          </Link>
        </Typography>

        <Box sx={{ display: "flex" }}>
          {visibleNavItems.map(
            (item) =>
              item.path !== "/" && (
                <Button
                  key={item.path}
                  color="inherit"
                  component={Link}
                  href={item.path}
                  startIcon={item.icon}
                  sx={{
                    mx: 0.5,
                    ...(isCurrentPage(item.path) && {
                      borderBottom: "3px solid white",
                      borderRadius: 0,
                      paddingBottom: "3px",
                    }),
                  }}
                >
                  {item.label}
                </Button>
              )
          )}
        </Box>

        {/* User profile button (when authenticated) */}
        {isAuthenticated && (
          <Box>
            <Tooltip title="Account settings">
              <IconButton
                aria-label="account of current user"
                aria-controls="menu-appbar"
                aria-haspopup="true"
                onClick={handleMenuOpen}
                color="inherit"
                sx={{ ml: 1 }}
              >
                {user?.name ? (
                  <Avatar
                    sx={{
                      width: 32,
                      height: 32,
                      bgcolor: theme.palette.secondary.main,
                      fontSize: "0.9rem",
                      fontWeight: "bold",
                    }}
                  >
                    {user?.name?.charAt(0)?.toUpperCase() || "-"}
                  </Avatar>
                ) : (
                  <AccountCircle />
                )}
              </IconButton>
            </Tooltip>

            {/* User dropdown menu */}
            <Menu
              id="menu-appbar"
              anchorEl={anchorEl}
              anchorOrigin={{
                vertical: "bottom",
                horizontal: "right",
              }}
              keepMounted
              transformOrigin={{
                vertical: "top",
                horizontal: "right",
              }}
              open={Boolean(anchorEl)}
              onClose={handleMenuClose}
            >
              {/* User info */}
              <Box sx={{ px: 2, py: 1, minWidth: 200 }}>
                <Typography variant="subtitle1" fontWeight="bold">
                  {user?.name || "User"}
                </Typography>
                <Typography variant="body2" color="text.secondary" noWrap>
                  {user?.email}
                </Typography>
                <Typography variant="caption" color="primary">
                  {isAdmin ? "Administrator" : "User"}
                </Typography>
              </Box>

              <Divider />

              <MenuItem onClick={handleSignOut}>
                <ListItemIcon>
                  <Logout fontSize="small" />
                </ListItemIcon>
                Logout
              </MenuItem>
            </Menu>
          </Box>
        )}
      </Toolbar>
    </AppBar>
  );
};
