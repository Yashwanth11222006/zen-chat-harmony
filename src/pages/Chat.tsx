import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, ArrowLeft } from "lucide-react";
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
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        // For demo purposes, create an anonymous session
        const anonymousUserId = 'anonymous_' + Date.now();
        setUserId(anonymousUserId);
        await createNewSession(anonymousUserId);
        return;
      }

      setUserId(user.id);
      
      // Get or create user profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (!profile) {
        await supabase
          .from('profiles')
          .insert({ user_id: user.id, display_name: user.email });
      }

      // Get or create active session
      const { data: sessions } = await supabase
        .from('chat_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1);

      if (sessions && sessions.length > 0) {
        setSessionId(sessions[0].id);
        await loadChatHistory(sessions[0].id);
      } else {
        await createNewSession(user.id);
      }

    } catch (error) {
      console.error('Error initializing chat:', error);
      // Fallback to anonymous session
      const anonymousUserId = 'anonymous_' + Date.now();
      setUserId(anonymousUserId);
      await createNewSession(anonymousUserId);
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

      if (error) throw error;

      setSessionId(session.id);
      
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
      toast({
        title: "Connection Issue",
        description: "Having trouble connecting. You can still chat, but messages won't be saved.",
        variant: "destructive"
      });
      setIsInitialized(true);
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

  const callAIChat = async (userMessage: string): Promise<{ response: string; suggestions: any[] }> => {
    if (!sessionId || !userId) {
      throw new Error('Session not initialized');
    }

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

    return data;
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading || !sessionId || !userId) return;

    const messageText = inputValue;
    const userMessage: Message = {
      id: Date.now().toString(),
      text: messageText,
      isUser: true,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

    try {
      const { response, suggestions } = await callAIChat(messageText);
      
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: response,
        isUser: false,
        timestamp: new Date(),
        suggestions: suggestions || []
      };
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error("Error generating AI response:", error);
      
      // Fallback response
      const fallbackMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "I'm experiencing some difficulties right now. Let me share some wisdom: even in uncertainty, there is an opportunity for growth. Take a deep breath and try again in a moment. 🌱",
        isUser: false,
        timestamp: new Date(),
        suggestions: [
          {
            title: "Try Meditation",
            icon: "🧘",
            route: "/meditation",
            description: "Find peace in the present moment"
          }
        ]
      };
      setMessages(prev => [...prev, fallbackMessage]);
      
      toast({
        title: "Connection Issue",
        description: "Having trouble connecting to AI. You can still use the wellness features.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
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
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Share what's on your mind..."
              className="flex-1 bg-zen-sage border-zen-leaf focus:border-zen-olive"
              disabled={isLoading}
            />
            <Button
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isLoading}
              className="bg-zen-forest hover:bg-zen-deep text-white"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chat;