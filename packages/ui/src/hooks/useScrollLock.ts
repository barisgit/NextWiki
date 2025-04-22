import { useEffect } from "react";

export function useScrollLock(lock: boolean) {
  useEffect(() => {
    if (!lock) return;

    // Get scrollbar width
    const scrollbarWidth =
      window.innerWidth - document.documentElement.clientWidth;

    // Store original styles
    const originalStyles = {
      overflow: document.body.style.overflow,
      paddingRight: document.body.style.paddingRight,
    };

    // Store original navbar padding
    const navbar = document.querySelector("nav");
    const originalNavbarPadding = navbar?.style.paddingRight;

    // Apply padding to prevent CLS
    document.body.style.overflow = "hidden";
    document.body.style.paddingRight = `${scrollbarWidth}px`;

    // Apply padding to fixed navbar as well
    if (navbar) {
      navbar.style.paddingRight = `${
        scrollbarWidth + (parseInt(getComputedStyle(navbar).paddingRight) || 0)
      }px`;
    }

    return () => {
      // Restore original styles
      document.body.style.overflow = originalStyles.overflow;
      document.body.style.paddingRight = originalStyles.paddingRight;

      // Restore navbar padding
      if (navbar) {
        navbar.style.paddingRight = originalNavbarPadding ?? "";
      }
    };
  }, [lock]);
}
