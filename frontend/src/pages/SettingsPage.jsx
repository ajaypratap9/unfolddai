import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, User, Vibrate, Shield, LogOut, X, Camera } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { useHaptics } from '../hooks/useHaptics';
import { AnimatedPage } from '../components/layout/AnimatedPage';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';

function ProfileSheet({ isOpen, onClose }) {
  const { profile, session, refreshProfile } = useAuth();
  const haptics = useHaptics();
  const [formData, setFormData] = useState({
    displayName: profile?.display_name || '',
    username: profile?.username || '',
    bio: profile?.bio || ''
  });
  const [loading, setLoading] = useState(false);

  // Sync state when profile loads
  React.useEffect(() => {
    if (profile) {
      setFormData({
        displayName: profile.display_name || '',
        username: profile.username || '',
        bio: profile.bio || ''
      });
    }
  }, [profile]);

  const handleSave = async () => {
    haptics.mediumTap();
    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          display_name: formData.displayName,
          username: formData.username,
          bio: formData.bio
        })
        .eq('id', session.user.id);
      
      if (error) throw error;
      await refreshProfile(session.user.id);
      haptics.success();
      onClose();
    } catch (err) {
      console.error(err);
      haptics.error();
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 0.5 }} 
            exit={{ opacity: 0 }} 
            onClick={onClose}
            className="fixed inset-0 bg-black z-40" 
          />
          <motion.div 
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl z-50 p-6 shadow-2xl max-h-[90vh] overflow-y-auto"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">Edit Profile</h2>
              <button onClick={onClose} className="p-2 bg-gray-100 rounded-full"><X size={20} /></button>
            </div>

            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className="w-24 h-24 rounded-full bg-primary-light flex items-center justify-center text-primary text-3xl font-bold">
                  {formData.displayName.charAt(0).toUpperCase() || 'U'}
                </div>
                <button className="absolute bottom-0 right-0 p-2 bg-white rounded-full shadow-md border border-border">
                  <Camera size={16} />
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <Input 
                label="Display Name" 
                value={formData.displayName} 
                onChange={e => setFormData({ ...formData, displayName: e.target.value })} 
              />
              <Input 
                label="Username" 
                value={formData.username} 
                onChange={e => setFormData({ ...formData, username: e.target.value })} 
              />
              <Input 
                label="Bio" 
                value={formData.bio} 
                onChange={e => setFormData({ ...formData, bio: e.target.value })} 
              />
              <div className="mt-4">
                <Button onClick={handleSave} fullWidth disabled={loading}>
                  {loading ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function SettingsRow({ icon: Icon, title, onClick, rightElement, destructive }) {
  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className={`w-full flex items-center justify-between p-4 bg-white border border-border rounded-xl mb-3 shadow-sm ${
        destructive ? 'text-error' : 'text-text-primary'
      }`}
    >
      <div className="flex items-center gap-4">
        <Icon size={22} className={destructive ? 'text-error' : 'text-text-muted'} />
        <span className="font-medium">{title}</span>
      </div>
      {rightElement}
    </motion.button>
  );
}

export default function SettingsPage() {
  const navigate = useNavigate();
  const haptics = useHaptics();
  const { profile, session, refreshProfile } = useAuth();
  
  const [profileSheetOpen, setProfileSheetOpen] = useState(false);
  const [policyModalOpen, setPolicyModalOpen] = useState(false);

  const toggleHaptics = async () => {
    const newState = !(profile?.haptics_enabled ?? true);
    // Optimistic UI toggle could be here
    try {
      await supabase
        .from('profiles')
        .update({ haptics_enabled: newState })
        .eq('id', session.user.id);
      await refreshProfile(session.user.id);
      if (newState) {
        // Trigger right away to demonstrate it works
        haptics.success();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSignOut = async () => {
    haptics.heavyTap();
    await supabase.auth.signOut();
    navigate('/login');
  };

  return (
    <AnimatedPage className="bg-bg-secondary min-h-screen pb-10">
      <div className="flex items-center gap-3 p-4 border-b border-border sticky top-0 bg-white/80 backdrop-blur-md z-10">
        <button onClick={() => { haptics.lightTap(); navigate(-1); }} className="p-2 -ml-2 rounded-full hover:bg-bg-tertiary">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-xl font-semibold flex-1">Settings</h1>
      </div>

      <div className="p-4 max-w-2xl mx-auto">
        
        <div className="mb-8">
          <h2 className="text-sm font-semibold text-text-muted mb-3 px-1 uppercase tracking-wider">Account</h2>
          <SettingsRow 
            icon={User} 
            title="Profile" 
            onClick={() => { haptics.lightTap(); setProfileSheetOpen(true); }} 
          />
        </div>

        <div className="mb-8">
          <h2 className="text-sm font-semibold text-text-muted mb-3 px-1 uppercase tracking-wider">Preferences</h2>
          <SettingsRow 
            icon={Vibrate} 
            title="Haptics" 
            onClick={toggleHaptics}
            rightElement={
              <div className={`w-12 h-6 rounded-full transition-colors flex items-center px-1 ${profile?.haptics_enabled !== false ? 'bg-primary' : 'bg-gray-300'}`}>
                <motion.div 
                  className="w-4 h-4 bg-white rounded-full shadow-sm"
                  animate={{ x: profile?.haptics_enabled !== false ? 24 : 0 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              </div>
            }
          />
        </div>

        <div className="mb-8">
          <h2 className="text-sm font-semibold text-text-muted mb-3 px-1 uppercase tracking-wider">Legal</h2>
          <SettingsRow 
            icon={Shield} 
            title="Privacy Policy" 
            onClick={() => { haptics.lightTap(); setPolicyModalOpen(true); }} 
          />
        </div>

        <div className="mb-8">
          <h2 className="text-sm font-semibold text-text-muted mb-3 px-1 uppercase tracking-wider">Account Actions</h2>
          <SettingsRow 
            icon={LogOut} 
            title="Sign out" 
            destructive 
            onClick={handleSignOut} 
          />
        </div>

      </div>

      <ProfileSheet isOpen={profileSheetOpen} onClose={() => setProfileSheetOpen(false)} />

      {/* Basic Privacy Policy Modal */}
      <AnimatePresence>
        {policyModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.5 }} exit={{ opacity: 0 }} onClick={() => setPolicyModalOpen(false)} className="absolute inset-0 bg-black" />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-white rounded-2xl p-6 relative z-10 w-full max-w-md max-h-[80vh] flex flex-col">
              <h2 className="text-lg font-bold mb-4">Privacy Policy</h2>
              <div className="flex-1 overflow-y-auto text-sm text-text-secondary pr-2">
                <p>Welcome to Unfoldd. Your privacy is critical to us.</p>
                <p className="mt-2">We collect only what is necessary to make the assistant helpful (memories and chat logs). Data is never sold.</p>
                <p className="mt-2">If you wish to delete your data, you can do so by deleting your conversations or requesting account deletion.</p>
              </div>
              <Button onClick={() => setPolicyModalOpen(false)} className="mt-4">Close</Button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </AnimatedPage>
  );
}
