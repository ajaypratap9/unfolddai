import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { UnfoldLogo, UnfoldWordmark } from '../components/ui/Brand';
import { useAuth } from '../hooks/useAuth';

export default function SplashPage() {
  const navigate = useNavigate();
  const { session, profile, loading } = useAuth();
  const [showLogo, setShowLogo] = useState(true);
  const [showWordmark, setShowWordmark] = useState(false);
  const [exitPage, setExitPage] = useState(false);

  useEffect(() => {
    // Wordmark fades in 400ms after logo
    const wordmarkTimer = setTimeout(() => setShowWordmark(true), 400);

    // After 2.2s total: fade out entire page, check routing
    const exitTimer = setTimeout(() => {
      setExitPage(true);
    }, 2200);

    return () => {
      clearTimeout(wordmarkTimer);
      clearTimeout(exitTimer);
    };
  }, []);

  useEffect(() => {
    if (!exitPage || loading) return;

    if (session && profile) {
      if (profile.onboarding_completed) {
        navigate('/chat', { replace: true });
      } else {
        navigate('/onboarding', { replace: true });
      }
    } else {
      navigate('/login', { replace: true });
    }
  }, [exitPage, loading, session, profile, navigate]);

  return (
    <AnimatePresence>
      {!exitPage && (
        <motion.div
          key="splash"
          initial={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.08 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 flex flex-col items-center justify-center bg-white"
        >
          <motion.div
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{
              type: 'spring',
              stiffness: 200,
              damping: 20,
            }}
            className="flex flex-col items-center gap-4"
          >
            <UnfoldLogo size={80} />
            <AnimatePresence>
              {showWordmark && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.4 }}
                  className="flex flex-col items-center gap-2"
                >
                  <UnfoldWordmark size={32} />
                  <span className="text-[14px] text-[#888888]">Think. Explore. Unfold.</span>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
