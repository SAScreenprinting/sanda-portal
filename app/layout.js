import { Geist, Geist_Mono, Sora, DM_Sans } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const sora = Sora({ variable: "--font-sora", subsets: ["latin"], weight: ["500", "600", "700", "800"] });
const dmSans = DM_Sans({ variable: "--font-dm", subsets: ["latin"] });

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "S&A Screen Printing — Client Portal",
  description: "Track orders, upload artwork, and stay connected with your production team.",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${sora.variable} ${dmSans.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
