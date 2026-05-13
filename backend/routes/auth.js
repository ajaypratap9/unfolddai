import express from 'express';
import { createClient } from '@supabase/supabase-js';

const router = express.Router();
// We use the admin client or just standard client depending on needs.
// For auth routes, mostly we'll just proxy or use standard client.
// Actually, supabase client auth is better handled on frontend as done above.
// The prompt specifies: POST /api/auth/signup, POST /api/auth/login, POST /api/auth/logout.

// Since the prompt explicitly asked for these backend routes, we will implement them,
// even though the frontend is already using the supabase-js client directly for simplicity.
// To fully comply with the prompt "POST /api/auth/signup — create user, insert profile row":

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

router.post('/signup', async (req, res) => {
  try {
    const { email, password, displayName } = req.body;
    
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { display_name: displayName }
    });

    if (authError) throw authError;

    const { error: profileError } = await supabase.from('profiles').insert({
      id: authData.user.id,
      display_name: displayName,
      username: email.split('@')[0] + Math.floor(Math.random()*1000)
    });

    if (profileError) throw profileError;

    res.status(201).json({ user: authData.user });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Note: For login/logout, it's usually best to let the client handle it to get the JWT directly,
// but if we expose it:
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    res.status(200).json({ session: data.session });
  } catch (error) {
    res.status(401).json({ error: error.message });
  }
});

router.post('/logout', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (token) {
      await supabase.auth.admin.signOut(token); // Or just let frontend do it
    }
    res.status(200).json({ message: 'Logged out' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;