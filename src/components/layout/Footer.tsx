
import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  
  const footerLinks = [
    {
      title: 'Product',
      links: [
        { name: 'Features', path: '/#features' },
        { name: 'Pricing', path: '/#pricing' },
        { name: 'Roadmap', path: '/#roadmap' },
      ]
    },
    {
      title: 'Company',
      links: [
        { name: 'About', path: '/#about' },
        { name: 'Blog', path: '/blog' },
        { name: 'Careers', path: '/careers' },
      ]
    },
    {
      title: 'Resources',
      links: [
        { name: 'Documentation', path: '/docs' },
        { name: 'Help Center', path: '/help' },
        { name: 'Community', path: '/community' },
      ]
    },
    {
      title: 'Legal',
      links: [
        { name: 'Privacy', path: '/privacy' },
        { name: 'Terms', path: '/terms' },
        { name: 'Security', path: '/security' },
      ]
    }
  ];

  return (
    <footer className="bg-gray-50 py-12 mt-20">
      <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {footerLinks.map((section) => (
            <div key={section.title}>
              <h4 className="font-semibold text-gray-900 mb-4 text-sm">{section.title}</h4>
              <ul className="space-y-2">
                {section.links.map((link) => (
                  <li key={link.name}>
                    <a 
                      href={link.path} 
                      className="text-gray-600 hover:text-eloquent-500 transition-colors text-sm"
                    >
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        
        <div className="mt-12 pt-8 border-t border-gray-200 flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center mb-4 md:mb-0">
            <Link to="/" className="flex items-center">
              <span className="text-xl font-bold text-gray-900">
                Email Buddy<span className="text-eloquent-500">.</span>
              </span>
            </Link>
          </div>
          
          <div className="text-gray-500 text-sm">
            © {currentYear} Email Buddy. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
