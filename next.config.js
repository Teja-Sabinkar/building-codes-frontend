/** @type {import('next').NextConfig} */
const nextConfig = {
  // App directory is now stable in Next.js 14
  
  // Webpack configuration for react-pdf
  webpack: (config) => {
    // Handle canvas module for react-pdf
    config.resolve.alias.canvas = false;
    
    // Handle pdfjs-dist worker
    config.resolve.alias['pdfjs-dist/build/pdf.worker.entry'] = 'pdfjs-dist/build/pdf.worker.mjs';
    
    return config;
  },
}

module.exports = nextConfig