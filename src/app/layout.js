// app/layout.js
import './globals.css';
import { AuthProvider } from '@/hooks/useAuth';

export const metadata = {
  title: 'RegGPT - AI Building Codes Assistant',
  description: 'Professional AI-powered building regulation consultation for architecture firms. Get instant building code answers with official citations.',
  openGraph: {
    title: 'RegGPT - AI Building Codes Assistant',
    description: 'Professional AI-powered building regulation consultation for architecture firms',
    url: 'https://www.reggpt.uk/',
    siteName: 'RegGPT',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'RegGPT - AI Building Codes Assistant',
      },
    ],
    locale: 'en_GB',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'RegGPT - AI Building Codes Assistant',
    description: 'Professional AI-powered building regulation consultation for architecture firms',
    images: ['/og-image.png'],
  },
  icons: {
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'><rect width='32' height='32' rx='6' fill='%23059669'/><path d='M12 16h8m-8 4h8m2 6H10a2 2 0 01-2-2V8a2 2 0 012-2h6.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V24a2 2 0 01-2 2z' stroke='white' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round' fill='none'/></svg>",
    shortcut: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'><rect width='32' height='32' rx='6' fill='%23059669'/><path d='M12 16h8m-8 4h8m2 6H10a2 2 0 01-2-2V8a2 2 0 012-2h6.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V24a2 2 0 01-2 2z' stroke='white' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round' fill='none'/></svg>",
    apple: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'><rect width='32' height='32' rx='6' fill='%23059669'/><path d='M12 16h8m-8 4h8m2 6H10a2 2 0 01-2-2V8a2 2 0 012-2h6.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V24a2 2 0 01-2 2z' stroke='white' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round' fill='none'/></svg>",
  },
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