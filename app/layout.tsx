import "./globals.css";

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
      <body className="bg-white text-gray-900 antialiased">
        {children}
      </body>
    </html>
  );
}