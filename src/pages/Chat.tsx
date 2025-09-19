import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, ArrowLeft } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import ChatMessage from "@/components/ChatMessage";
import SuggestionCard from "@/components/SuggestionCard";

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
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      text: "Welcome to Zen Chat! I'm here to guide you on your wellness journey. How are you feeling today?",
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
        },
        {
          title: "Talk to Mentor",
          icon: "👨‍🏫",
          route: "/mentor",
          description: "Connect with a wellness guide"
        }
      ]
    }
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Check if user is returning from a wellness page
  useEffect(() => {
    const state = location.state as { fromWellness?: boolean; sessionType?: string };
    if (state?.fromWellness) {
      const followUpMessage: Message = {
        id: Date.now().toString(),
        text: `Welcome back! How was your ${state.sessionType || 'wellness'} session? Did it help you feel calmer and more centered?`,
        isUser: false,
        timestamp: new Date(),
        suggestions: [
          {
            title: "Try Another Session",
            icon: "🔄",
            route: `/${state.sessionType || 'meditation'}`,
            description: "Continue your practice"
          },
          {
            title: "Explore Different Practice",
            icon: "✨",
            route: "/meditation",
            description: "Try something new"
          }
        ]
      };
      setMessages(prev => [...prev, followUpMessage]);
    }
  }, [location]);

  const simulateAIResponse = async (userMessage: string): Promise<string> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Simple response logic (replace with actual OpenAI API call)
    const responses = [
      "That's wonderful to hear. Mindfulness is a powerful practice for inner peace.",
      "I understand. Let's explore some techniques that might help you find balance.",
      "It's natural to feel that way. Would you like to try a guided meditation?",
      "Great question! Wellness is a journey, and every step counts.",
      "I'm here to support you. What aspect of wellness interests you most?"
    ];
    
    return responses[Math.floor(Math.random() * responses.length)];
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputValue,
      isUser: true,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

    try {
      const aiResponse = await simulateAIResponse(inputValue);
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: aiResponse,
        isUser: false,
        timestamp: new Date(),
        suggestions: [
          {
            title: "Guided Meditation",
            icon: "🧘",
            route: "/meditation",
            description: "10-minute mindfulness session"
          },
          {
            title: "Breathing Exercise",
            icon: "💨",
            route: "/sound",
            description: "Calming breath work"
          }
        ]
      };
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error("Error generating AI response:", error);
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
        <div className="zen-card p-6 h-[70vh] flex flex-col">
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