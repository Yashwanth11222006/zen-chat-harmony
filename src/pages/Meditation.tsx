import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Play, Pause, RotateCcw } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Meditation = () => {
  const navigate = useNavigate();
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  const handlePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleReset = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      setCurrentTime(0);
      setIsPlaying(false);
      audioRef.current.pause();
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const returnToChat = () => {
    navigate("/chat", { 
      state: { 
        fromWellness: true, 
        sessionType: "meditation" 
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
          <h1 className="text-2xl font-bold text-zen-deep">Guided Meditation</h1>
        </div>

        {/* Meditation Container */}
        <div className="zen-card p-8 text-center">
          <div className="space-y-8">
            {/* Meditation Visual */}
            <div className="w-48 h-48 mx-auto bg-zen-mint rounded-full flex items-center justify-center relative overflow-hidden">
              <div className="w-32 h-32 bg-zen-forest rounded-full opacity-60 animate-pulse"></div>
              <div className="absolute inset-0 bg-zen-sage opacity-20 animate-ping"></div>
            </div>

            {/* Session Info */}
            <div className="space-y-2">
              <h2 className="text-xl font-semibold text-zen-deep">Mindful Breathing</h2>
              <p className="text-zen-olive">A 10-minute guided session for inner peace</p>
            </div>

            {/* Audio Player */}
            <div className="space-y-6">
              <audio
                ref={audioRef}
                onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
                onEnded={() => setIsPlaying(false)}
                className="hidden"
              >
                <source src="/meditation-sample.mp3" type="audio/mpeg" />
                Your browser does not support the audio element.
              </audio>

              {/* Time Display */}
              <div className="text-2xl font-mono text-zen-deep">
                {formatTime(currentTime)} / 10:00
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-zen-sage rounded-full h-2">
                <div 
                  className="bg-zen-forest h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(currentTime / 600) * 100}%` }}
                ></div>
              </div>

              {/* Controls */}
              <div className="flex justify-center gap-4">
                <Button
                  onClick={handleReset}
                  variant="outline"
                  size="lg"
                  className="zen-button bg-zen-mint border-zen-olive"
                >
                  <RotateCcw className="w-5 h-5" />
                </Button>
                
                <Button
                  onClick={handlePlayPause}
                  size="lg"
                  className="zen-button bg-zen-forest hover:bg-zen-deep text-white w-16 h-16 rounded-full"
                >
                  {isPlaying ? (
                    <Pause className="w-6 h-6" />
                  ) : (
                    <Play className="w-6 h-6 ml-1" />
                  )}
                </Button>
              </div>
            </div>

            {/* Instructions */}
            <div className="bg-zen-sage/50 rounded-xl p-6 text-left">
              <h3 className="font-semibold text-zen-deep mb-3">Meditation Guide:</h3>
              <ul className="space-y-2 text-sm text-zen-olive">
                <li>• Find a comfortable seated position</li>
                <li>• Close your eyes and focus on your breath</li>
                <li>• Let thoughts come and go without judgment</li>
                <li>• Return attention to your breathing when distracted</li>
                <li>• Practice with kindness toward yourself</li>
              </ul>
            </div>

            {/* Return Button */}
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
  );
};

export default Meditation;