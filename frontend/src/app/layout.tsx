import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'DREMS - Defence Recruitment & Eligibility Management System',
  description: 'Institutional Defence Recruitment & Commissioning Portal',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <div className="gov-top-bar">
          <div className="gov-top-bar-inner">
            <span>Defence Recruitment & Commissioning Board</span>
            <span className="gov-classification">
              <span>●</span> Official Portal &bull; Restricted Access
            </span>
          </div>
        </div>
        <main>{children}</main>
        <footer className="gov-footer">
          <div className="gov-footer-inner">
            <div>
              <strong>DREMS</strong> &bull; Defence Recruitment & Eligibility Management System
            </div>
            <div>
              Secured Role-Based Access Control &bull; Official Commissioning Portal
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
