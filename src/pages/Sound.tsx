import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Play, Pause, Volume2, VolumeX } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Sound = () => {
  const navigate = useNavigate();
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(70);
  const audioRef = useRef<HTMLAudioElement>(null);

  const soundTracks = [
    { name: "Tibetan Singing Bowls", duration: "15:00", file: "tibetan-bowls.mp3" },
    { name: "Nature Sounds", duration: "20:00", file: "nature-sounds.mp3" },
    { name: "Crystal Healing Tones", duration: "12:00", file: "crystal-tones.mp3" },
    { name: "Ocean Waves", duration: "25:00", file: "ocean-waves.mp3" }
  ];

  const [selectedTrack, setSelectedTrack] = useState(0);

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

  const handleVolumeChange = (newVolume: number) => {
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume / 100;
    }
  };

  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
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
        sessionType: "sound healing" 
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
          <h1 className="text-2xl font-bold text-zen-deep">Sound Healing</h1>
        </div>

        {/* Sound Healing Container */}
        <div className="zen-card p-8">
          <div className="space-y-8">
            {/* Visualization */}
            <div className="text-center">
              <div className="w-56 h-56 mx-auto bg-zen-mint rounded-full flex items-center justify-center relative overflow-hidden mb-6">
                <div className="w-32 h-32 bg-zen-forest rounded-full opacity-40 animate-pulse"></div>
                <div className="absolute inset-0 bg-zen-sage opacity-10 animate-ping" style={{ animationDuration: '3s' }}></div>
                <div className="absolute inset-0 bg-zen-olive opacity-5 animate-ping" style={{ animationDuration: '4s', animationDelay: '1s' }}></div>
              </div>
              <h2 className="text-xl font-semibold text-zen-deep">Therapeutic Sound Therapy</h2>
              <p className="text-zen-olive">Harmonious frequencies for deep relaxation</p>
            </div>

            {/* Track Selection */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-zen-deep">Choose Your Healing Sound:</h3>
              <div className="grid gap-2">
                {soundTracks.map((track, index) => (
                  <div
                    key={index}
                    className={`suggestion-card cursor-pointer ${
                      selectedTrack === index ? 'bg-zen-mint border-zen-forest' : ''
                    }`}
                    onClick={() => setSelectedTrack(index)}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="font-medium text-zen-deep">{track.name}</h4>
                        <p className="text-sm text-zen-olive">{track.duration}</p>
                      </div>
                      {selectedTrack === index && (
                        <div className="w-3 h-3 bg-zen-forest rounded-full"></div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Audio Player */}
            <div className="space-y-6">
              <audio
                ref={audioRef}
                onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
                onEnded={() => setIsPlaying(false)}
                className="hidden"
              >
                <source src={`/${soundTracks[selectedTrack].file}`} type="audio/mpeg" />
                Your browser does not support the audio element.
              </audio>

              {/* Now Playing */}
              <div className="text-center bg-zen-sage/30 rounded-xl p-4">
                <p className="text-sm text-zen-olive mb-1">Now Playing</p>
                <p className="font-semibold text-zen-deep">{soundTracks[selectedTrack].name}</p>
              </div>

              {/* Time and Progress */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-zen-olive">
                  <span>{formatTime(currentTime)}</span>
                  <span>{soundTracks[selectedTrack].duration}</span>
                </div>
                <div className="w-full bg-zen-sage rounded-full h-2">
                  <div 
                    className="bg-zen-forest h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(currentTime / 900) * 100}%` }}
                  ></div>
                </div>
              </div>

              {/* Controls */}
              <div className="flex items-center justify-center gap-6">
                {/* Volume */}
                <div className="flex items-center gap-2">
                  <Button
                    onClick={toggleMute}
                    variant="ghost"
                    size="sm"
                    className="text-zen-olive hover:text-zen-deep"
                  >
                    {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                  </Button>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={volume}
                    onChange={(e) => handleVolumeChange(Number(e.target.value))}
                    className="w-20 accent-zen-forest"
                  />
                </div>

                {/* Play/Pause */}
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

            {/* Benefits */}
            <div className="bg-zen-sage/50 rounded-xl p-6">
              <h3 className="font-semibold text-zen-deep mb-3">Sound Healing Benefits:</h3>
              <div className="grid md:grid-cols-2 gap-3 text-sm text-zen-olive">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-zen-forest rounded-full"></div>
                  Reduces stress and anxiety
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-zen-forest rounded-full"></div>
                  Improves sleep quality
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-zen-forest rounded-full"></div>
                  Balances chakras and energy
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-zen-forest rounded-full"></div>
                  Enhances meditation practice
                </div>
              </div>
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

export default Sound;