// Add these type definitions at the top
type ThemeMode = "light" | "dark" | null;

// FIXME: Update this configuration file based on your project information
const AppConfig = {
  name: "t3-custom-template",
  website_name: "T3 Custom Template",
  website_description: "T3 Custom Template",
  reservedRoutes: [
    "/api/trpc(.*)",
    "/api/assets(.*)",
    "/api/auth(.*)",
    "/api(.*)",
    "/wiki(.*)",
    "/create(.*)",
    "/tags(.*)",
    "/admin(.*)",
    "/dashboard(.*)",
    "/login(.*)",
    "/register(.*)",
    "/profile(.*)",
  ],
  forceThemeMode: "dark" as ThemeMode,
  maxNotifications: 5,
  initialAppConfig: {
    allowPublicViewers: false,
  },
};

export default AppConfig;
