/** @type {import('tailwindcss').Config} */

const config = {
  content: [
    "./src/app/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}",
    "./src/components/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        background: {
          DEFAULT: "var(--color-background-default)",
          paper: "var(--color-background-paper)",
          level1: "var(--color-background-level1)",
          level2: "var(--color-background-level2)",
          level3: "var(--color-background-level3)",
          light: "var(--color-background-light)",
          dark: "var(--color-background-dark)",
        },
        foreground: "var(--color-foreground)",
        text: {
          primary: "var(--color-text-primary)",
          secondary: "var(--color-text-secondary)",
          accent: "var(--color-text-accent)",
        },
        border: {
          DEFAULT: "var(--color-border)",
          light: "var(--color-border-light)",
          dark: "var(--color-border-dark)",
          accent: "var(--color-border-accent)",
        },
        card: {
          DEFAULT: "var(--color-card)",
          foreground: "var(--color-card-foreground)",
          muted: "var(--color-card-muted)",
          hover: "var(--color-card-hover)",
          active: "var(--color-card-active)",
        },
        code: {
          DEFAULT: "var(--color-code)",
          foreground: "var(--color-code-foreground)",
          inline: {
            DEFAULT: "var(--color-inline-code)",
            foreground: "var(--color-inline-code-foreground)",
          },
        },
        popover: {
          DEFAULT: "var(--color-popover)",
          foreground: "var(--color-popover-foreground)",
          border: "var(--color-popover-border)",
        },
        primary: {
          DEFAULT: "var(--color-primary)",
          foreground: "var(--color-primary-foreground)",
          50: "var(--color-primary-50)",
          100: "var(--color-primary-100)",
          200: "var(--color-primary-200)",
          300: "var(--color-primary-300)",
          400: "var(--color-primary-400)",
          500: "var(--color-primary-500)",
          600: "var(--color-primary-600)",
          700: "var(--color-primary-700)",
          800: "var(--color-primary-800)",
          900: "var(--color-primary-900)",
          1000: "var(--color-primary-1000)",
          1100: "var(--color-primary-1100)",
          1200: "var(--color-primary-1200)",
        },
        secondary: {
          DEFAULT: "var(--color-secondary)",
          foreground: "var(--color-secondary-foreground)",
          50: "var(--color-secondary-50)",
          100: "var(--color-secondary-100)",
          200: "var(--color-secondary-200)",
          300: "var(--color-secondary-300)",
          400: "var(--color-secondary-400)",
          500: "var(--color-secondary-500)",
          600: "var(--color-secondary-600)",
          700: "var(--color-secondary-700)",
          800: "var(--color-secondary-800)",
          900: "var(--color-secondary-900)",
          1000: "var(--color-secondary-1000)",
          1100: "var(--color-secondary-1100)",
          1200: "var(--color-secondary-1200)",
        },
        muted: {
          DEFAULT: "var(--color-muted)",
          foreground: "var(--color-muted-foreground)",
          lighter: "var(--color-muted-lighter)",
          darker: "var(--color-muted-darker)",
        },
        accent: {
          DEFAULT: "var(--color-accent)",
          foreground: "var(--color-accent-foreground)",
          50: "var(--color-accent-50)",
          100: "var(--color-accent-100)",
          200: "var(--color-accent-200)",
          300: "var(--color-accent-300)",
          400: "var(--color-accent-400)",
          500: "var(--color-accent-500)",
          600: "var(--color-accent-600)",
          700: "var(--color-accent-700)",
          800: "var(--color-accent-800)",
          900: "var(--color-accent-900)",
          1000: "var(--color-accent-1000)",
          1100: "var(--color-accent-1100)",
          1200: "var(--color-accent-1200)",
        },
        complementary: {
          DEFAULT: "var(--color-complementary)",
          foreground: "var(--color-complementary-foreground)",
          50: "var(--color-complementary-50)",
          100: "var(--color-complementary-100)",
          200: "var(--color-complementary-200)",
          300: "var(--color-complementary-300)",
          400: "var(--color-complementary-400)",
          500: "var(--color-complementary-500)",
          600: "var(--color-complementary-600)",
          700: "var(--color-complementary-700)",
          800: "var(--color-complementary-800)",
          900: "var(--color-complementary-900)",
          1000: "var(--color-complementary-1000)",
          1100: "var(--color-complementary-1100)",
          1200: "var(--color-complementary-1200)",
        },
        destructive: {
          DEFAULT: "var(--color-destructive)",
          foreground: "var(--color-destructive-foreground)",
          50: "var(--color-destructive-50)",
          100: "var(--color-destructive-100)",
          200: "var(--color-destructive-200)",
          300: "var(--color-destructive-300)",
          400: "var(--color-destructive-400)",
          500: "var(--color-destructive-500)",
          600: "var(--color-destructive-600)",
          700: "var(--color-destructive-700)",
          800: "var(--color-destructive-800)",
          900: "var(--color-destructive-900)",
          1000: "var(--color-destructive-1000)",
          1100: "var(--color-destructive-1100)",
          1200: "var(--color-destructive-1200)",
        },
        success: {
          DEFAULT: "var(--color-success)",
          foreground: "var(--color-success-foreground)",
          50: "var(--color-success-50)",
          100: "var(--color-success-100)",
          200: "var(--color-success-200)",
          300: "var(--color-success-300)",
          400: "var(--color-success-400)",
          500: "var(--color-success-500)",
          600: "var(--color-success-600)",
          700: "var(--color-success-700)",
          800: "var(--color-success-800)",
          900: "var(--color-success-900)",
          1000: "var(--color-success-1000)",
          1100: "var(--color-success-1100)",
          1200: "var(--color-success-1200)",
        },
        warning: {
          DEFAULT: "var(--color-warning)",
          foreground: "var(--color-warning-foreground)",
          50: "var(--color-warning-50)",
          100: "var(--color-warning-100)",
          200: "var(--color-warning-200)",
          300: "var(--color-warning-300)",
          400: "var(--color-warning-400)",
          500: "var(--color-warning-500)",
          600: "var(--color-warning-600)",
          700: "var(--color-warning-700)",
          800: "var(--color-warning-800)",
          900: "var(--color-warning-900)",
          1000: "var(--color-warning-1000)",
          1100: "var(--color-warning-1100)",
          1200: "var(--color-warning-1200)",
        },
        info: {
          DEFAULT: "var(--color-info)",
          foreground: "var(--color-info-foreground)",
          50: "var(--color-info-50)",
          100: "var(--color-info-100)",
          200: "var(--color-info-200)",
          300: "var(--color-info-300)",
          400: "var(--color-info-400)",
          500: "var(--color-info-500)",
          600: "var(--color-info-600)",
          700: "var(--color-info-700)",
          800: "var(--color-info-800)",
          900: "var(--color-info-900)",
          1000: "var(--color-info-1000)",
          1100: "var(--color-info-1100)",
          1200: "var(--color-info-1200)",
        },
        error: {
          DEFAULT: "var(--color-error)",
          foreground: "var(--color-error-foreground)",
          50: "var(--color-error-50)",
          100: "var(--color-error-100)",
          200: "var(--color-error-200)",
          300: "var(--color-error-300)",
          400: "var(--color-error-400)",
          500: "var(--color-error-500)",
          600: "var(--color-error-600)",
          700: "var(--color-error-700)",
          800: "var(--color-error-800)",
          900: "var(--color-error-900)",
          1000: "var(--color-error-1000)",
          1100: "var(--color-error-1100)",
          1200: "var(--color-error-1200)",
        },
        neutral: {
          DEFAULT: "var(--color-neutral)",
          foreground: "var(--color-neutral-foreground)",
          50: "var(--color-neutral-50)",
          100: "var(--color-neutral-100)",
          200: "var(--color-neutral-200)",
          300: "var(--color-neutral-300)",
          400: "var(--color-neutral-400)",
          500: "var(--color-neutral-500)",
          600: "var(--color-neutral-600)",
          700: "var(--color-neutral-700)",
          800: "var(--color-neutral-800)",
          900: "var(--color-neutral-900)",
          1000: "var(--color-neutral-1000)",
          1100: "var(--color-neutral-1100)",
          1200: "var(--color-neutral-1200)",
        },
        neon: {
          DEFAULT: "var(--color-neon)",
          primary: "var(--color-neon-primary)",
          secondary: "var(--color-neon-secondary)",
          accent: "var(--color-neon-accent)",
          complementary: "var(--color-neon-complementary)",
        },
        neonGlow: {
          primary: "var(--color-neon-glow-primary)",
          secondary: "var(--color-neon-glow-secondary)",
          accent: "var(--color-neon-glow-accent)",
          complementary: "var(--color-neon-glow-complementary)",
        },
        input: "var(--color-input)",
        ring: "var(--color-ring)",
        markdown: {
          DEFAULT: "var(--color-markdown-h1)",
          h1: "var(--color-markdown-h1)",
          h2: "var(--color-markdown-h2)",
          h3: "var(--color-markdown-h3)",
          h4: "var(--color-markdown-h4)",
          text: "var(--color-markdown-text)",
          link: "var(--color-markdown-link)",
          codebg: "var(--color-markdown-codebg)",
          codetext: "var(--color-markdown-codetext)",
          inlinecodebg: "var(--color-markdown-inlinecodebg)",
          inlinecodetext: "var(--color-markdown-inlinecodetext)",
          blockquote: "var(--color-markdown-blockquote)",
          listmarker: "var(--color-markdown-listmarker)",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)"],
        mono: ["var(--font-mono)"],
      },
      fontSize: {
        xs: "var(--font-size-xs)",
        sm: "var(--font-size-sm)",
        md: "var(--font-size-md)",
        lg: "var(--font-size-lg)",
        xl: "var(--font-size-xl)",
        "2xl": "var(--font-size-2xl)",
        "3xl": "var(--font-size-3xl)",
      },
      lineHeight: {
        tight: "var(--line-height-tight)",
        normal: "var(--line-height-normal)",
        relaxed: "var(--line-height-relaxed)",
      },
      borderRadius: {
        sm: "var(--radius-sm)",
        DEFAULT: "var(--radius-md)",
        md: "var(--radius-md)",
        lg: "var(--radius-lg)",
        xl: "var(--radius-xl)",
        "2xl": "var(--radius-2xl)",
        full: "var(--radius-full)",
      },
      boxShadow: {
        sm: "var(--shadow-sm)",
        DEFAULT: "var(--shadow-md)",
        md: "var(--shadow-md)",
        lg: "var(--shadow-lg)",
        xl: "var(--shadow-xl)",
      },
      backgroundImage: {
        "gradient-light-1": "var(--gradient-light-1)",
        "gradient-light-2": "var(--gradient-light-2)",
        "gradient-accent-1": "var(--gradient-accent-1)",
        "gradient-accent-2": "var(--gradient-accent-2)",
      },
      keyframes: {
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        fadeIn: {
          "0%": { opacity: 0 },
          "100%": { opacity: 1 },
        },
        scaleIn: {
          "0%": { transform: "scale(0.95)", opacity: 0 },
          "100%": { transform: "scale(1)", opacity: 1 },
        },
        slideInUp: {
          "0%": { transform: "translateY(10px)", opacity: 0 },
          "100%": { transform: "translateY(0)", opacity: 1 },
        },
      },
      animation: {
        shimmer: "shimmer 1.5s ease-in-out infinite",
        fadeIn: "fadeIn 0.2s ease-out",
        scaleIn: "scaleIn 0.2s ease-out",
        slideInUp: "slideInUp 0.3s ease-out",
      },
    },
  },
  plugins: [import("@tailwindcss/typography")],
};

export default config;
