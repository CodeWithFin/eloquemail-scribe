import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import Button from '../ui-custom/Button';
import { Menu, X, Settings } from 'lucide-react';

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
    <header 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? 'py-3 bg-white/80 backdrop-blur-lg shadow-sm' : 'py-5 bg-transparent'
      }`}
    >
      <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center">
          <Link to="/" className="flex items-center">
            <span className="text-2xl font-bold text-eloquent-800">
              Email Buddy
              <span className="text-eloquent-500">.</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {!isLoggedIn && navLinks.map((link) => (
              <a
                key={link.name}
                href={link.path}
                className="text-gray-700 hover:text-eloquent-500 transition-colors font-medium"
              >
                {link.name}
              </a>
            ))}
            
            {isLoggedIn ? (
              <div className="flex items-center space-x-4">
                <Link to="/dashboard">
                  <Button variant="ghost">Dashboard</Button>
                </Link>
                <Link to="/compose">
                  <Button>New Email</Button>
                </Link>
                <Link to="/settings" title="Settings">
                  <Button variant="ghost" size="sm" className="p-2">
                    <Settings size={20} />
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link to="/auth">
                  <Button variant="ghost">Sign in</Button>
                </Link>
                <Link to="/auth?signup=true">
                  <Button>Get Started</Button>
                </Link>
              </div>
            )}
          </nav>

          {/* Mobile Menu Button */}
          <button 
            className="md:hidden text-gray-700 hover:text-eloquent-500 transition-colors"
            onClick={toggleMobileMenu}
            aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white shadow-lg animate-fade-in">
          <div className="container mx-auto px-4 py-4">
            <nav className="flex flex-col space-y-4">
              {!isLoggedIn && navLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.path}
                  className="text-gray-700 hover:text-eloquent-500 transition-colors py-2 font-medium"
                >
                  {link.name}
                </a>
              ))}
              
              {isLoggedIn ? (
                <div className="flex flex-col space-y-3 pt-3 border-t border-gray-100">
                  <Link to="/dashboard" className="w-full">
                    <Button variant="ghost" fullWidth>Dashboard</Button>
                  </Link>
                  <Link to="/compose" className="w-full">
                    <Button fullWidth>New Email</Button>
                  </Link>
                  <Link to="/settings" className="w-full">
                    <Button variant="ghost" fullWidth>Settings</Button>
                  </Link>
                </div>
              ) : (
                <div className="flex flex-col space-y-3 pt-3 border-t border-gray-100">
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
