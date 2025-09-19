import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Send, User, Mail, MessageSquare } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

const Mentor = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    query: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.query) {
      toast({
        title: "Please fill in all fields",
        description: "All fields are required to connect with a mentor.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    
    // Simulate form submission
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    toast({
      title: "Request sent successfully!",
      description: "A wellness mentor will contact you within 24 hours.",
    });
    
    setIsSubmitting(false);
    
    // Navigate back to chat after a brief delay
    setTimeout(() => {
      navigate("/chat", { 
        state: { 
          fromWellness: true, 
          sessionType: "mentor consultation" 
        } 
      });
    }, 2000);
  };

  const returnToChat = () => {
    navigate("/chat", { 
      state: { 
        fromWellness: true, 
        sessionType: "mentor consultation" 
      } 
    });
  };

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/")}
            className="text-zen-olive hover:text-zen-deep"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Home
          </Button>
          <h1 className="text-2xl font-bold text-zen-deep">Talk to Mentor</h1>
        </div>

        {/* Mentor Container */}
        <div className="zen-card p-8">
          <div className="space-y-8">
            {/* Header Section */}
            <div className="text-center space-y-4">
              <div className="w-20 h-20 bg-zen-forest rounded-full flex items-center justify-center mx-auto">
                <User className="w-10 h-10 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-zen-deep">Connect with a Wellness Mentor</h2>
                <p className="text-zen-olive">Get personalized guidance on your wellness journey</p>
              </div>
            </div>

            {/* Mentor Benefits */}
            <div className="bg-zen-sage/50 rounded-xl p-6">
              <h3 className="font-semibold text-zen-deep mb-4">What to expect:</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-zen-forest rounded-full"></div>
                    <span className="text-sm text-zen-olive">Personalized wellness plan</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-zen-forest rounded-full"></div>
                    <span className="text-sm text-zen-olive">Mindfulness techniques</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-zen-forest rounded-full"></div>
                    <span className="text-sm text-zen-olive">Stress management strategies</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-zen-forest rounded-full"></div>
                    <span className="text-sm text-zen-olive">Meditation guidance</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-zen-forest rounded-full"></div>
                    <span className="text-sm text-zen-olive">Lifestyle recommendations</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-zen-forest rounded-full"></div>
                    <span className="text-sm text-zen-olive">Ongoing support</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                {/* Name Field */}
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-zen-deep font-medium">
                    <User className="w-4 h-4 inline mr-2" />
                    Full Name
                  </Label>
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Enter your full name"
                    className="bg-zen-sage border-zen-leaf focus:border-zen-olive"
                    required
                  />
                </div>

                {/* Email Field */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-zen-deep font-medium">
                    <Mail className="w-4 h-4 inline mr-2" />
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="Enter your email address"
                    className="bg-zen-sage border-zen-leaf focus:border-zen-olive"
                    required
                  />
                </div>

                {/* Query Field */}
                <div className="space-y-2">
                  <Label htmlFor="query" className="text-zen-deep font-medium">
                    <MessageSquare className="w-4 h-4 inline mr-2" />
                    Your Wellness Question
                  </Label>
                  <Textarea
                    id="query"
                    name="query"
                    value={formData.query}
                    onChange={handleInputChange}
                    placeholder="Share your wellness goals, challenges, or questions you'd like guidance on..."
                    className="bg-zen-sage border-zen-leaf focus:border-zen-olive min-h-[120px] resize-none"
                    required
                  />
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex gap-4 justify-center">
                <Button
                  type="button"
                  variant="outline"
                  onClick={returnToChat}
                  className="zen-button bg-zen-mint border-zen-olive"
                  disabled={isSubmitting}
                >
                  Back to Chat
                </Button>
                
                <Button
                  type="submit"
                  className="zen-button bg-zen-forest hover:bg-zen-deep text-white"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Connect with Mentor
                    </>
                  )}
                </Button>
              </div>
            </form>

            {/* Response Time */}
            <div className="text-center text-sm text-zen-olive bg-zen-mint/30 rounded-xl p-4">
              <p>✨ A certified wellness mentor will respond within 24 hours</p>
              <p>All consultations are confidential and personalized</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Mentor;