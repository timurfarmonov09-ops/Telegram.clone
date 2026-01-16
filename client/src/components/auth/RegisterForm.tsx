import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Eye, EyeOff, ArrowRight, Loader2, MessageCircle } from 'lucide-react';
import { RegisterData } from '@/types';

interface RegisterFormProps {
  onSubmit: (userData: RegisterData) => Promise<void>;
  isLoading?: boolean;
  error?: string;
}

interface FormData {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export const RegisterForm: React.FC<RegisterFormProps> = ({ 
  onSubmit, 
  isLoading = false, 
  error 
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    watch,
    reset
  } = useForm<FormData>({
    mode: 'onChange'
  });

  const password = watch('password');

  const handleFormSubmit = async (data: FormData) => {
    try {
      await onSubmit(data);
      reset();
    } catch (error) {
      // Error is handled by parent component
    }
  };

  return (
    <div className="w-full max-w-md mx-auto px-4">
      {/* Logo and Title */}
      <div className="text-center mb-12">
        <div className="w-32 h-32 bg-telegram-blue rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl">
          <MessageCircle className="w-16 h-16 text-white" strokeWidth={1.5} />
        </div>
        <h1 className="text-4xl font-light text-white mb-3">
          Telegram
        </h1>
        <p className="text-gray-400 text-sm">
          Create your account
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl backdrop-blur-sm">
          <p className="text-red-400 text-sm text-center">{error}</p>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-5">
        {/* Username Field */}
        <div>
          <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-2">
            Username
          </label>
          <input
            id="username"
            type="text"
            autoComplete="username"
            className={`w-full px-4 py-3.5 bg-white/5 border ${
              errors.username ? 'border-red-500/50' : 'border-white/10'
            } rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-telegram-blue focus:bg-white/10 transition-all duration-200`}
            placeholder="Choose a username"
            {...register('username', {
              required: 'Username is required',
              minLength: {
                value: 3,
                message: 'Username must be at least 3 characters'
              },
              maxLength: {
                value: 20,
                message: 'Username must be less than 20 characters'
              },
              pattern: {
                value: /^[a-zA-Z0-9_]+$/,
                message: 'Username can only contain letters, numbers, and underscores'
              }
            })}
          />
          {errors.username && (
            <p className="mt-2 text-sm text-red-400">{errors.username.message}</p>
          )}
        </div>

        {/* Email Field */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
            Email Address
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            className={`w-full px-4 py-3.5 bg-white/5 border ${
              errors.email ? 'border-red-500/50' : 'border-white/10'
            } rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-telegram-blue focus:bg-white/10 transition-all duration-200`}
            placeholder="Enter your email"
            {...register('email', {
              required: 'Email is required',
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: 'Please enter a valid email address'
              }
            })}
          />
          {errors.email && (
            <p className="mt-2 text-sm text-red-400">{errors.email.message}</p>
          )}
        </div>

        {/* Password Field */}
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              className={`w-full px-4 py-3.5 bg-white/5 border ${
                errors.password ? 'border-red-500/50' : 'border-white/10'
              } rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-telegram-blue focus:bg-white/10 transition-all duration-200 pr-12`}
              placeholder="Create a password"
              {...register('password', {
                required: 'Password is required',
                minLength: {
                  value: 8,
                  message: 'Password must be at least 8 characters'
                },
                pattern: {
                  value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                  message: 'Password must contain uppercase, lowercase, and number'
                }
              })}
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 pr-4 flex items-center"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-300" />
              ) : (
                <Eye className="h-5 w-5 text-gray-400 hover:text-gray-300" />
              )}
            </button>
          </div>
          {errors.password && (
            <p className="mt-2 text-sm text-red-400">{errors.password.message}</p>
          )}
          {/* Password strength indicator */}
          {password && (
            <div className="mt-3">
              <div className="flex space-x-1">
                <div className={`h-1 w-1/4 rounded-full transition-colors ${password.length >= 8 ? 'bg-telegram-blue' : 'bg-white/10'}`} />
                <div className={`h-1 w-1/4 rounded-full transition-colors ${/[a-z]/.test(password) ? 'bg-telegram-blue' : 'bg-white/10'}`} />
                <div className={`h-1 w-1/4 rounded-full transition-colors ${/[A-Z]/.test(password) ? 'bg-telegram-blue' : 'bg-white/10'}`} />
                <div className={`h-1 w-1/4 rounded-full transition-colors ${/\d/.test(password) ? 'bg-telegram-blue' : 'bg-white/10'}`} />
              </div>
            </div>
          )}
        </div>

        {/* Confirm Password Field */}
        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-2">
            Confirm Password
          </label>
          <div className="relative">
            <input
              id="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              autoComplete="new-password"
              className={`w-full px-4 py-3.5 bg-white/5 border ${
                errors.confirmPassword ? 'border-red-500/50' : 'border-white/10'
              } rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-telegram-blue focus:bg-white/10 transition-all duration-200 pr-12`}
              placeholder="Confirm your password"
              {...register('confirmPassword', {
                required: 'Please confirm your password',
                validate: (value) => value === password || 'Passwords do not match'
              })}
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 pr-4 flex items-center"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              {showConfirmPassword ? (
                <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-300" />
              ) : (
                <Eye className="h-5 w-5 text-gray-400 hover:text-gray-300" />
              )}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="mt-2 text-sm text-red-400">{errors.confirmPassword.message}</p>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={!isValid || isLoading}
          className="w-full mt-8 bg-telegram-blue hover:bg-telegram-blue-dark text-white font-medium py-3.5 px-6 rounded-xl transition-all duration-200 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-telegram-blue/20"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Creating account...
            </>
          ) : (
            <>
              Continue
              <ArrowRight className="w-5 h-5 ml-2" />
            </>
          )}
        </button>
      </form>

      {/* Footer */}
      <div className="mt-12 text-center">
        <p className="text-sm text-gray-400">
          By signing up, you agree to our{' '}
          <a href="#" className="text-telegram-blue hover:underline">
            Terms of Service
          </a>
          {' '}and{' '}
          <a href="#" className="text-telegram-blue hover:underline">
            Privacy Policy
          </a>
        </p>
      </div>
    </div>
  );
};