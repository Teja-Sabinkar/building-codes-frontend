// app/auth/layout.js
export const metadata = {
  title: 'Authentication | AI CAD',
  description: 'Authentication for AI CAD application',
};

export default function AuthLayout({ children }) {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <main className="flex-grow flex items-center justify-center py-12">
        {children}
      </main>
      
      <footer className="py-4 text-center text-sm text-gray-500">
        <p>© {new Date().getFullYear()} AI CAD. All rights reserved.</p>
      </footer>
    </div>
  );
}