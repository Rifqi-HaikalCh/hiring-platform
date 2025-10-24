import { Heart, Github, Linkedin, Mail } from 'lucide-react'

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="mt-auto border-t border-gray-200 bg-white/80 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold bg-gradient-to-r from-teal-600 to-sky-600 bg-clip-text text-transparent">
              Hiring Platform
            </h3>
            <p className="text-sm text-gray-600">
              Modern recruitment platform connecting talented individuals with great opportunities.
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-gray-900">Quick Links</h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>
                <a href="/" className="hover:text-teal-600 transition-colors">Home</a>
              </li>
              <li>
                <a href="/dashboard" className="hover:text-teal-600 transition-colors">Dashboard</a>
              </li>
              <li>
                <a href="/dashboard/applications" className="hover:text-teal-600 transition-colors">My Applications</a>
              </li>
            </ul>
          </div>

          {/* Social Links */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-gray-900">Connect</h4>
            <div className="flex gap-3">
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-teal-100 hover:text-teal-600 transition-all duration-200"
                aria-label="GitHub"
              >
                <Github className="h-5 w-5" />
              </a>
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-teal-100 hover:text-teal-600 transition-all duration-200"
                aria-label="LinkedIn"
              >
                <Linkedin className="h-5 w-5" />
              </a>
              <a
                href="mailto:contact@example.com"
                className="p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-teal-100 hover:text-teal-600 transition-all duration-200"
                aria-label="Email"
              >
                <Mail className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-gray-600">
            <p>
              © {currentYear} Hiring Platform. All rights reserved.
            </p>
            <p className="flex items-center gap-1">
              Crafted with <Heart className="h-4 w-4 text-red-500 fill-red-500 animate-pulse" /> by{' '}
              <span className="font-bold bg-gradient-to-r from-teal-600 to-sky-600 bg-clip-text text-transparent">
                Your Name
              </span>
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}
