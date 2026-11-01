import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'DREMS - Defence Recruitment System',
  description: 'Defence Recruitment and Eligibility Management System',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <main>{children}</main>
      </body>
    </html>
  );
}
