import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { SpotifyPreconnect } from "@/components/SpotifyPreconnect";

export const metadata: Metadata = {
  title: "Galleriii - Curate Your Story",
  description: "Create beautiful galleries to express yourself and showcase your aesthetic.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <SpotifyPreconnect />
      </head>
      <body className="antialiased">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
