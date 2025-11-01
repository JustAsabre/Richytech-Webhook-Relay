import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';
import { ShootingStars } from '../components/ui/shooting-stars';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const slides = [
    {
      title: "Welcome to your new dashboard",
      subtitle: "Sign in to explore changes we've made."
    },
    {
      title: "Track your webhook activity",
      subtitle: "Monitor deliveries with real-time analytics and insights."
    },
    {
      title: "Powerful integrations",
      subtitle: "Connect your webhooks with ease and reliability."
    },
    {
      title: "Get started today",
      subtitle: "Join thousands of developers already using Webhook Relay."
    }
  ];

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error('Please fill in all fields');
      return;
    }

    setLoading(true);

    try {
      await login({ email, password });
      toast.success('Login successful!');
      navigate('/dashboard');
    } catch (error: unknown) {
      const message = (error as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message || 'Login failed. Please try again.';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-950">
      {/* Left Panel - Login Form */}
      <div className="w-full lg:w-1/2 relative overflow-hidden">
        {/* Shooting Stars Background */}
        <div className="absolute inset-0 bg-gray-950">
          {/* Static Stars Background */}
          <div 
            className="absolute inset-0 opacity-60"
            style={{
              backgroundImage: `
                radial-gradient(2px 2px at 20px 30px, white, transparent),
                radial-gradient(2px 2px at 60px 70px, white, transparent),
                radial-gradient(1px 1px at 50px 50px, white, transparent),
                radial-gradient(1px 1px at 130px 80px, white, transparent),
                radial-gradient(2px 2px at 90px 10px, white, transparent),
                radial-gradient(1px 1px at 160px 120px, white, transparent),
                radial-gradient(2px 2px at 20px 150px, white, transparent),
                radial-gradient(1px 1px at 90px 160px, white, transparent),
                radial-gradient(2px 2px at 140px 30px, white, transparent),
                radial-gradient(1px 1px at 30px 100px, white, transparent)
              `,
              backgroundSize: '200px 200px',
              backgroundRepeat: 'repeat',
              animation: 'twinkle 3s ease-in-out infinite'
            }}
          />
          <style>{`
            @keyframes twinkle {
              0%, 100% { opacity: 0.6; }
              50% { opacity: 1; }
            }
          `}</style>
          
          {/* Shooting Stars */}
          <ShootingStars
            starColor="#a855f7"
            trailColor="#8b5cf6"
            minSpeed={15}
            maxSpeed={35}
            minDelay={800}
            maxDelay={2000}
            starWidth={15}
            starHeight={2}
          />
          <ShootingStars
            starColor="#8b5cf6"
            trailColor="#6366f1"
            minSpeed={10}
            maxSpeed={25}
            minDelay={1500}
            maxDelay={3000}
            starWidth={12}
            starHeight={2}
          />
          <ShootingStars
            starColor="#6366f1"
            trailColor="#3b82f6"
            minSpeed={20}
            maxSpeed={40}
            minDelay={1000}
            maxDelay={2500}
            starWidth={18}
            starHeight={2}
          />
        </div>
        <div className="relative z-10 flex items-center justify-center p-8 h-full">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-md"
          >
          {/* Logo */}
          <div className="flex items-center gap-3 mb-8">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-purple-600"></div>
            <h1 className="text-xl font-semibold text-white">Webhook Relay</h1>
          </div>

          {/* Glassmorphic Container */}
          <div className="backdrop-blur-2xl bg-white/[0.02] border border-white/20 rounded-3xl p-8 shadow-[0_8px_32px_0_rgba(255,255,255,0.1)] relative overflow-hidden">
            {/* Glossy overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent rounded-3xl pointer-events-none"></div>
            <div className="relative z-10">
          {/* Login Form */}
          <div>
            <h2 className="text-3xl font-semibold text-white mb-2">Log in</h2>
            <p className="text-gray-400 mb-8">Welcome back! Please enter your details.</p>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email Input */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  Email
                </label>
                <input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  className="w-full px-3.5 py-2.5 bg-gray-900 border border-gray-800 text-white placeholder-gray-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              {/* Password Input */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                    className="w-full px-3.5 py-2.5 bg-gray-900 border border-gray-800 text-white placeholder-gray-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 border-2 border-gray-700 bg-gray-900 rounded cursor-pointer accent-purple-600"
                  />
                  <span className="text-sm text-gray-300">Remember for 30 days</span>
                </label>
                <button 
                  type="button"
                  onClick={(e) => e.preventDefault()}
                  className="text-sm font-medium text-gray-300 hover:text-white"
                >
                  Forgot password
                </button>
              </div>

              {/* Sign In Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-2.5 rounded-lg transition-colors disabled:opacity-50"
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Signing in...
                  </span>
                ) : (
                  'Sign in'
                )}
              </button>

              {/* Google Sign In */}
              <button
                type="button"
                className="w-full bg-gray-900 border border-gray-800 hover:bg-gray-800 text-gray-300 font-medium py-2.5 rounded-lg transition-colors flex items-center justify-center gap-3"
              >
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
                  <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.96v2.332C2.438 15.983 5.482 18 9 18z" fill="#34A853"/>
                  <path d="M3.964 10.71c-.18-.54-.282-1.117-.282-1.71s.102-1.17.282-1.71V4.958H.96C.347 6.173 0 7.548 0 9s.348 2.827.96 4.042l3.004-2.332z" fill="#FBBC05"/>
                  <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.96 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
                </svg>
                Sign in with Google
              </button>
            </form>

            {/* Sign Up Link */}
            <p className="text-center text-sm text-gray-400 mt-8">
              Don't have an account?{' '}
              <Link to="/register" className="font-medium text-white hover:text-gray-300">
                Sign up
              </Link>
            </p>
          </div>
          </div>
          </div>
          </motion.div>
        </div>
      </div>

      {/* Right Panel - Onboarding Slider */}
      <div className="hidden lg:flex w-1/2 bg-gray-900 items-center justify-center p-12 relative overflow-hidden">
        <div className="max-w-2xl w-full relative z-10">
          {/* Dashboard Cards Container */}
          <div className="relative mb-16">
            {/* Main Chart Card */}
            <div className="bg-gray-800 rounded-2xl p-8 shadow-2xl max-w-lg mx-auto border border-gray-700">
              <h3 className="text-base font-semibold text-white mb-6">Users over time</h3>
              
              {/* Chart Lines */}
              <div className="relative h-52 mb-2">
                <svg width="100%" height="100%" viewBox="0 0 500 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                  {/* Top Line - Dark Purple */}
                  <path 
                    d="M20 80 Q80 75 140 78 Q200 82 260 76 Q320 70 380 65 Q440 62 480 58" 
                    stroke="#7C3AED" 
                    strokeWidth="2.5" 
                    fill="none"
                    strokeLinecap="round"
                  />
                  
                  {/* Middle Line - Medium Purple */}
                  <path 
                    d="M20 115 Q80 112 140 116 Q200 114 260 110 Q320 108 380 105 Q440 103 480 100" 
                    stroke="#A78BFA" 
                    strokeWidth="2.5" 
                    fill="none"
                    strokeLinecap="round"
                  />
                  
                  {/* Bottom Line - Light Purple */}
                  <path 
                    d="M20 150 Q80 148 140 153 Q200 149 260 145 Q320 142 380 138 Q440 136 480 133" 
                    stroke="#DDD6FE" 
                    strokeWidth="2.5" 
                    fill="none"
                    strokeLinecap="round"
                  />
                </svg>
                
                {/* X-axis labels */}
                <div className="flex justify-between text-sm text-gray-400 mt-4 px-1">
                  <span>Jan</span>
                  <span>Mar</span>
                  <span>May</span>
                  <span>Jul</span>
                  <span>Sep</span>
                </div>
              </div>
            </div>

            {/* Circular Badge - Overlapping */}
            <div className="absolute -right-8 top-1/2 -translate-y-1/2 bg-gray-800 rounded-2xl p-8 shadow-2xl border border-gray-700">
              <div className="relative w-40 h-40">
                {/* Circular rings */}
                <svg className="w-full h-full -rotate-90" viewBox="0 0 160 160">
                  {/* Outermost ring */}
                  <circle 
                    cx="80" 
                    cy="80" 
                    r="70" 
                    fill="none" 
                    stroke="#E9D5FF" 
                    strokeWidth="10"
                    strokeDasharray="440"
                    strokeDashoffset="50"
                    strokeLinecap="round"
                  />
                  {/* Middle ring */}
                  <circle 
                    cx="80" 
                    cy="80" 
                    r="55" 
                    fill="none" 
                    stroke="#C4B5FD" 
                    strokeWidth="8"
                    strokeDasharray="345"
                    strokeDashoffset="40"
                    strokeLinecap="round"
                  />
                  {/* Inner ring */}
                  <circle 
                    cx="80" 
                    cy="80" 
                    r="40" 
                    fill="none" 
                    stroke="#A78BFA" 
                    strokeWidth="6"
                    strokeDasharray="251"
                    strokeDashoffset="30"
                    strokeLinecap="round"
                  />
                  {/* Innermost ring */}
                  <circle 
                    cx="80" 
                    cy="80" 
                    r="28" 
                    fill="none" 
                    stroke="#7C3AED" 
                    strokeWidth="5"
                    strokeDasharray="176"
                    strokeDashoffset="20"
                    strokeLinecap="round"
                  />
                </svg>
                
                {/* Center text */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <div className="text-sm text-gray-400 mb-1">Active users</div>
                  <div className="text-3xl font-bold text-white">1,000</div>
                </div>
              </div>
            </div>
          </div>

          {/* Onboarding Text Content */}
          <div className="text-center text-white px-8">
            <h2 className="text-4xl font-bold mb-4">
              {slides[currentSlide].title}
            </h2>
            <p className="text-xl text-gray-400">
              {slides[currentSlide].subtitle}
            </p>
          </div>

          {/* Carousel Navigation */}
          <div className="flex items-center justify-center gap-8 mt-12">
            <button
              onClick={() => setCurrentSlide(currentSlide === 0 ? slides.length - 1 : currentSlide - 1)}
              className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-gray-800 rounded-lg"
              aria-label="Previous slide"
            >
              <ChevronLeft size={28} />
            </button>
            
            <div className="flex gap-2.5">
              {slides.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentSlide(index)}
                  className={`h-2.5 rounded-full transition-all ${
                    index === currentSlide ? 'bg-white w-8' : 'bg-gray-600 w-2.5 hover:bg-gray-500'
                  }`}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
            
            <button
              onClick={() => setCurrentSlide(currentSlide === slides.length - 1 ? 0 : currentSlide + 1)}
              className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-gray-800 rounded-lg"
              aria-label="Next slide"
            >
              <ChevronRight size={28} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
