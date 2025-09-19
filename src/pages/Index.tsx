import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sparkles, Heart, Leaf } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="text-center space-y-8 zen-card p-12 max-w-lg">
        <div className="space-y-4">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-zen-forest rounded-full flex items-center justify-center">
              <Leaf className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-zen-deep">Zen Chat</h1>
          <p className="text-lg text-zen-olive max-w-md">
            Your mindful companion for meditation, wellness, and inner peace. 
            Let's begin your journey to tranquility.
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button 
            onClick={() => navigate("/chat")}
            className="zen-button bg-zen-forest hover:bg-zen-deep text-white"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Start Chatting
          </Button>
          
          <Button 
            variant="outline"
            onClick={() => navigate("/meditation")}
            className="zen-button bg-zen-mint hover:bg-zen-leaf border-zen-olive"
          >
            <Heart className="w-4 h-4 mr-2" />
            Quick Meditation
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Index;