import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Mail, Sparkles, Zap, Search, BarChart4 } from 'lucide-react';
import Header from '../components/layout/Header';
import Button from '../components/ui-custom/Button';
import Glass from '../components/ui-custom/Glass';
import Footer from '../components/layout/Footer';

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900 overflow-hidden">
      <Header />
      
      {/* Hero Section */}
      <section className="pt-32 pb-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <div>
              <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-gray-100 leading-tight">
                Create Perfect Emails with <span className="text-eloquent-500">AI</span> Assistance
              </h1>
              <p className="mt-6 text-xl text-gray-600 dark:text-gray-300">
                Email Buddy helps you write professional, engaging emails in seconds with advanced AI technology.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <Link to="/auth?signup=true">
                <Button 
                  iconRight={<ArrowRight size={18} />}
                  size="lg"
                >
                  Get Started
                </Button>
              </Link>
              <Link to="/auth">
                <Button 
                  variant="secondary"
                  size="lg"
                >
                  Sign In
                </Button>
              </Link>
            </div>
          </div>
          
          <div className="relative max-w-full">
            <Glass 
              className="p-6 rounded-2xl shadow-xl transform lg:translate-x-0"
              opacity="medium"
              blur="xl"
            >
              <div className="bg-gray-900/5 dark:bg-gray-300/5 p-4 rounded-xl">
                <div className="space-y-4">
                  <div className="h-12 flex items-center px-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                    <Mail className="text-eloquent-500 mr-3" size={20} />
                    <span className="text-gray-600 dark:text-gray-300">Write a professional email to...</span>
                  </div>
                  <div className="space-y-2">
                    <div className="h-4 w-full bg-white dark:bg-gray-800 rounded-full shadow-sm"></div>
                    <div className="h-4 w-3/4 bg-white dark:bg-gray-800 rounded-full shadow-sm"></div>
                    <div className="h-4 w-5/6 bg-white dark:bg-gray-800 rounded-full shadow-sm"></div>
                    <div className="h-4 w-2/3 bg-white dark:bg-gray-800 rounded-full shadow-sm"></div>
                  </div>
                  <div className="flex justify-end">
                    <div className="h-10 w-32 bg-eloquent-500 rounded-lg shadow-sm"></div>
                  </div>
                </div>
              </div>
            </Glass>
            <div className="absolute -top-6 -right-6 transform rotate-12">
              <Sparkles className="text-eloquent-400" size={32} />
            </div>
          </div>
        </div>
      </section>
      
      {/* Features Section */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Why Choose Email Buddy</h2>
          <p className="mt-4 text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Our AI-powered platform helps you craft perfect emails faster than ever
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8">
          <FeatureCard 
            icon={<Sparkles className="text-eloquent-500" size={24} />}
            title="AI-Powered Writing"
            description="Get intelligent suggestions, grammar corrections, and tone adjustments as you write."
          />
          <FeatureCard 
            icon={<Search className="text-eloquent-500" size={24} />}
            title="Smart Search"
            description="Find any email instantly with our powerful semantic search technology."
          />
          <FeatureCard 
            icon={<BarChart4 className="text-eloquent-500" size={24} />}
            title="Email Analytics"
            description="Track performance with detailed analytics on opens, replies, and engagement."
          />
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <Glass 
          className="p-12 rounded-3xl text-center"
          opacity="light"
          blur="xl"
        >
          <div className="max-w-3xl mx-auto space-y-8">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              Ready to transform your email communication?
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              Join thousands of professionals using Email Buddy to save time and write better emails.
            </p>
            <Link to="/auth?signup=true">
              <Button 
                size="lg"
                iconRight={<ArrowRight size={18} />}
              >
                Start Writing Better Emails
              </Button>
            </Link>
          </div>
        </Glass>
      </section>
      
      <Footer />
    </div>
  );
};

const FeatureCard = ({ icon, title, description }) => {
  return (
    <Glass 
      className="p-6 rounded-xl h-full"
      opacity="light"
      blur="lg"
    >
      <div className="space-y-4">
        <div className="bg-eloquent-50 dark:bg-eloquent-950/30 p-3 rounded-lg w-fit">
          {icon}
        </div>
        <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
        <p className="text-gray-600 dark:text-gray-300">{description}</p>
      </div>
    </Glass>
  );
};

export default Index;
