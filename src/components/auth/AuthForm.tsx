
import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Mail, Lock, ArrowRight, GitHub, Sparkles } from 'lucide-react';
import Button from '../ui-custom/Button';
import Glass from '../ui-custom/Glass';
import { useToast } from "@/hooks/use-toast";

const AuthForm = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isSignUp = searchParams.get('signup') === 'true';
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
  });
  
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      // In a real app, this would connect to an auth service
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Show success message
      toast({
        title: isSignUp ? "Account created!" : "Welcome back!",
        description: isSignUp 
          ? "Your account has been created successfully." 
          : "You've been signed in successfully.",
      });
      
      // Redirect to dashboard
      navigate('/dashboard');
    } catch (error) {
      toast({
        title: "Authentication error",
        description: "There was a problem with authentication. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = () => {
    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      toast({
        title: "Demo mode activated",
        description: "You've been signed in with a demo account.",
      });
      navigate('/dashboard');
      setIsLoading(false);
    }, 1000);
  };

  return (
    <Glass 
      className="w-full max-w-md p-8 mx-auto overflow-hidden animate-scale-in"
      opacity="light"
      blur="lg"
    >
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900">
          {isSignUp ? 'Create your account' : 'Welcome back'}
        </h2>
        <p className="text-gray-600 mt-2">
          {isSignUp 
            ? 'Start crafting perfect emails with AI' 
            : 'Sign in to continue to your account'}
        </p>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-5">
        {isSignUp && (
          <div className="space-y-1">
            <label htmlFor="name" className="text-sm font-medium text-gray-700">
              Full Name
            </label>
            <div className="relative">
              <input
                id="name"
                name="name"
                type="text"
                required={isSignUp}
                value={formData.name}
                onChange={handleChange}
                className="w-full pl-3 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-eloquent-400 focus:border-transparent"
                placeholder="John Doe"
              />
            </div>
          </div>
        )}
        
        <div className="space-y-1">
          <label htmlFor="email" className="text-sm font-medium text-gray-700">
            Email
          </label>
          <div className="relative">
            <input
              id="email"
              name="email"
              type="email"
              required
              value={formData.email}
              onChange={handleChange}
              className="w-full pl-3 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-eloquent-400 focus:border-transparent"
              placeholder="you@example.com"
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-3">
              <Mail size={18} className="text-gray-400" />
            </div>
          </div>
        </div>
        
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <label htmlFor="password" className="text-sm font-medium text-gray-700">
              Password
            </label>
            {!isSignUp && (
              <a href="#" className="text-sm text-eloquent-600 hover:text-eloquent-500">
                Forgot password?
              </a>
            )}
          </div>
          <div className="relative">
            <input
              id="password"
              name="password"
              type="password"
              required
              value={formData.password}
              onChange={handleChange}
              className="w-full pl-3 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-eloquent-400 focus:border-transparent"
              placeholder="••••••••"
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-3">
              <Lock size={18} className="text-gray-400" />
            </div>
          </div>
        </div>

        <Button 
          type="submit" 
          fullWidth 
          loading={isLoading}
          iconRight={<ArrowRight size={18} />}
        >
          {isSignUp ? 'Create account' : 'Sign in'}
        </Button>
      </form>
      
      <div className="mt-6">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">Or continue with</span>
          </div>
        </div>
        
        <div className="mt-6 grid grid-cols-2 gap-3">
          <Button 
            type="button" 
            variant="secondary"
            iconLeft={<GitHub size={18} />}
            fullWidth
            onClick={() => toast({
              title: "GitHub Sign In",
              description: "GitHub authentication is not implemented in this demo."
            })}
          >
            GitHub
          </Button>
          <Button 
            type="button" 
            variant="outline"
            iconLeft={<Sparkles size={18} className="text-eloquent-500" />}
            fullWidth
            onClick={handleDemoLogin}
          >
            Try Demo
          </Button>
        </div>
      </div>
      
      <div className="mt-8 text-center">
        <p className="text-sm text-gray-600">
          {isSignUp 
            ? 'Already have an account?' 
            : 'Don\'t have an account?'} 
          <a 
            href={isSignUp ? '/auth' : '/auth?signup=true'} 
            className="font-medium text-eloquent-600 hover:text-eloquent-500 ml-1"
          >
            {isSignUp ? 'Sign in' : 'Sign up'}
          </a>
        </p>
      </div>
    </Glass>
  );
};

export default AuthForm;
