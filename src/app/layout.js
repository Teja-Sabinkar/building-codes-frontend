// app/layout.js
import './globals.css';
import { AuthProvider } from '@/hooks/useAuth';

export const metadata = {
  title: 'AI CAD',
  description: 'AI-powered CAD application for 2D architectural floor plans',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}