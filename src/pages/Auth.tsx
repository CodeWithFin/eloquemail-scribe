import React from 'react';
import AuthForm from '../components/auth/AuthForm';
import { Sparkles } from 'lucide-react';

const Auth = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
        {/* Hero/branding section */}
        <div className="w-full md:w-1/2 bg-eloquent-500 p-8 md:p-12 flex flex-col justify-center relative overflow-hidden">
          <div className="relative z-10">
            <a href="/" className="inline-block mb-12">
              <h1 className="text-3xl font-bold text-white">
                Eloquent<span className="text-eloquent-200">.</span>
              </h1>
            </a>
            
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6 leading-tight">
              Craft perfect emails <br />with AI assistance
            </h2>
            
            <p className="text-eloquent-100 text-lg mb-8 max-w-md">
              Write better emails in less time with intelligent suggestions, perfect grammar, and tone adjustment.
            </p>
            
            <div className="flex items-center space-x-3 text-white">
              <div className="flex -space-x-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="w-8 h-8 rounded-full bg-eloquent-400 border-2 border-eloquent-500 flex items-center justify-center">
                    <span className="text-xs font-medium">{i}</span>
                  </div>
                ))}
              </div>
              <p className="text-sm">
                <span className="font-medium">3,000+</span> professionals saving time every day
              </p>
            </div>
          </div>
          
          {/* Abstract shapes in background */}
          <div className="absolute top-[-10%] right-[-10%] w-[70%] h-[70%] rounded-full bg-eloquent-400 opacity-30 blur-3xl animate-float"></div>
          <div className="absolute bottom-[-15%] left-[-5%] w-[50%] h-[50%] rounded-full bg-eloquent-600 opacity-20 blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>
        </div>
        
        {/* Auth form section */}
        <div className="w-full md:w-1/2 flex items-center justify-center p-8 md:p-12 bg-gray-50 dark:bg-gray-900 relative overflow-hidden">
          <div className="w-full max-w-md">
            <AuthForm />
          </div>
          
          <div className="absolute bottom-4 left-0 right-0 text-center text-sm text-gray-500">
            <div className="flex items-center justify-center mb-2">
              <Sparkles size={16} className="text-eloquent-500 mr-1" />
              <span>Powered by advanced AI technology</span>
            </div>
            <p>©{new Date().getFullYear()} Eloquent. All rights reserved.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
