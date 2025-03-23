"use client";

import React, { useState } from "react";
import { Moon, Sun, MonitorSmartphone } from "lucide-react";
import { Button } from "~/components/ui/button";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "~/components/ui/popover";
import { useTheme } from "~/providers/theme-provider";

export function ThemeToggle() {
  const [open, setOpen] = useState(false);
  const { theme, setTheme } = useTheme();

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          size="icon"
          variant="ghost"
          className="h-9 w-9"
          aria-label="Toggle theme"
        >
          <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="center"
        side="bottom"
        className="w-auto p-0 rounded-lg"
      >
        <div className="flex items-center gap-1">
          <Button
            variant={theme === "light" ? "solid" : "ghost"}
            size="sm"
            onClick={() => {
              setTheme("light");
              setOpen(false);
            }}
            className="justify-center flex-1"
            color={theme === "light" ? "primary" : "neutral"}
            aria-label="Light Mode"
          >
            <Sun className="w-4 h-4" />
            <span className="sr-only md:not-sr-only md:ml-2">Light</span>
          </Button>

          <Button
            variant={theme === "system" ? "solid" : "ghost"}
            size="sm"
            onClick={() => {
              setTheme("system");
              setOpen(false);
            }}
            className="justify-center flex-1"
            color={theme === "system" ? "primary" : "neutral"}
            aria-label="System Theme"
          >
            <MonitorSmartphone className="w-4 h-4" />
            <span className="sr-only md:not-sr-only md:ml-2">Auto</span>
          </Button>

          <Button
            variant={theme === "dark" ? "solid" : "ghost"}
            size="sm"
            onClick={() => {
              setTheme("dark");
              setOpen(false);
            }}
            className="justify-center flex-1"
            color={theme === "dark" ? "primary" : "neutral"}
            aria-label="Dark Mode"
          >
            <Moon className="w-4 h-4" />
            <span className="sr-only md:not-sr-only md:ml-2">Dark</span>
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export default ThemeToggle;
