import type {Metadata} from 'next';
import { GeistSans } from 'geist/font/sans';
// import { GeistMono } from 'geist/font/mono'; // Removed as it's not used
import './globals.css';
import { Toaster } from "@/components/ui/toaster";

const geistSans = GeistSans;
// const geistMono = GeistMono; // Removed as it's not used

export const metadata: Metadata = {
  title: 'ModelVerse',
  description: 'Import, view, and customize 3D models with Babylon.js',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} antialiased`}> {/* Removed geistMono.variable */}
        {children}
        <Toaster />
      </body>
    </html>
  );
}
