import express from 'express';
import { supabaseAdmin, getUserFromToken } from '../services/supabase.js';

const router = express.Router();

// Middleware to protect routes
router.use(async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    req.user = await getUserFromToken(token);
    next();
  } catch (error) {
    res.status(401).json({ error: 'Unauthorized' });
  }
});

router.get('/', async (req, res) => {
  try {
    console.log('Fetching conversations for user:', req.user.id);
    const { data, error } = await supabaseAdmin
      .from('conversations')
      .select('*')
      .eq('user_id', req.user.id)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Supabase error fetching conversations:', error);
      throw error;
    }
    console.log(`Found ${data?.length || 0} conversations`);
    res.json(data);
  } catch (error) {
    console.error('Catch block error fetching conversations:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { title = 'New chat' } = req.body;
    const { data, error } = await supabaseAdmin
      .from('conversations')
      .insert({ user_id: req.user.id, title })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.patch('/:id', async (req, res) => {
  try {
    const { title } = req.body;
    const { data, error } = await supabaseAdmin
      .from('conversations')
      .update({ title })
      .eq('id', req.params.id)
      .eq('user_id', req.user.id) // security check
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { error } = await supabaseAdmin
      .from('conversations')
      .delete()
      .eq('id', req.params.id)
      .eq('user_id', req.user.id);

    if (error) throw error;
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id/messages', async (req, res) => {
  try {
    // Pagination (cursor-based or offset)
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const offset = (page - 1) * limit;

    const { data, error } = await supabaseAdmin
      .from('messages')
      .select('*')
      .eq('conversation_id', req.params.id)
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: true }) // Return in chronological order
      .range(offset, offset + limit - 1);

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;