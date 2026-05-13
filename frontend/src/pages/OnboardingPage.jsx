import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Target, 
  MessageCircle, 
  Zap, 
  Lightbulb, 
  User as UserIcon 
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { useHaptics } from '../hooks/useHaptics';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

const QUESTIONS = [
  {
    id: 'purpose',
    icon: Target,
    text: 'What do you mainly want to use Unfoldd for?',
    type: 'single',
    options: ['Learning', 'Work', 'Creative writing', 'Personal assistant']
  },
  {
    id: 'style',
    icon: MessageCircle,
    text: "What's your preferred response style?",
    type: 'single',
    options: ['Concise', 'Detailed', 'Step-by-step', 'Conversational']
  },
  {
    id: 'experience',
    icon: Zap,
    text: 'How experienced are you with AI assistants?',
    type: 'single',
    options: ['Just starting', 'Some experience', 'Regular user', 'Power user']
  },
  {
    id: 'topics',
    icon: Lightbulb,
    text: 'What topics interest you most?',
    type: 'multi',
    options: ['Science', 'Tech', 'Business', 'Arts', 'Health', 'General']
  },
  {
    id: 'name',
    icon: UserIcon,
    text: "What's your name? We'll personalize your experience.",
    type: 'text'
  }
];

export default function OnboardingPage() {
  const navigate = useNavigate();
  const { session, profile, refreshProfile } = useAuth();
  const haptics = useHaptics();
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [direction, setDirection] = useState(1);
  const [isFinishing, setIsFinishing] = useState(false);
  
  const currentQ = QUESTIONS[currentIndex];

  const handleSelect = (option) => {
    haptics.lightTap();
    if (currentQ.type === 'single') {
      setAnswers(prev => ({ ...prev, [currentQ.id]: option }));
    } else if (currentQ.type === 'multi') {
      setAnswers(prev => {
        const currentSelected = prev[currentQ.id] || [];
        if (currentSelected.includes(option)) {
          return { ...prev, [currentQ.id]: currentSelected.filter(item => item !== option) };
        } else {
          return { ...prev, [currentQ.id]: [...currentSelected, option] };
        }
      });
    }
  };

  const handleNext = async () => {
    haptics.lightTap();
    if (currentIndex < QUESTIONS.length - 1) {
      setDirection(1);
      setCurrentIndex(prev => prev + 1);
    } else {
      await finishOnboarding();
    }
  };

  const finishOnboarding = async () => {
    if (isFinishing) return;
    setIsFinishing(true);
    
    try {
      const answersToInsert = Object.entries(answers).map(([key, val]) => ({
        user_id: session.user.id,
        question_key: key,
        answer: Array.isArray(val) ? val.join(', ') : val
      }));

      if (answersToInsert.length > 0) {
        await supabase.from('onboarding_answers').insert(answersToInsert);
      }

      await supabase
        .from('profiles')
        .update({ onboarding_completed: true })
        .eq('id', session.user.id);
        
      if (answers.name) {
        await supabase
          .from('profiles')
          .update({ display_name: answers.name })
          .eq('id', session.user.id);
      }

      await refreshProfile(session.user.id);
      navigate('/chat', { replace: true });
    } catch (err) {
      console.error(err);
      haptics.error();
    } finally {
      setIsFinishing(false);
    }
  };

  const isAnswered = () => {
    const val = answers[currentQ.id];
    if (currentQ.type === 'multi') return val && val.length > 0;
    if (currentQ.type === 'text') return val && val.trim().length > 0;
    return !!val;
  };

  const slideVariants = {
    enter: (dir) => ({
      x: dir > 0 ? 100 : -100,
      opacity: 0
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1
    },
    exit: (dir) => ({
      zIndex: 0,
      x: dir < 0 ? 100 : -100,
      opacity: 0
    })
  };

  const CurrentIcon = currentQ.icon;

  return (
    <div className="flex flex-col min-h-screen bg-bg-primary items-center justify-center p-4">
      {/* Progress Dots */}
      <div className="flex gap-2 mb-12">
        {QUESTIONS.map((_, idx) => (
          <div 
            key={idx} 
            className={`w-2 h-2 rounded-full transition-colors duration-300 ${
              idx === currentIndex ? 'bg-primary' : 'bg-gray-200'
            }`} 
          />
        ))}
      </div>

      <div className="relative w-full max-w-md min-h-[300px]">
        <AnimatePresence custom={direction} mode="wait">
          <motion.div
            key={currentIndex}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: "spring", stiffness: 300, damping: 30 },
              opacity: { duration: 0.2 }
            }}
            className="absolute w-full flex flex-col items-center bg-white p-8 rounded-2xl shadow-sm border border-border"
          >
            <div className="w-12 h-12 bg-primary-light rounded-full flex items-center justify-center mb-6 text-primary">
              <CurrentIcon size={24} />
            </div>
            
            <h2 className="text-xl font-semibold text-center mb-8">{currentQ.text}</h2>

            {currentQ.type !== 'text' ? (
              <div className="flex flex-wrap justify-center gap-3 w-full">
                {currentQ.options.map(option => {
                  const isSelected = currentQ.type === 'multi' 
                    ? (answers[currentQ.id] || []).includes(option)
                    : answers[currentQ.id] === option;
                  
                  return (
                    <motion.button
                      key={option}
                      whileTap={{ scale: 0.96 }}
                      onClick={() => handleSelect(option)}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-colors border ${
                        isSelected 
                          ? 'bg-primary-light border-primary text-primary' 
                          : 'bg-bg-tertiary border-transparent text-text-primary hover:bg-gray-200'
                      }`}
                    >
                      {option}
                    </motion.button>
                  );
                })}
              </div>
            ) : (
              <div className="w-full">
                <Input
                  autoFocus
                  placeholder="Your first name"
                  value={answers[currentQ.id] || ''}
                  onChange={(e) => setAnswers({ ...answers, [currentQ.id]: e.target.value })}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && isAnswered()) handleNext();
                  }}
                />
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="mt-12 h-12">
        <AnimatePresence>
          {isAnswered() && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <Button onClick={handleNext} disabled={isFinishing} className="w-40">
                {currentIndex === QUESTIONS.length - 1 ? (isFinishing ? 'Finishing...' : 'Get started') : 'Continue'}
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
