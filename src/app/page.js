// app/page.js
import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-blue-500 rounded-md flex items-center justify-center mr-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
              </svg>
            </div>
            <span className="text-xl font-bold text-gray-800">AI CAD</span>
          </div>
          <div>
            <Link 
              href="/auth/login" 
              className="inline-block bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md mr-2"
            >
              Log In
            </Link>
            <Link 
              href="/auth/signup" 
              className="inline-block bg-white hover:bg-gray-100 text-blue-500 font-bold py-2 px-4 rounded-md border border-blue-500"
            >
              Sign Up
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-grow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="lg:grid lg:grid-cols-2 lg:gap-8 items-center">
            <div>
              <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 tracking-tight mb-4">
                Design Floor Plans with AI
              </h1>
              <p className="text-xl text-gray-600 mb-8">
                Create professional 2D architectural floor plans using natural language. 
                Simply describe what you want, and our AI will generate a detailed floor plan 
                that you can customize with our CAD tools.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link 
                  href="/auth/signup" 
                  className="inline-block bg-blue-500 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-md text-center"
                >
                  Get Started for Free
                </Link>
                <a 
                  href="#how-it-works" 
                  className="inline-block bg-white hover:bg-gray-100 text-gray-800 font-bold py-3 px-6 rounded-md border border-gray-300 text-center"
                >
                  Learn How It Works
                </a>
              </div>
            </div>
            <div className="mt-10 lg:mt-0">
              <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-200">
                {/* Placeholder for floor plan preview */}
                <div className="aspect-w-16 aspect-h-9 bg-gray-100 rounded-md flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 3h18v18H3V3z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 3v18M15 3v18" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 9h18M3 15h18" />
                  </svg>
                </div>
                <div className="mt-4">
                  <div className="text-gray-700 text-sm">
                    <p className="font-medium">Example prompt:</p>
                    <p className="italic mt-1">"Create a 3-bedroom house with an open kitchen, living room, and a home office."</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center text-sm text-gray-500">
            <p>© {new Date().getFullYear()} AI CAD. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}