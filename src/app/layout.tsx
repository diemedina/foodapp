import type { Metadata, Viewport } from "next";
import { Nunito_Sans } from "next/font/google";
import { ToastProvider } from "@/components/toast";
import "./globals.css";

const nunito = Nunito_Sans({
  variable: "--font-nunito",
  subsets: ["latin"],
  weight: ["400", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "Organizador de comidas",
  description: "Planificá las comidas de la semana y armá la lista del súper.",
  appleWebApp: { capable: true, title: "Comidas", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  themeColor: "#FFF7EE",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className={`${nunito.variable} antialiased`}>
      <body className="min-h-dvh font-sans text-ink">
        <Backdrop />
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}

/** Manchas pastel difuminadas detrás del vidrio. */
function Backdrop() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-cream">
      <div className="absolute -left-28 -top-16 size-80 rounded-full bg-[#FFCF99] opacity-85 blur-[60px]" />
      <div className="absolute -right-32 top-48 size-72 rounded-full bg-[#FFE3C2] opacity-90 blur-[60px]" />
      <div className="absolute -left-24 top-[470px] size-80 rounded-full bg-[#C4F0D6] opacity-85 blur-[64px]" />
      <div className="absolute -bottom-16 -right-24 size-64 rounded-full bg-[#FFD9A8] opacity-90 blur-[60px]" />
    </div>
  );
}
