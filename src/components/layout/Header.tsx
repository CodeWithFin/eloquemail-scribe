import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import Button from '../ui-custom/Button';
import { Menu, X, Settings, Sparkles } from 'lucide-react';
import { ThemeToggle } from '../ui/theme-toggle';

const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  const isAuthPage = location.pathname === '/auth';

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Features', path: '/#features' },
    { name: 'Pricing', path: '/#pricing' },
    { name: 'About', path: '/#about' }
  ];

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  // Close mobile menu when changing routes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location]);

  if (isAuthPage) return null;

  const isLoggedIn = location.pathname.includes('/dashboard') || 
                    location.pathname.includes('/compose');

  return (
    <header className={`fixed w-full z-50 transition-all duration-300 ${isScrolled ? 'bg-white/90 dark:bg-gray-900/90 backdrop-blur-md shadow-sm' : 'bg-transparent'}`}>
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to={isLoggedIn ? '/dashboard' : '/'} className="flex items-center">
            <span className="text-2xl font-bold text-eloquent-500">Email <span className="text-gray-900 dark:text-white">Buddy</span></span>
          </Link>
          
          {/* Desktop navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            {!isLoggedIn && navLinks.map((link) => (
              <a
                key={link.name}
                href={link.path}
                className="text-gray-700 dark:text-gray-300 hover:text-eloquent-500 dark:hover:text-eloquent-400 transition-colors"
              >
                {link.name}
              </a>
            ))}
            
            <div className="flex items-center space-x-2 pl-4 border-l border-gray-200 dark:border-gray-800">
              <ThemeToggle />
              
              {isLoggedIn ? (
                <div className="flex items-center space-x-2">
                  <Link to="/dashboard">
                    <Button variant="ghost" size="sm">Dashboard</Button>
                  </Link>
                  <Link to="/compose">
                    <Button size="sm">New Email</Button>
                  </Link>
                  <Link to="/ai-tools">
                    <Button variant="ghost" size="sm">
                      <Sparkles className="h-4 w-4 mr-1" />
                      AI Tools
                    </Button>
                  </Link>
                  <Link to="/settings">
                    <Button variant="ghost" size="sm" className="p-2 ml-2">
                      <Settings className="h-5 w-5" />
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <Link to="/auth">
                    <Button variant="ghost" size="sm">Sign in</Button>
                  </Link>
                  <Link to="/auth?signup=true">
                    <Button size="sm">Get Started</Button>
                  </Link>
                </div>
              )}
            </div>
          </nav>
          
          {/* Mobile menu button */}
          <div className="flex items-center md:hidden space-x-4">
            <ThemeToggle />
            <button
              onClick={toggleMobileMenu}
              className="text-gray-700 dark:text-gray-300 hover:text-eloquent-500 dark:hover:text-eloquent-400"
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>
      
      {/* Mobile navigation menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white dark:bg-gray-900 shadow-lg animate-fade-in overflow-hidden">
          <div className="container mx-auto px-4 py-4">
            <nav className="flex flex-col space-y-4">
              {!isLoggedIn && navLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.path}
                  className="text-gray-700 dark:text-gray-300 hover:text-eloquent-500 dark:hover:text-eloquent-400 transition-colors py-2 font-medium"
                >
                  {link.name}
                </a>
              ))}
              
              {isLoggedIn ? (
                <div className="flex flex-col space-y-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                  <Link to="/dashboard" className="w-full">
                    <Button variant="ghost" fullWidth>Dashboard</Button>
                  </Link>
                  <Link to="/compose" className="w-full">
                    <Button fullWidth>New Email</Button>
                  </Link>
                  <Link to="/ai-tools" className="w-full">
                    <Button variant="ghost" fullWidth>
                      <Sparkles className="h-4 w-4 mr-1" />
                      AI Tools
                    </Button>
                  </Link>
                  <Link to="/settings" className="w-full">
                    <Button variant="ghost" fullWidth>Settings</Button>
                  </Link>
                </div>
              ) : (
                <div className="flex flex-col space-y-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                  <Link to="/auth" className="w-full">
                    <Button variant="ghost" fullWidth>Sign in</Button>
                  </Link>
                  <Link to="/auth?signup=true" className="w-full">
                    <Button fullWidth>Get Started</Button>
                  </Link>
                </div>
              )}
            </nav>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
