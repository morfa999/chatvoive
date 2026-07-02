import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "VoiceAnon — Anonymous Voice Chat",
  description: "Talk to strangers anonymously with real-time voice chat. No accounts, no data stored.",
  keywords: ["anonymous", "voice chat", "random chat", "WebRTC", "strangers"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
