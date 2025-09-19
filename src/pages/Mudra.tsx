import { Button } from "@/components/ui/button";
import { ArrowLeft, Hand } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Mudra = () => {
  const navigate = useNavigate();

  const returnToChat = () => {
    navigate("/chat", { 
      state: { 
        fromWellness: true, 
        sessionType: "mudra" 
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
          <h1 className="text-2xl font-bold text-zen-deep">Mudra Practice</h1>
        </div>

        {/* Mudra Container */}
        <div className="zen-card p-8">
          <div className="space-y-8">
            {/* Mudra Visual */}
            <div className="text-center">
              <div className="w-48 h-48 mx-auto bg-zen-mint rounded-full flex items-center justify-center mb-6">
                <Hand className="w-24 h-24 text-zen-forest" />
              </div>
              <h2 className="text-2xl font-bold text-zen-deep">Gyan Mudra</h2>
              <p className="text-zen-olive">The Gesture of Knowledge</p>
            </div>

            {/* Instructions */}
            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-zen-deep">How to Practice:</h3>
                <div className="space-y-3 text-zen-olive">
                  <div className="flex items-start gap-3">
                    <span className="w-6 h-6 bg-zen-forest text-white rounded-full flex items-center justify-center text-sm font-medium mt-0.5">1</span>
                    <p>Sit comfortably with your spine straight</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="w-6 h-6 bg-zen-forest text-white rounded-full flex items-center justify-center text-sm font-medium mt-0.5">2</span>
                    <p>Touch the tip of your index finger to the tip of your thumb</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="w-6 h-6 bg-zen-forest text-white rounded-full flex items-center justify-center text-sm font-medium mt-0.5">3</span>
                    <p>Keep the other three fingers straight and relaxed</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="w-6 h-6 bg-zen-forest text-white rounded-full flex items-center justify-center text-sm font-medium mt-0.5">4</span>
                    <p>Rest your hands on your knees, palms facing up</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="w-6 h-6 bg-zen-forest text-white rounded-full flex items-center justify-center text-sm font-medium mt-0.5">5</span>
                    <p>Hold for 5-15 minutes while breathing deeply</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-zen-deep">Benefits:</h3>
                <div className="bg-zen-sage/50 rounded-xl p-6">
                  <ul className="space-y-3 text-zen-olive">
                    <li className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-zen-forest rounded-full"></div>
                      Enhances concentration and memory
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-zen-forest rounded-full"></div>
                      Calms the nervous system
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-zen-forest rounded-full"></div>
                      Improves wisdom and knowledge
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-zen-forest rounded-full"></div>
                      Reduces stress and anxiety
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-zen-forest rounded-full"></div>
                      Balances the air element in body
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Practice Timer */}
            <div className="text-center bg-zen-mint/30 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-zen-deep mb-4">Practice Duration</h3>
              <div className="flex justify-center gap-4">
                <Button variant="outline" className="zen-button bg-zen-sage border-zen-olive">
                  5 min
                </Button>
                <Button variant="outline" className="zen-button bg-zen-sage border-zen-olive">
                  10 min
                </Button>
                <Button variant="outline" className="zen-button bg-zen-sage border-zen-olive">
                  15 min
                </Button>
              </div>
              <p className="text-sm text-zen-olive mt-4">
                Start with shorter sessions and gradually increase duration
              </p>
            </div>

            {/* Return Button */}
            <div className="text-center">
              <Button
                onClick={returnToChat}
                className="zen-button bg-zen-olive hover:bg-zen-forest text-white"
              >
                Return to Chat
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Mudra;