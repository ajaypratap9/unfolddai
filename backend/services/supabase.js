import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

export const getUserFromToken = async (token) => {
  if (!token) throw new Error('No token provided');
  try {
    // Decode the token to get the user ID (sub)
    const decoded = jwt.decode(token);
    if (!decoded || !decoded.sub) {
      throw new Error('Invalid token');
    }
    // Return a mocked user object with the required ID so the rest of the backend works
    return { id: decoded.sub };
  } catch (err) {
    console.error('Token decoding error:', err);
    throw new Error('Unauthorized');
  }
};
