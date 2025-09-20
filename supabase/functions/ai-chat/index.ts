// @ts-ignore - Deno remote imports
import "https://deno.land/x/xhr@0.1.0/mod.ts";
// @ts-ignore - Deno remote imports
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// @ts-ignore - Deno remote imports
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

// Deno global type declarations
declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
};

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const WELLNESS_TRIGGERS = {
  stress: ['stress', 'stressed', 'overwhelmed', 'pressure', 'anxious', 'anxiety', 'worried', 'panic'],
  focus: ['focus', 'concentrate', 'distracted', 'attention', 'exam', 'study', 'work'],
  calm: ['calm', 'peace', 'relax', 'rest', 'sleep', 'tired', 'exhausted'],
  energy: ['energy', 'motivated', 'tired', 'lazy', 'procrastinate', 'sluggish'],
  confidence: ['confidence', 'doubt', 'fear', 'nervous', 'self-esteem', 'insecure']
};

const WELLNESS_SUGGESTIONS = {
  stress: [
    { title: "Guided Meditation", icon: "🧘", route: "/meditation", description: "5-minute breathing meditation to reduce stress" }
  ],
  focus: [
    { title: "Gyan Mudra", icon: "👌", route: "/mudra", description: "Hand gesture for enhanced concentration" }
  ],
  calm: [
    { title: "Sound Healing", icon: "🎵", route: "/sound", description: "Soothing sounds for deep relaxation" }
  ],
  energy: [
    { title: "Energizing Meditation", icon: "⚡", route: "/meditation", description: "Boost your energy with pranayama" }
  ],
  confidence: [
    { title: "Spiritual Mentor", icon: "🙏", route: "/mentor", description: "Wisdom from ancient teachings" }
  ]
};

function detectWellnessTriggers(text: string): any[] {
  const suggestions: any[] = [];
  const lowerText = text.toLowerCase();
  
  for (const [category, keywords] of Object.entries(WELLNESS_TRIGGERS)) {
    if (keywords.some(keyword => lowerText.includes(keyword))) {
      const categoryKey = category as keyof typeof WELLNESS_SUGGESTIONS;
      suggestions.push(...WELLNESS_SUGGESTIONS[categoryKey]);
      break; // Only add one category of suggestions per message
    }
  }
  
  return suggestions;
}

function createSystemPrompt(userProfile: any, recentEmotions: string[]): string {
  const emotionContext = recentEmotions.length > 0 ? 
    ` The user has recently expressed feelings of: ${recentEmotions.join(', ')}.` : '';
  
  return `You are Zen Chat, a compassionate spiritual AI companion rooted in ancient wisdom. You respond with:

1. Deep empathy and understanding
2. Practical wisdom from Bhagavad Gita, Buddhism, and mindfulness traditions
3. Brief, meaningful responses (2-3 sentences max)
4. Gentle guidance toward self-reflection and inner peace
5. Cultural metaphors and spiritual analogies when appropriate

Your personality:
- Speak like a wise, caring mentor
- Use gentle, non-judgmental language
- Reference spiritual concepts naturally (dharma, karma, mindfulness)
- Offer hope and perspective during difficult times
- Encourage self-compassion and growth

Guidelines:
- Keep responses concise but profound
- Use metaphors from nature, ancient stories, or spiritual teachings
- Never be preachy or overwhelming
- Focus on the user's immediate emotional need
- End with gentle encouragement or a question for reflection

${emotionContext}

Remember: You are here to guide them toward inner peace and self-discovery through timeless wisdom.`;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, sessionId, userId } = await req.json();
    
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    console.log('Processing chat request for user:', userId);

    // Get user profile for personalization (only for authenticated users)
    let profile: any = null;
    if (!userId.startsWith('anonymous_')) {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();
      profile = profileData;
    }

    // Get recent chat history (last 10 messages) for context
    const { data: recentMessages } = await supabase
      .from('chat_messages')
      .select('content, role')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: false })
      .limit(10);

    // Reverse to get chronological order
    const chatHistory = recentMessages ? recentMessages.reverse() : [];

    // Extract recent emotions from past messages
    const recentEmotions = (profile?.past_emotions as string[])?.slice(-3) || [];

    // Build messages array for OpenAI
    const messages = [
      {
        role: 'system',
        content: createSystemPrompt(profile, recentEmotions)
      },
      ...chatHistory.map(msg => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content
      })),
      {
        role: 'user',
        content: message
      }
    ];

    console.log('Sending request to OpenAI with', messages.length, 'messages');

    // Call OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: messages,
        max_tokens: 150,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('OpenAI API error:', error);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;

    console.log('Got AI response:', aiResponse);

    // Detect wellness triggers and generate suggestions
    const suggestions = detectWellnessTriggers(message);

    // Save user message to database
    await supabase
      .from('chat_messages')
      .insert({
        session_id: sessionId,
        user_id: userId,
        content: message,
        role: 'user'
      });

    // Save AI response to database
    await supabase
      .from('chat_messages')
      .insert({
        session_id: sessionId,
        user_id: userId,
        content: aiResponse,
        role: 'assistant',
        suggestions: suggestions
      });

    // Update user profile with emotion tracking (only for authenticated users)
    if (profile && !userId.startsWith('anonymous_')) {
      const detectedEmotions: string[] = [];
      for (const [emotion, keywords] of Object.entries(WELLNESS_TRIGGERS)) {
        if (keywords.some(keyword => message.toLowerCase().includes(keyword))) {
          detectedEmotions.push(emotion);
        }
      }

      if (detectedEmotions.length > 0) {
        const currentEmotions = (profile.past_emotions as string[]) || [];
        const updatedEmotions = [...currentEmotions, ...detectedEmotions].slice(-10);
        await supabase
          .from('profiles')
          .update({ 
            past_emotions: updatedEmotions,
            last_activity: new Date().toISOString()
          })
          .eq('user_id', userId);
      }
    }

    console.log('Chat processing completed successfully');

    return new Response(
      JSON.stringify({ 
        response: aiResponse, 
        suggestions: suggestions
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in ai-chat function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        response: "I'm experiencing some difficulties right now. Let me share some wisdom: even in uncertainty, there is an opportunity for growth. Take a deep breath and try again in a moment. 🌱"
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});