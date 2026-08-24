import type { ReactNode } from "react";
import "./globals.css";

export const metadata = {
  title: "Revenue Rescuer — AI Revenue Recovery",
  description: "An AI agent that recovers abandoned checkouts for Razorpay merchants.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Manrope:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-ink text-cream font-body antialiased">
        {children}
      </body>
    </html>
  );
}