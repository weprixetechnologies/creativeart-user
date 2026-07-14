import { Playfair_Display, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import ReferralTracker from "../components/ReferralTracker";
import LoginModal from "../components/LoginModal";

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

export const metadata = {
  title: "Creative Art by Tannu | Thoughtful Gifts for Every Moment",
  description: "Bespoke flower preservations, custom engraved keychains, and handmade frames. Ship your wedding flowers to preserve them forever or book customized gifts.",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${playfair.variable} ${plusJakarta.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col text-slate-800 bg-white font-sans">
        <ReferralTracker />
        {children}
        <LoginModal />
      </body>
    </html>
  );
}

