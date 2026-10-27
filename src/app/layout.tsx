import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'nekescu - ERP Patrimonial',
  description: 'Sistema de gestión integral para sociedades patrimoniales',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
