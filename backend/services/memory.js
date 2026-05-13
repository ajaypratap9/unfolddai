import Groq from 'groq-sdk';
import { supabaseAdmin } from './supabase.js';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function extractMemories(userId, conversationId, userMessage, aiResponse, existingMemories) {
  try {
    const prompt = `You extract key personal facts from conversations. Respond ONLY with a JSON array of strings, each being a single memorable fact about the user. Return [] if nothing new. Examples: ["User's name is Alex", "User works as a software engineer", "User prefers concise answers", "User is learning Python"]`;
    
    const response = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: prompt },
        { 
          role: 'user', 
          content: `User said: ${userMessage}\nAI responded: ${aiResponse}\nExisting memories: ${JSON.stringify(existingMemories)}` 
        }
      ],
      model: 'llama-3.3-70b-versatile',
      response_format: { type: "json_object" }
    });

    const content = response.choices[0]?.message?.content;
    if (!content) return;

    let newMemories = [];
    try {
      // Sometimes models wrap array in an object like { "memories": [...] }
      const parsed = JSON.parse(content);
      newMemories = Array.isArray(parsed) ? parsed : (parsed.memories || []);
    } catch (e) {
      console.error('Failed to parse memories JSON', e);
      return;
    }

    if (newMemories.length > 0) {
      // Filter out facts already known (basic check)
      const trulyNew = newMemories.filter(m => !existingMemories.includes(m));
      
      if (trulyNew.length > 0) {
        const inserts = trulyNew.map(m => ({
          user_id: userId,
          content: m,
          source_conversation_id: conversationId
        }));
        await supabaseAdmin.from('memories').insert(inserts);

        // Keep max 30 memories
        const { data: allMemories } = await supabaseAdmin
          .from('memories')
          .select('id')
          .eq('user_id', userId)
          .order('created_at', { ascending: true });
        
        if (allMemories && allMemories.length > 30) {
          const toDelete = allMemories.slice(0, allMemories.length - 30).map(m => m.id);
          await supabaseAdmin.from('memories').delete().in('id', toDelete);
        }
      }
    }
  } catch (error) {
    console.error('Memory extraction error:', error);
  }
}
