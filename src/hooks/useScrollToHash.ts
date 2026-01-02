import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export function useScrollToHash() {
  const { hash, pathname } = useLocation();

  useEffect(() => {
    if (hash) {
      // Small timeout to ensure DOM is ready after navigation
      setTimeout(() => {
        const element = document.getElementById(hash.slice(1));
        if (element) {
          const navbarHeight = 80;
          const elementPosition = element.getBoundingClientRect().top;
          const offsetPosition = elementPosition + window.scrollY - navbarHeight;
          
          window.scrollTo({
            top: offsetPosition,
            behavior: "smooth"
          });
        }
      }, 100);
    } else if (pathname === "/") {
      // Scroll to top when navigating to home without hash
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [hash, pathname]);
}
