import type {Metadata} from 'next';
import Script from "next/script";
import { Suspense } from "react";
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { NavigationLoaderProvider, RouteReadySignal } from "@/components/navigation-loader";

export const metadata: Metadata = {
  title: 'EasyStock',
  description: 'Sistema de Almoxarifado',
};

const chunkLoadRecoveryScript = `
(() => {
  const reloadFlag = "easystock:chunk-load-recovery";
  const isChunkLoadError = (error) => {
    if (!error) return false;
    const text = error instanceof Error
      ? error.name + " " + error.message
      : typeof error === "string"
        ? error
        : String(error);

    return /ChunkLoadError|Loading chunk \\d+ failed|failed to fetch dynamically imported module/i.test(text);
  };

  const reloadOnce = () => {
    try {
      if (sessionStorage.getItem(reloadFlag) === "1") return;
      sessionStorage.setItem(reloadFlag, "1");
    } catch (_) {
      return;
    }

    window.location.reload();
  };

  window.setTimeout(() => {
    try {
      sessionStorage.removeItem(reloadFlag);
    } catch (_) {}
  }, 10000);

  window.addEventListener("error", (event) => {
    if (isChunkLoadError(event.error) || isChunkLoadError(event.message)) {
      reloadOnce();
    }
  });

  window.addEventListener("unhandledrejection", (event) => {
    if (isChunkLoadError(event.reason)) {
      reloadOnce();
    }
  });
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter&display=swap" rel="stylesheet"></link>
      </head>
      <body className="font-body antialiased">
        <Script id="chunk-load-recovery" strategy="beforeInteractive">
          {chunkLoadRecoveryScript}
        </Script>
        <NavigationLoaderProvider>
          {children}
          <Suspense fallback={null}>
            <RouteReadySignal />
          </Suspense>
          <Toaster />
        </NavigationLoaderProvider>
      </body>
    </html>
  );
}
