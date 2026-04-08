"use client";

import * as React from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";

type NavigationLoaderContextValue = {
  startLoading: () => void;
  stopLoading: () => void;
};

const NavigationLoaderContext = React.createContext<NavigationLoaderContextValue | null>(null);

function isInternalNavigation(target: HTMLAnchorElement) {
  if (!target.href) {
    return false;
  }

  const url = new URL(target.href, window.location.href);

  if (url.origin !== window.location.origin) {
    return false;
  }

  if (target.target === "_blank" || target.hasAttribute("download")) {
    return false;
  }

  return `${url.pathname}${url.search}` !== `${window.location.pathname}${window.location.search}`;
}

export function NavigationLoaderProvider({ children }: { children: React.ReactNode }) {
  const [isVisible, setIsVisible] = React.useState(false);

  const value = React.useMemo(
    () => ({
      startLoading: () => setIsVisible(true),
      stopLoading: () => setIsVisible(false),
    }),
    []
  );

  React.useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0) {
        return;
      }

      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
        return;
      }

      const target = event.target;

      if (!(target instanceof Element)) {
        return;
      }

      const anchor = target.closest("a");

      if (!(anchor instanceof HTMLAnchorElement)) {
        return;
      }

      if (!isInternalNavigation(anchor)) {
        return;
      }

      setIsVisible(true);
    };

    const handlePopState = () => {
      setIsVisible(true);
    };

    document.addEventListener("click", handleClick, true);
    window.addEventListener("popstate", handlePopState);

    return () => {
      document.removeEventListener("click", handleClick, true);
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  return (
    <NavigationLoaderContext.Provider value={value}>
      {children}
      {isVisible ? (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/25 backdrop-blur-[2px]">
          <Loader2 className="h-10 w-10 animate-spin text-white" />
        </div>
      ) : null}
    </NavigationLoaderContext.Provider>
  );
}

export function RouteReadySignal() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const context = React.useContext(NavigationLoaderContext);

  React.useEffect(() => {
    if (!context) {
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      context.stopLoading();
    });

    return () => window.cancelAnimationFrame(frame);
  }, [context, pathname, searchParams]);

  return null;
}

export function useNavigationLoader() {
  return React.useContext(NavigationLoaderContext);
}
