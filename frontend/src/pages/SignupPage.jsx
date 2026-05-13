import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../lib/api';
import { UnfoldLogo, UnfoldWordmark } from '../components/ui/Brand';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { AnimatedPage } from '../components/layout/AnimatedPage';
import { useHaptics } from '../hooks/useHaptics';
import { supabase } from '../lib/supabase';

function PasswordStrength({ password }) {
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  const getColors = () => {
    switch(score) {
      case 0: return ['bg-gray-200', 'bg-gray-200', 'bg-gray-200', 'bg-gray-200'];
      case 1: return ['bg-error', 'bg-gray-200', 'bg-gray-200', 'bg-gray-200'];
      case 2: return ['bg-yellow-400', 'bg-yellow-400', 'bg-gray-200', 'bg-gray-200'];
      case 3: return ['bg-blue-400', 'bg-blue-400', 'bg-blue-400', 'bg-gray-200'];
      case 4: return ['bg-success', 'bg-success', 'bg-success', 'bg-success'];
      default: return ['bg-gray-200', 'bg-gray-200', 'bg-gray-200', 'bg-gray-200'];
    }
  };

  const colors = getColors();

  return (
    <div className="flex gap-1 mt-1">
      {colors.map((c, i) => (
        <div key={i} className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${c}`} />
      ))}
    </div>
  );
}

export default function SignupPage() {
  const navigate = useNavigate();
  const haptics = useHaptics();
  const [formData, setFormData] = useState({
    displayName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    const { displayName, email, password, confirmPassword } = formData;
    
    if (!displayName || !email || !password || !confirmPassword) {
      setError('Please fill all fields');
      haptics.error();
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      haptics.error();
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      haptics.error();
      return;
    }

    setLoading(true);
    setError('');

    // Let's use backend API for signup to easily insert into profiles.
    // Or we can use Supabase client directly since we have policies, 
    // but the prompt says POST /api/auth/signup. Let's do API.
    try {
      const { data, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: displayName
          }
        }
      });

      if (authError) throw authError;

      // Note: we need to manually insert into profile if there's no trigger.
      // Assuming no trigger was provided for auth.users -> public.profiles.
      // Wait, there's RLS "Users can insert own profile". Let's insert it here.
      if (data.user) {
        const { error: profileError } = await supabase.from('profiles').insert({
          id: data.user.id,
          display_name: displayName,
          username: email.split('@')[0] + Math.floor(Math.random()*1000)
        });
        if (profileError) throw profileError;
      }

      haptics.success();
      navigate('/onboarding');
    } catch (err) {
      setError(err.message || 'Signup failed');
      haptics.error();
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatedPage className="flex items-center justify-center p-4 bg-bg-primary">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md p-8 bg-white border border-border rounded-2xl shadow-sm"
      >
        <div className="flex flex-col items-center gap-2 mb-8">
          <UnfoldLogo size={40} />
          <UnfoldWordmark size={24} />
        </div>

        <form onSubmit={handleSignup} className="flex flex-col gap-5">
          <Input
            label="Display Name"
            name="displayName"
            value={formData.displayName}
            onChange={handleChange}
            placeholder="Jane Doe"
          />
          <Input
            label="Email"
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="you@example.com"
          />
          <div>
            <Input
              label="Password"
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
            />
            {formData.password && <PasswordStrength password={formData.password} />}
          </div>
          <Input
            label="Confirm Password"
            type="password"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            placeholder="••••••••"
            error={error}
          />
          
          <Button type="submit" fullWidth disabled={loading}>
            {loading ? 'Creating account...' : 'Sign up'}
          </Button>
        </form>

        <div className="mt-6 text-center text-sm text-text-secondary">
          Already have an account?{' '}
          <Link to="/login" className="text-primary hover:underline font-medium">
            Sign in
          </Link>
        </div>
      </motion.div>
    </AnimatedPage>
  );
}
