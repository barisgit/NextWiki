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
  // navigation: [
  //   {
  //     i18nkey: "home", // This should match the key in the messages file pages.{i18nkey}
  //     href: "/",
  //   },
  //   {
  //     i18nkey: "dashboard",
  //     href: "/dashboard",
  //     protected: true,
  //   },
  //   {
  //     i18nkey: "features",
  //     href: "/features",
  //     feature: "features",
  //   },
  //   {
  //     i18nkey: "admin",
  //     href: "/admin",
  //     feature: "adminDashboard",
  //     admin: true,
  //     subroutes: [
  //       {
  //         i18nkey: "mail",
  //         href: "/admin/mail",
  //         feature: "emailSystem",
  //       },
  //       {
  //         i18nkey: "reservations",
  //         href: "/admin/reservations",
  //         feature: "reservationSystem",
  //       },
  //     ],
  //   },
  // ],
};

export default AppConfig;
