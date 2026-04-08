import type {Metadata} from 'next';
import { Suspense } from "react";
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { NavigationLoaderProvider, RouteReadySignal } from "@/components/navigation-loader";

export const metadata: Metadata = {
  title: 'EasyStock',
  description: 'Sistema de Almoxarifado',
};

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
