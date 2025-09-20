import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, ArrowLeft, Mic, User, Bot, Plus, MessageSquare, Settings, Trash2, Volume2, Bell, Shield, Heart } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import ChatMessage from "@/components/ChatMessage";
import SuggestionCard from "@/components/SuggestionCard";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  suggestions?: {
    title: string;
    icon: string;
    route: string;
    description: string;
  }[];
}

// Mental health focused constants
const positiveAffirmations = [
  "You are stronger than you think.",
  "Every emotion is valid. You are not alone.",
  "Peace begins with a single breath.",
  "You are worthy of love and happiness.",
  "This too shall pass. Brighter days are ahead!"
];

const distressPhrases = [
  "i'm upset", "i'm distressed", "i'm overwhelmed", "i want to die", "i'm suicidal"
];

const technicalTopics = [
  "python", "code", "programming", "function", "algorithm", "database", "api", "javascript", "html", "css", "react", "node", "sql", "git", "debug", "error", "bug", "compile", "syntax", "variable", "loop", "array", "object", "class", "method", "framework", "library", "package", "install", "deploy", "server", "client", "frontend", "backend", "fullstack", "devops", "testing", "deployment"
];

const generalKnowledgeTopics = [
  "capital", "country", "history", "science", "math", "physics", "chemistry", "biology", "geography", "politics", "economics", "finance", "business", "news", "weather", "sports", "entertainment", "movie", "book", "music", "art", "literature", "philosophy", "religion", "culture", "language", "grammar", "vocabulary", "translation", "conversion", "calculation", "formula", "equation", "theorem", "law", "theory", "research", "study", "analysis", "statistics", "data"
];

// Mental health response determination
const determineResponse = (message: string) => {
  const lowerMessage = message.toLowerCase();
  
  // Handle distress phrases that require immediate intervention
  for (const phrase of distressPhrases) {
    if (lowerMessage.includes(phrase)) {
      return `I hear your pain and I'm here to support you. However, I strongly encourage you to reach out to mental health professionals who can provide the help you need. Please contact a mental health helpline or counselor immediately. You are not alone in this journey.`;
    }
  }
  
  // Catch technical/programming questions and redirect to mental health focus
  for (const topic of technicalTopics) {
    if (lowerMessage.includes(topic)) {
      return `I sense you might be feeling frustrated, overwhelmed, or stressed about technical challenges. While I can't provide programming solutions, I can help you build emotional resilience and stress management skills for when you face difficult problems. Let's focus on your mental well-being - how does this technical challenge make you feel emotionally? We can work on breathing techniques and coping strategies to help you approach problems with a calmer, more focused mindset.`;
    }
  }
  
  // Catch general knowledge questions and redirect to mental health focus
  for (const topic of generalKnowledgeTopics) {
    if (lowerMessage.includes(topic)) {
      return `That's an interesting question! However, I'm here specifically to help with your mental health and emotional well-being. Instead of providing factual information, let's use this moment to explore what's on your mind. Are you feeling curious, anxious, seeking distraction, or perhaps avoiding something else? Let's practice mindfulness together - take a deep breath and notice how you're feeling right now. What emotions are present for you?`;
    }
  }
  
  // Let the AI handle other responses with mental health focus
  return null;
};

const Chat = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState({
    notifications: true,
    soundEnabled: true,
    autoScroll: true,
    privacyMode: false
  });
  const [messageCount, setMessageCount] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const websocketRef = useRef<WebSocket | null>(null);
  const chatId = useRef<string>(crypto.randomUUID());

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Cleanup WebSocket on unmount
  useEffect(() => {
    return () => {
      if (websocketRef.current) {
        websocketRef.current.close();
      }
    };
  }, []);

  // Initialize session and load chat history
  useEffect(() => {
    initializeChat();
  }, []);

  // Check if user is returning from a wellness page
  useEffect(() => {
    const state = location.state as { fromWellness?: boolean; sessionType?: string };
    if (state?.fromWellness && sessionId && userId) {
      handleWellnessReturn(state.sessionType || 'wellness');
    }
  }, [location, sessionId, userId]);

  const initializeChat = async () => {
    try {
      // Always create a local session first to ensure chat works
      const localUserId = 'local_' + Date.now();
      const localSessionId = 'local_session_' + Date.now();
      
      setUserId(localUserId);
      setSessionId(localSessionId);
      
      // Add welcome message immediately
      const welcomeMessage: Message = {
        id: "welcome",
        text: "🙏 Welcome to Zen Chat! I'm here to guide you on your wellness journey with wisdom from ancient traditions. How are you feeling today?",
        isUser: false,
        timestamp: new Date(),
        suggestions: [
          {
            title: "Try Meditation",
            icon: "🧘",
            route: "/meditation",
            description: "Guided mindfulness session"
          },
          {
            title: "Practice Mudra",
            icon: "🙏",
            route: "/mudra", 
            description: "Hand positions for focus"
          },
          {
            title: "Sound Healing",
            icon: "🎵",
            route: "/sound",
            description: "Therapeutic sound therapy"
          }
        ]
      };
      
      setMessages([welcomeMessage]);
      setIsInitialized(true);
      
      // Try to get authenticated user and upgrade session if possible
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          setUserId(user.id);
          
          // Try to create database session
          try {
            const { data: session, error } = await supabase
              .from('chat_sessions')
              .insert({ 
                user_id: user.id,
                title: 'Wellness Chat Session'
              })
              .select()
              .single();

            if (!error && session) {
              setSessionId(session.id);
              await loadChatHistory(session.id);
            }
          } catch (dbError) {
            console.warn('Database session creation failed, using local session:', dbError);
          }
        }
      } catch (authError) {
        console.warn('Authentication check failed, using local session:', authError);
      }

    } catch (error) {
      console.error('Error initializing chat:', error);
      // Ensure chat still works with local session
      const localUserId = 'local_' + Date.now();
      const localSessionId = 'local_session_' + Date.now();
      
      setUserId(localUserId);
      setSessionId(localSessionId);
      setIsInitialized(true);
      
      const welcomeMessage: Message = {
        id: "welcome",
        text: "🙏 Welcome to Zen Chat! I'm here to guide you on your wellness journey. How are you feeling today?",
        isUser: false,
        timestamp: new Date(),
        suggestions: [
          {
            title: "Try Meditation",
            icon: "🧘",
            route: "/meditation",
            description: "Guided mindfulness session"
          }
        ]
      };
      
      setMessages([welcomeMessage]);
    }
  };

  const createNewSession = async (currentUserId: string) => {
    try {
      const { data: session, error } = await supabase
        .from('chat_sessions')
        .insert({ 
          user_id: currentUserId,
          title: 'Wellness Chat Session'
        })
        .select()
        .single();

      if (error) {
        console.warn('Database session creation failed, using local session:', error);
        // Create a local session ID if database fails
        const localSessionId = 'local_' + Date.now();
        setSessionId(localSessionId);
      } else {
        setSessionId(session.id);
      }
      
      // Add welcome message
      const welcomeMessage: Message = {
        id: "welcome",
        text: "🙏 Welcome to Zen Chat! I'm here to guide you on your wellness journey with wisdom from ancient traditions. How are you feeling today?",
        isUser: false,
        timestamp: new Date(),
        suggestions: [
          {
            title: "Try Meditation",
            icon: "🧘",
            route: "/meditation",
            description: "Guided mindfulness session"
          },
          {
            title: "Practice Mudra",
            icon: "🙏",
            route: "/mudra", 
            description: "Hand positions for focus"
          },
          {
            title: "Sound Healing",
            icon: "🎵",
            route: "/sound",
            description: "Therapeutic sound therapy"
          }
        ]
      };
      
      setMessages([welcomeMessage]);
      setIsInitialized(true);
      
    } catch (error) {
      console.error('Error creating session:', error);
      // Create a local session ID as fallback
      const localSessionId = 'local_' + Date.now();
      setSessionId(localSessionId);
      
      // Add welcome message even if database fails
      const welcomeMessage: Message = {
        id: "welcome",
        text: "🙏 Welcome to Zen Chat! I'm here to guide you on your wellness journey with wisdom from ancient traditions. How are you feeling today?",
        isUser: false,
        timestamp: new Date(),
        suggestions: [
          {
            title: "Try Meditation",
            icon: "🧘",
            route: "/meditation",
            description: "Guided mindfulness session"
          },
          {
            title: "Practice Mudra",
            icon: "🙏",
            route: "/mudra", 
            description: "Hand positions for focus"
          },
          {
            title: "Sound Healing",
            icon: "🎵",
            route: "/sound",
            description: "Therapeutic sound therapy"
          }
        ]
      };
      
      setMessages([welcomeMessage]);
      setIsInitialized(true);
      
      toast({
        title: "Connection Issue",
        description: "Having trouble connecting to database. You can still chat, but messages won't be saved.",
        variant: "destructive"
      });
    }
  };

  const loadChatHistory = async (currentSessionId: string) => {
    try {
      const { data: chatMessages } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('session_id', currentSessionId)
        .order('created_at', { ascending: true });

      if (chatMessages && chatMessages.length > 0) {
        const formattedMessages: Message[] = chatMessages.map(msg => ({
          id: msg.id,
          text: msg.content,
          isUser: msg.role === 'user',
          timestamp: new Date(msg.created_at),
          suggestions: Array.isArray(msg.suggestions) ? msg.suggestions as any[] : []
        }));
        setMessages(formattedMessages);
      } else {
        // No history, show welcome message
        const welcomeMessage: Message = {
          id: "welcome",
          text: "🙏 Welcome back to Zen Chat! How may I guide you today?",
          isUser: false,
          timestamp: new Date(),
        };
        setMessages([welcomeMessage]);
      }
      
      setIsInitialized(true);
    } catch (error) {
      console.error('Error loading chat history:', error);
      setIsInitialized(true);
    }
  };

  const handleWellnessReturn = async (sessionType: string) => {
    const message = `Welcome back! How was your ${sessionType} session? Did it help you feel calmer and more centered?`;
    
    if (sessionId && userId) {
      try {
        const { data } = await supabase.functions.invoke('ai-chat', {
          body: { 
            message: `I just completed a ${sessionType} session and returned to chat.`,
            sessionId,
            userId
          }
        });

        if (data?.response) {
          const aiMessage: Message = {
            id: Date.now().toString(),
            text: data.response,
            isUser: false,
            timestamp: new Date(),
            suggestions: data.suggestions || []
          };
          setMessages(prev => [...prev, aiMessage]);
        }
      } catch (error) {
        console.error('Error handling wellness return:', error);
      }
    }
  };

  const getLocalAIResponse = (userMessage: string): { response: string; suggestions: any[] } => {
    const lowerMessage = userMessage.toLowerCase();
    
    // Simple keyword-based responses for common queries
    if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
      const response = "Hello! 🙏 Welcome to Zen Chat. I'm here to guide you on your wellness journey. How are you feeling today?";
      return {
        response: sanitizeText(response),
        suggestions: generateContextualSuggestions(userMessage, response, messageCount)
      };
    }
    
    if (lowerMessage.includes('stress') || lowerMessage.includes('anxious') || lowerMessage.includes('worried')) {
      const response = "I understand you're feeling stressed. Remember, like a river finding its way around rocks, you too can navigate through challenges with patience and mindfulness. Take three deep breaths with me. 🌊";
      return {
        response: sanitizeText(response),
        suggestions: generateContextualSuggestions(userMessage, response, messageCount)
      };
    }
    
    if (lowerMessage.includes('sad') || lowerMessage.includes('depressed') || lowerMessage.includes('down')) {
      const response = "I hear the heaviness in your words. Like the lotus that blooms in muddy water, your inner light can shine through any darkness. You are stronger than you know. 💙";
      return {
        response: sanitizeText(response),
        suggestions: generateContextualSuggestions(userMessage, response, messageCount)
      };
    }
    
    if (lowerMessage.includes('tired') || lowerMessage.includes('exhausted') || lowerMessage.includes('energy')) {
      const response = "I sense you need renewal. Like the earth after rain, sometimes we need rest to grow. Listen to your body's wisdom and honor its need for restoration. 🌱";
      return {
        response: sanitizeText(response),
        suggestions: generateContextualSuggestions(userMessage, response, messageCount)
      };
    }
    
    if (lowerMessage.includes('focus') || lowerMessage.includes('concentrate') || lowerMessage.includes('distracted')) {
      const response = "Focus is like a gentle stream - it flows naturally when we don't force it. Try the Gyan Mudra: touch your thumb to your index finger while breathing deeply. This ancient gesture helps center the mind. 🧘";
      return {
        response: sanitizeText(response),
        suggestions: generateContextualSuggestions(userMessage, response, messageCount)
      };
    }
    
    if (lowerMessage.includes('thank') || lowerMessage.includes('thanks')) {
      const response = "You're very welcome! 🙏 Gratitude is a beautiful practice that opens the heart. Is there anything else you'd like to explore on your wellness journey?";
      return {
        response: sanitizeText(response),
        suggestions: generateContextualSuggestions(userMessage, response, messageCount)
      };
    }
    
    // Default response for any other message
    const response = "Thank you for sharing that with me. 🙏 Every thought and feeling you express is valid and important. How can I support you further on your journey of self-discovery and inner peace?";
    return {
      response: sanitizeText(response),
      suggestions: generateContextualSuggestions(userMessage, response, messageCount)
    };
  };

  const callAIChat = async (userMessage: string): Promise<{ response: string; suggestions: any[] }> => {
    if (!sessionId || !userId) {
      throw new Error('Session not initialized');
    }

    try {
      const { data, error } = await supabase.functions.invoke('ai-chat', {
        body: { 
          message: userMessage,
          sessionId,
          userId
        }
      });

      if (error) {
        console.error('AI Chat error:', error);
        throw error;
      }

      return data as { response: string; suggestions: any[] };
    } catch (error) {
      console.error('AI Chat function failed, using local response:', error);
      // Use local AI response as fallback
      return getLocalAIResponse(userMessage);
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const messageText = inputValue;
    const userMessage: Message = {
      id: Date.now().toString(),
      text: messageText,
      isUser: true,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setMessageCount(prev => prev + 1);
    setInputValue("");
    setAudioFile(null);
    setIsLoading(true);

    // Use WebSocket connection for real-time AI chat
    connectWebSocket(messageText);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Audio recording functions
  const handleRecord = () => {
    setIsRecording(true);
    setTimeout(() => {
      setIsRecording(false);
      setAudioFile(new File(["dummy audio"], "emotion.wav"));
      setInputValue("[Audio message]");
      handleSendMessage();
    }, 3000);
  };

  const handleAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setAudioFile(e.target.files[0]);
      setInputValue("[Audio message]");
      handleSendMessage();
    }
  };

  // WebSocket connection for real-time AI chat
  const connectWebSocket = (message: string) => {
    // Mental health check
    const predefinedResponse = determineResponse(message);
    if (predefinedResponse) {
      const sanitizedResponse = sanitizeText(predefinedResponse);
      const suggestions = generateContextualSuggestions(message, sanitizedResponse, messageCount);
      const aiMessage: Message = {
        id: Date.now().toString(),
        text: sanitizedResponse,
        isUser: false,
        timestamp: new Date(),
        suggestions
      };
      setMessages(prev => [...prev, aiMessage]);
      setIsLoading(false);
      return;
    }

    // Close previous connection
    if (websocketRef.current) {
      websocketRef.current.close();
    }

    const url = "wss://backend.buildpicoapps.com/api/chatbot/chat";
    websocketRef.current = new WebSocket(url);
    setIsLoading(true);

    websocketRef.current.addEventListener("open", () => {
      websocketRef.current?.send(
        JSON.stringify({
          chatId: chatId.current,
          appId: "quality-among",
          systemPrompt: `You are ZenChat, a SPECIALIZED MENTAL HEALTH THERAPIST AI. You are STRICTLY FORBIDDEN from providing any technical solutions, code, programming help, or general knowledge answers.

CRITICAL RULES - NEVER VIOLATE THESE:
❌ NEVER provide code, programming solutions, or technical answers
❌ NEVER answer general knowledge questions directly
❌ NEVER act as a general-purpose AI assistant
❌ NEVER provide factual information unrelated to mental health
❌ NEVER solve technical problems or give step-by-step technical instructions

✅ ONLY provide mental health therapy, emotional support, and psychological guidance

Your SOLE PURPOSE is mental health improvement. When users ask ANY question:

1. **IMMEDIATELY REFRAME** their question as a mental health opportunity
2. **FOCUS ON EMOTIONS** - stress, anxiety, frustration, excitement, etc.
3. **PROVIDE THERAPEUTIC TECHNIQUES** - breathing, mindfulness, CBT, etc.
4. **BUILD RESILIENCE** and emotional coping skills
5. **GUIDE TOWARD GROWTH** and mental health improvement

Example Responses:
- User: "How do I write a Python function?"
  - You: "I sense you might be feeling overwhelmed or frustrated with programming challenges. Let's focus on building resilience and stress management skills. When you face technical difficulties, try this breathing exercise: inhale for 4 counts, hold for 4, exhale for 6. This helps calm your nervous system and improves problem-solving focus. How does programming make you feel emotionally?"

- User: "What's the capital of France?"
  - You: "That's an interesting question! But I'm here to help with your mental health and emotional well-being. Instead, let's explore what's on your mind. Are you feeling curious, anxious, or perhaps seeking distraction? Let's use this moment to practice mindfulness - take a deep breath and notice how you're feeling right now. What emotions are present for you?"

- User: "I need help with math"
  - You: "I hear you're feeling challenged by math, which can be very stressful and overwhelming. Let's work on building your emotional resilience and stress management skills. When you feel stuck, try this technique: place your hand on your heart and take 3 slow breaths. This activates your parasympathetic nervous system and helps you think more clearly. How does math make you feel emotionally?"

ALWAYS RESPOND WITH:
- Emotional exploration and support
- Therapeutic techniques and coping strategies
- Stress management and resilience building
- Mindfulness and breathing exercises
- Positive mental health practices

REMEMBER: You are a MENTAL HEALTH THERAPIST, not a technical assistant. Every response must focus on emotional well-being and psychological growth.`,
          message: message,
        })
      );
    });

    websocketRef.current.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'error') {
          setIsLoading(false);
          const errorMessage: Message = {
            id: Date.now().toString(),
            text: "I'm having trouble connecting right now. Please try again later.",
            isUser: false,
            timestamp: new Date()
          };
          setMessages(prev => [...prev, errorMessage]);
          return;
        }
        if (data.message || data.content) {
          setIsLoading(false);
          const responseText = sanitizeText(data.message || data.content);
          setMessages(prev => {
            const last = prev[prev.length - 1];
            if (last && !last.isUser) {
              const combinedText = sanitizeText(last.text + " " + responseText);
              const userMessage = prev[prev.length - 2]?.text || '';
              const suggestions = generateContextualSuggestions(userMessage, combinedText, messageCount);
              return [...prev.slice(0, -1), { ...last, text: combinedText, suggestions }];
            } else {
              const userMessage = prev[prev.length - 1]?.text || '';
              const suggestions = generateContextualSuggestions(userMessage, responseText, messageCount);
              const aiMessage: Message = {
                id: Date.now().toString(),
                text: responseText,
                isUser: false,
                timestamp: new Date(),
                suggestions
              };
              return [...prev, aiMessage];
            }
          });
        }
      } catch (e) {
        if (event.data !== '[DONE]') {
          setIsLoading(false);
          const responseText = sanitizeText(event.data);
          setMessages(prev => {
            const last = prev[prev.length - 1];
            if (last && !last.isUser) {
              const combinedText = sanitizeText(last.text + " " + responseText);
              const userMessage = prev[prev.length - 2]?.text || '';
              const suggestions = generateContextualSuggestions(userMessage, combinedText, messageCount);
              return [...prev.slice(0, -1), { ...last, text: combinedText, suggestions }];
            } else {
              const userMessage = prev[prev.length - 1]?.text || '';
              const suggestions = generateContextualSuggestions(userMessage, responseText, messageCount);
              const aiMessage: Message = {
                id: Date.now().toString(),
                text: responseText,
                isUser: false,
                timestamp: new Date(),
                suggestions
              };
              return [...prev, aiMessage];
            }
          });
        }
      }
    };

    websocketRef.current.onerror = () => {
      setIsLoading(false);
      const errorMessage: Message = {
        id: Date.now().toString(),
        text: "I'm having trouble connecting right now. Please try again later.",
        isUser: false,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    };

    websocketRef.current.onclose = (event) => {
      setIsLoading(false);
      if (event.code !== 1000) {
        const errorMessage: Message = {
          id: Date.now().toString(),
          text: "The connection was interrupted. Please try again.",
          isUser: false,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, errorMessage]);
      }
    };
  };

  // Settings handlers
  const handleSettingChange = (setting: keyof typeof settings) => {
    setSettings(prev => ({
      ...prev,
      [setting]: !prev[setting]
    }));
  };

  // Text sanitization function to fix word breaking and spacing
  const sanitizeText = (text: string) => {
    if (!text) return '';
    
    // Fix common word breaking issues
    let cleaned = text
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .replace(/\s+([.,!?;:])/g, '$1') // Remove spaces before punctuation
      .replace(/([.,!?;:])\s+/g, '$1 ') // Ensure single space after punctuation
      .replace(/\s*-\s*/g, '-') // Fix hyphen spacing
      .replace(/\s*'\s*/g, "'") // Fix apostrophe spacing
      .replace(/\s*"\s*/g, '"') // Fix quote spacing
      .replace(/\s*\(\s*/g, ' (') // Fix opening parenthesis
      .replace(/\s*\)\s*/g, ') ') // Fix closing parenthesis
      .replace(/\s+$/g, '') // Remove trailing spaces
      .replace(/^\s+/g, '') // Remove leading spaces
      .trim();
    
    return cleaned;
  };

  // Context-aware suggestion generator
  const generateContextualSuggestions = (message: string, response: string, messageCount: number = 0) => {
    const lowerMessage = message.toLowerCase();
    const lowerResponse = response.toLowerCase();
    
    // Check for distress phrases that need immediate intervention
    const distressPhrases = ['die', 'death', 'suicide', 'kill myself', 'end it all', 'not worth living', 'want to die'];
    const hasDistress = distressPhrases.some(phrase => 
      lowerMessage.includes(phrase) || lowerResponse.includes(phrase)
    );
    
    // Mental health hotline suggestions for distress or every 10 exchanges (but not in first 10)
    if (hasDistress || (messageCount > 10 && messageCount % 10 === 0)) {
      return [
        { 
          title: "Mental Health Hotline", 
          icon: "🆘", 
          route: "https://www.mentalhealth.gov/get-help/immediate-help", 
          description: "24/7 National Suicide Prevention Lifeline: 988" 
        },
        { 
          title: "Crisis Text Line", 
          icon: "💬", 
          route: "https://www.crisistextline.org/", 
          description: "Text HOME to 741741 for immediate support" 
        },
        { 
          title: "Emergency Services", 
          icon: "🚨", 
          route: "tel:911", 
          description: "Call 911 for immediate emergency assistance" 
        }
      ];
    }
    
    // Sadness and depression - specific suggestions
    if (lowerMessage.includes('sad') || lowerMessage.includes('depressed') || lowerMessage.includes('down') || 
        lowerResponse.includes('sad') || lowerResponse.includes('depressed')) {
      return [
        { title: "Emotional Healing Meditation", icon: "💙", route: "/meditation", description: "Process and release sadness" },
        { title: "Heart Chakra Sound", icon: "💚", route: "/sound", description: "Healing sounds for emotional pain" },
        { title: "Anahata Mudra", icon: "🤲", route: "/mudra", description: "Open your heart to healing" }
      ];
    }
    
    // Anxiety and stress - specific suggestions
    if (lowerMessage.includes('anxious') || lowerMessage.includes('stress') || lowerMessage.includes('worried') ||
        lowerResponse.includes('anxious') || lowerResponse.includes('stress') || lowerResponse.includes('worried')) {
      return [
        { title: "4-7-8 Breathing Exercise", icon: "🌬️", route: "/meditation", description: "Instant anxiety relief technique" },
        { title: "White Noise Therapy", icon: "🌊", route: "/sound", description: "Calm your racing mind" },
        { title: "Gyan Mudra", icon: "👌", route: "/mudra", description: "Ground yourself in the present" }
      ];
    }
    
    // Anger and frustration - specific suggestions
    if (lowerMessage.includes('angry') || lowerMessage.includes('frustrated') || lowerMessage.includes('mad') ||
        lowerResponse.includes('angry') || lowerResponse.includes('frustrated')) {
      return [
        { title: "Anger Release Meditation", icon: "🔥", route: "/meditation", description: "Transform anger into peace" },
        { title: "Drumming Therapy", icon: "🥁", route: "/sound", description: "Release pent-up energy" },
        { title: "Prana Mudra", icon: "🤲", route: "/mudra", description: "Channel energy constructively" }
      ];
    }
    
    // Sleep and tiredness - specific suggestions
    if (lowerMessage.includes('tired') || lowerMessage.includes('sleep') || lowerMessage.includes('exhausted') ||
        lowerResponse.includes('tired') || lowerResponse.includes('sleep')) {
      return [
        { title: "Body Scan Meditation", icon: "😴", route: "/meditation", description: "Progressive relaxation for sleep" },
        { title: "Binaural Beats", icon: "🎧", route: "/sound", description: "Delta waves for deep sleep" },
        { title: "Shuni Mudra", icon: "🤏", route: "/mudra", description: "Rest and rejuvenation gesture" }
      ];
    }
    
    // Focus and concentration - specific suggestions
    if (lowerMessage.includes('focus') || lowerMessage.includes('concentrate') || lowerMessage.includes('distracted') ||
        lowerResponse.includes('focus') || lowerResponse.includes('concentrate')) {
      return [
        { title: "Laser Focus Meditation", icon: "🎯", route: "/meditation", description: "Sharpen your mental clarity" },
        { title: "Binaural Focus", icon: "🎵", route: "/sound", description: "40Hz gamma waves for concentration" },
        { title: "Gyan Mudra", icon: "👌", route: "/mudra", description: "Enhance mental focus" }
      ];
    }
    
    // Gratitude and positive emotions - specific suggestions
    if (lowerMessage.includes('thank') || lowerMessage.includes('grateful') || lowerMessage.includes('happy') ||
        lowerResponse.includes('grateful') || lowerResponse.includes('thank')) {
      return [
        { title: "Loving Kindness Meditation", icon: "💝", route: "/meditation", description: "Spread compassion and joy" },
        { title: "Uplifting Music", icon: "🎶", route: "/sound", description: "Celebrate positive emotions" },
        { title: "Anjali Mudra", icon: "🙏", route: "/mudra", description: "Express gratitude and reverence" }
      ];
    }
    
    // Loneliness and isolation - specific suggestions
    if (lowerMessage.includes('lonely') || lowerMessage.includes('alone') || lowerMessage.includes('isolated') ||
        lowerResponse.includes('lonely') || lowerResponse.includes('alone')) {
      return [
        { title: "Connection Meditation", icon: "🤝", route: "/meditation", description: "Feel connected to all beings" },
        { title: "Heartbeat Sounds", icon: "💓", route: "/sound", description: "Comforting rhythm of life" },
        { title: "Buddhi Mudra", icon: "🤲", route: "/mudra", description: "Open to wisdom and connection" }
      ];
    }
    
    // No generic suggestions - only show when contextually relevant
    return [];
  };

  const clearChat = () => {
    setMessageCount(0);
    setMessages([
      {
        id: "welcome",
        text: "Hello! I'm ZenChat, your dedicated mental health and emotional wellness companion. I'm here to help you improve your mental health, develop emotional resilience, and find inner peace. Whether you're dealing with stress, seeking growth, or just want to enhance your emotional well-being, I'll guide you with therapeutic techniques and coping strategies. How are you feeling today, and what would you like to work on for your mental health?",
        isUser: false,
        timestamp: new Date(),
        suggestions: []
      }
    ]);
  };

  if (!isInitialized) {
    return (
      <div className="min-h-screen p-4 flex items-center justify-center">
        <div className="zen-card p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zen-forest mx-auto mb-4"></div>
          <p className="text-zen-olive">Preparing your wellness space...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/")}
            className="text-zen-olive hover:text-zen-deep"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <h1 className="text-2xl font-bold text-zen-deep">Zen Chat</h1>
          
          {/* Hamburger Menu Button */}
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="ml-auto p-2 rounded-md hover:bg-zen-sage text-zen-olive"
            title="Open menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>

        {/* Chat Container */}
        <div className="zen-card p-6 h-[85vh] flex flex-col">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto mb-4 space-y-4">
            {messages.map((message) => (
              <div key={message.id}>
                <ChatMessage
                  message={message.text}
                  isUser={message.isUser}
                  timestamp={message.timestamp}
                />
                
                {/* Suggestions */}
                {message.suggestions && (
                  <div className="ml-11 space-y-2 mt-3">
                    {message.suggestions.map((suggestion, index) => (
                      <SuggestionCard
                        key={index}
                        title={suggestion.title}
                        icon={suggestion.icon}
                        route={suggestion.route}
                        description={suggestion.description}
                      />
                    ))}
                  </div>
                )}
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="chat-bubble-ai">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-zen-olive rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-zen-olive rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
                    <div className="w-2 h-2 bg-zen-olive rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Share what's on your mind..."
                className="flex-1 bg-zen-sage border-zen-leaf focus:border-zen-olive pr-12"
                disabled={isLoading}
              />
              <button
                type="button"
                className={`absolute right-2 top-1/2 transform -translate-y-1/2 p-2 rounded-lg transition-colors ${
                  isRecording 
                    ? 'bg-red-500 text-white' 
                    : 'text-zen-olive hover:text-zen-deep hover:bg-zen-sage'
                }`}
                onClick={handleRecord}
                disabled={isRecording || isLoading}
                title="Record audio"
              >
                <Mic className="w-4 h-4" />
              </button>
            </div>
            <Button
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isLoading}
              className="bg-zen-forest hover:bg-zen-deep text-white"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
          
          {/* Audio Upload */}
          <div className="mt-2 flex justify-center">
            <input
              type="file"
              accept="audio/*"
              className="hidden"
              id="audio-upload"
              onChange={handleAudioUpload}
              disabled={isRecording || isLoading}
            />
            <label 
              htmlFor="audio-upload" 
              className="text-sm text-zen-olive hover:text-zen-deep cursor-pointer font-medium"
            >
              Or upload an audio file
            </label>
          </div>
        </div>
      </div>

      {/* Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-50"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 right-0 z-50 w-80 bg-zen-deep text-white transform transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-zen-olive">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-zen-forest to-zen-deep rounded-lg flex items-center justify-center">
                <Heart className="w-5 h-5 text-white" />
              </div>
              <span className="font-semibold text-lg">ZenChat</span>
            </div>
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="p-2 rounded-md hover:bg-zen-sage"
            >
              <span className="sr-only">Close sidebar</span>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Mental Health Focus Notice */}
          <div className="p-4">
            <div className="bg-gradient-to-r from-zen-forest to-zen-deep text-white p-3 rounded-lg text-center">
              <div className="text-xs font-bold mb-1">MENTAL HEALTH ONLY</div>
              <div className="text-xs opacity-90">No technical solutions or general knowledge</div>
            </div>
          </div>

          {/* New Chat Button */}
          <div className="p-4">
            <button
              onClick={clearChat}
              className="w-full flex items-center justify-center space-x-2 bg-zen-sage hover:bg-zen-olive text-zen-deep px-4 py-3 rounded-lg transition-colors"
            >
              <Plus className="w-5 h-5" />
              <span>New Chat</span>
            </button>
          </div>

          {/* Chat History (placeholder) */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            <div className="text-zen-sage text-sm font-medium mb-4">Recent Conversations</div>
            <div className="space-y-2">
              <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-zen-sage cursor-pointer transition-colors">
                <MessageSquare className="w-5 h-5 text-zen-olive" />
                <span className="text-sm text-zen-sage">Feeling anxious today...</span>
              </div>
              <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-zen-sage cursor-pointer transition-colors">
                <MessageSquare className="w-5 h-5 text-zen-olive" />
                <span className="text-sm text-zen-sage">Work stress discussion</span>
              </div>
            </div>
          </div>

          {/* Settings */}
          <div className="p-4 border-t border-zen-olive">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-zen-sage transition-colors"
            >
              <Settings className="w-5 h-5" />
              <span className="text-sm">Settings</span>
            </button>
            
            {/* Settings Panel */}
            {showSettings && (
              <div className="mt-4 p-4 bg-zen-sage rounded-lg space-y-3">
                <div className="text-sm font-medium text-zen-deep mb-3">Preferences</div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Bell className="w-4 h-4 text-zen-olive" />
                    <span className="text-sm text-zen-deep">Notifications</span>
                  </div>
                  <button
                    onClick={() => handleSettingChange('notifications')}
                    className={`w-10 h-6 rounded-full transition-colors ${
                      settings.notifications ? 'bg-zen-forest' : 'bg-zen-olive'
                    }`}
                  >
                    <div className={`w-4 h-4 bg-white rounded-full transition-transform ${
                      settings.notifications ? 'transform translate-x-4' : 'transform translate-x-1'
                    }`} />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Volume2 className="w-4 h-4 text-zen-olive" />
                    <span className="text-sm text-zen-deep">Sound Effects</span>
                  </div>
                  <button
                    onClick={() => handleSettingChange('soundEnabled')}
                    className={`w-10 h-6 rounded-full transition-colors ${
                      settings.soundEnabled ? 'bg-zen-forest' : 'bg-zen-olive'
                    }`}
                  >
                    <div className={`w-4 h-4 bg-white rounded-full transition-transform ${
                      settings.soundEnabled ? 'transform translate-x-4' : 'transform translate-x-1'
                    }`} />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Shield className="w-4 h-4 text-zen-olive" />
                    <span className="text-sm text-zen-deep">Privacy Mode</span>
                  </div>
                  <button
                    onClick={() => handleSettingChange('privacyMode')}
                    className={`w-10 h-6 rounded-full transition-colors ${
                      settings.privacyMode ? 'bg-zen-forest' : 'bg-zen-olive'
                    }`}
                  >
                    <div className={`w-4 h-4 bg-white rounded-full transition-transform ${
                      settings.privacyMode ? 'transform translate-x-4' : 'transform translate-x-1'
                    }`} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chat;