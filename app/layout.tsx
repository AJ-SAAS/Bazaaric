import "./globals.css";
import { Inter } from "next/font/google";
import { AuthProvider } from "@/lib/auth-context";
import Footer from "@/components/layout/Footer";
import { NextIntlClientProvider } from "next-intl";
import { getLocale } from "@/lib/i18n";

const inter = Inter({
  subsets: ["latin"],
});

export const metadata = {
  title: "Bazaaric",
  description: "Buy and sell across the Baltics",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();
  const messages = (await import(`@/messages/${locale}.json`)).default;

  return (
    <html lang={locale}>
      <body
        className={`
          ${inter.className}
          bg-[#faf8f3]
          text-[#111111]
          antialiased
          flex
          min-h-screen
          flex-col
        `}
      >
        <NextIntlClientProvider locale={locale} messages={messages}>
          <AuthProvider>
            <div className="flex-1">{children}</div>
            <Footer />
          </AuthProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}