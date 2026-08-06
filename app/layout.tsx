import "./globals.css";
import { Inter } from "next/font/google";
import { AuthProvider } from "@/lib/auth-context";

const inter = Inter({
  subsets: ["latin"],
});

export const metadata = {
  title: "Bazaaric",
  description: "Buy and sell across the Baltics",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className={`
          ${inter.className}
          bg-[#faf8f3]
          text-[#111111]
          antialiased
        `}
      >
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}