import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { UnfoldLogo, UnfoldWordmark } from '../components/ui/Brand';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { AnimatedPage } from '../components/layout/AnimatedPage';
import { useHaptics } from '../hooks/useHaptics';

export default function LoginPage() {
  const navigate = useNavigate();
  const haptics = useHaptics();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields');
      haptics.error();
      return;
    }

    setLoading(true);
    setError('');

    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError(authError.message);
      haptics.error();
      setLoading(false);
    } else {
      haptics.mediumTap();
      // AuthContext will handle profile fetching. Let Splash or protected route redirect to chat.
      // But we can directly push to chat to be smooth.
      navigate('/chat');
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

        <form onSubmit={handleLogin} className="flex flex-col gap-5">
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
          />
          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            error={error} // Error shows shake animation on the input wrapper
          />
          
          <div className="flex justify-end -mt-2">
            <button type="button" className="text-sm text-text-secondary hover:text-text-primary">
              Forgot password?
            </button>
          </div>

          <Button type="submit" fullWidth disabled={loading}>
            {loading ? 'Signing in...' : 'Sign in'}
          </Button>
        </form>

        <div className="mt-6 text-center text-sm text-text-secondary">
          Don't have an account?{' '}
          <Link to="/signup" className="text-primary hover:underline font-medium">
            Sign up
          </Link>
        </div>
      </motion.div>
    </AnimatedPage>
  );
}
