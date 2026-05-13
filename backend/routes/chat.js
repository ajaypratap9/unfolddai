import express from 'express';
import { generateChatStream } from '../services/groq.js';
import { getUserFromToken } from '../services/supabase.js';

const router = express.Router();

router.post('/stream', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    console.log('Chat stream received auth header:', authHeader ? authHeader.substring(0, 20) + '...' : 'undefined');
    const token = authHeader?.split(' ')[1];
    const user = await getUserFromToken(token);

    const { conversationId, message } = req.body;
    if (!conversationId || !message) {
      return res.status(400).json({ error: 'conversationId and message are required' });
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    await generateChatStream(
      user.id,
      conversationId,
      message,
      (chunk) => {
        // SSE format
        res.write(`data: ${JSON.stringify({ token: chunk })}\n\n`);
      },
      (error) => {
        if (error) {
          res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
        }
        res.write(`data: [DONE]\n\n`);
        res.end();
      }
    );
  } catch (error) {
    console.error('Chat stream route error:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: error.message });
    } else {
      res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
      res.write(`data: [DONE]\n\n`);
      res.end();
    }
  }
});

export default router;