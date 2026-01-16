import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { ArrowRight, Loader2, MessageCircle, Phone, Shield } from 'lucide-react';

interface PhoneLoginFormProps {
  onSubmit: (phoneNumber: string) => Promise<void>;
  isLoading?: boolean;
  error?: string;
}

interface FormData {
  phoneNumber: string;
}

const countryCodes = [
  { code: '+998', country: 'UZ', flag: '🇺🇿' },
  { code: '+7', country: 'RU', flag: '🇷🇺' },
  { code: '+1', country: 'US', flag: '🇺🇸' },
  { code: '+44', country: 'UK', flag: '🇬🇧' },
  { code: '+90', country: 'TR', flag: '🇹🇷' },
];

export const PhoneLoginForm: React.FC<PhoneLoginFormProps> = ({ 
  onSubmit, 
  isLoading = false, 
  error 
}) => {
  const [selectedCountry, setSelectedCountry] = useState(countryCodes[0]);
  const [showCountrySelect, setShowCountrySelect] = useState(false);
  
  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    reset
  } = useForm<FormData>({
    mode: 'onChange'
  });

  const handleFormSubmit = async (data: FormData) => {
    try {
      const fullPhoneNumber = `${selectedCountry.code}${data.phoneNumber}`;
      await onSubmit(fullPhoneNumber);
      reset();
    } catch (error) {
      // Error is handled by parent component
    }
  };

  return (
    <div className="w-full max-w-md mx-auto px-4">
      {/* Logo and Title */}
      <div className="text-center mb-16">
        <div className="w-32 h-32 bg-telegram-blue rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl">
          <MessageCircle className="w-16 h-16 text-white" strokeWidth={1.5} />
        </div>
        <h1 className="text-5xl font-light text-white mb-4">
          Telegram
        </h1>
        <p className="text-gray-400 text-base">
          Sign in to start messaging
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl backdrop-blur-sm animate-fade-in">
          <p className="text-red-400 text-sm text-center">{error}</p>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
        {/* Phone Number Label */}
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-3">
            Phone Number
          </label>
          
          {/* Phone Input Container */}
          <div className="flex gap-3">
            {/* Country Code Selector */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowCountrySelect(!showCountrySelect)}
                className="h-14 px-4 bg-white/5 border border-white/10 rounded-xl text-white hover:bg-white/10 transition-all duration-200 flex items-center gap-2 min-w-[120px]"
              >
                <span className="text-2xl">{selectedCountry.flag}</span>
                <span className="font-medium">{selectedCountry.code}</span>
                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Country Dropdown */}
              {showCountrySelect && (
                <div className="absolute top-full mt-2 w-full bg-[#1a2332] border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden animate-fade-in">
                  {countryCodes.map((country) => (
                    <button
                      key={country.code}
                      type="button"
                      onClick={() => {
                        setSelectedCountry(country);
                        setShowCountrySelect(false);
                      }}
                      className="w-full px-4 py-3 text-left hover:bg-white/5 transition-colors flex items-center gap-3 text-white"
                    >
                      <span className="text-2xl">{country.flag}</span>
                      <span className="font-medium">{country.country}</span>
                      <span className="text-gray-400 ml-auto">{country.code}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Phone Number Input */}
            <div className="flex-1 relative">
              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="tel"
                placeholder="XX XXX XX XX"
                className={`w-full h-14 pl-12 pr-4 bg-white/5 border ${
                  errors.phoneNumber ? 'border-red-500/50' : 'border-white/10'
                } rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-telegram-blue focus:bg-white/10 transition-all duration-200 text-lg`}
                {...register('phoneNumber', {
                  required: 'Phone number is required',
                  pattern: {
                    value: /^[0-9]{9,15}$/,
                    message: 'Please enter a valid phone number'
                  }
                })}
              />
            </div>
          </div>
          
          {errors.phoneNumber && (
            <p className="mt-2 text-sm text-red-400">{errors.phoneNumber.message}</p>
          )}
          
          {/* SMS Notice */}
          <p className="mt-3 text-sm text-gray-400 text-center">
            We will send you a verification code via SMS
          </p>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={!isValid || isLoading}
          className="w-full mt-8 bg-telegram-blue hover:bg-telegram-blue-dark text-white font-medium py-4 px-6 rounded-xl transition-all duration-200 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-telegram-blue/20 text-lg"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Sending code...
            </>
          ) : (
            <>
              Continue
              <ArrowRight className="w-5 h-5 ml-2" />
            </>
          )}
        </button>
      </form>

      {/* End-to-end encrypted badge */}
      <div className="mt-12 flex items-center justify-center gap-2 text-gray-500">
        <Shield className="w-4 h-4" />
        <span className="text-sm">End-to-end encrypted</span>
      </div>

      {/* Footer */}
      <div className="mt-8 text-center">
        <p className="text-sm text-gray-500">
          By signing in, you agree to our{' '}
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