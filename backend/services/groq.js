import Groq from 'groq-sdk';
import { extractMemories } from './memory.js';
import { supabaseAdmin } from './supabase.js';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const getSystemPrompt = (memories) => `
You are Unfoldd, an intelligent AI assistant built by the Unfoldd team. Your name is Unfoldd (styled as "unfoldd" in lowercase). You must never say you were made by Anthropic, OpenAI, Meta, or any other company. You are Unfoldd.

Your personality:
- You are direct, honest, and thoughtful. You do NOT blindly agree with everything the user says.
- You respectfully push back when you disagree or when something is factually incorrect.
- You are professional but warm. Not robotic, not overly casual.
- You do NOT use emojis. You use precise language and clean formatting.
- You do NOT add unnecessary filler ("Great question!", "Certainly!", "Of course!"). Get to the point.

Your formatting rules (ALWAYS follow these):
- Use proper Markdown: headers (##, ###), bold (**), italic (*), code blocks (\`\`\`language), tables, numbered and bulleted lists as appropriate.
- For math and formulas: use LaTeX syntax wrapped in $$ for display math or $ for inline math.
- For code: always specify the language in the code fence.
- Structure long answers with headers. Break up walls of text.
- When showing comparisons, use tables.
- When showing step-by-step instructions, use numbered lists.
- Keep responses appropriately concise — don't pad with filler content.

Memory: You will receive facts about the user in the system context under [USER MEMORY]. Use this to personalize your responses. If the user's name is known, use it occasionally (not every message).

[USER MEMORY]
${memories.length > 0 ? memories.join('\n') : 'No user memories available yet.'}
`;

export async function generateChatStream(userId, conversationId, userMessage, onChunk, onComplete) {
  try {
    // 1. Fetch memories
    const { data: memoriesData } = await supabaseAdmin
      .from('memories')
      .select('content')
      .eq('user_id', userId);
    
    const memories = memoriesData ? memoriesData.map(m => m.content) : [];

    // 2. Fetch last 20 messages for context
    const { data: messagesData } = await supabaseAdmin
      .from('messages')
      .select('role, content')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: false })
      .limit(20);
    
    const contextMessages = messagesData ? messagesData.reverse() : [];

    const messages = [
      { role: 'system', content: getSystemPrompt(memories) },
      ...contextMessages.map(m => ({ role: m.role, content: m.content })),
      { role: 'user', content: userMessage }
    ];

    // 3. Save user message to DB
    await supabaseAdmin.from('messages').insert({
      conversation_id: conversationId,
      user_id: userId,
      role: 'user',
      content: userMessage
    });

    // 4. Call Groq
    const stream = await groq.chat.completions.create({
      messages,
      model: 'llama-3.3-70b-versatile',
      stream: true,
    });

    let fullResponse = '';

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || '';
      fullResponse += content;
      if (content) {
        onChunk(content);
      }
    }

    // 5. Save AI response to DB
    await supabaseAdmin.from('messages').insert({
      conversation_id: conversationId,
      user_id: userId,
      role: 'assistant',
      content: fullResponse
    });

    onComplete();

    // 6. Trigger memory extraction asynchronously
    extractMemories(userId, conversationId, userMessage, fullResponse, memories).catch(err => console.error("Memory extraction failed:", err));

    // 7. Auto-title if it's the first message (meaning contextMessages was empty)
    if (contextMessages.length === 0) {
      generateTitle(conversationId, userMessage).catch(err => console.error("Title generation failed:", err));
    }

    // Update conversation timestamp
    await supabaseAdmin.from('conversations').update({ updated_at: new Date().toISOString() }).eq('id', conversationId);

  } catch (error) {
    console.error('Groq stream error:', error);
    onComplete(error);
  }
}

async function generateTitle(conversationId, firstMessage) {
  const response = await groq.chat.completions.create({
    messages: [
      { role: 'system', content: 'Generate a short conversation title (max 5 words, no quotes) for a chat that started with the user message. Respond ONLY with the title.' },
      { role: 'user', content: firstMessage }
    ],
    model: 'llama-3.3-70b-versatile',
  });
  
  const title = response.choices[0]?.message?.content?.replace(/['"]/g, '').trim();
  if (title) {
    await supabaseAdmin.from('conversations').update({ title }).eq('id', conversationId);
  }
}
