import { useState } from "react";
import { motion } from "framer-motion";
import { Mic, MicOff, Bike, Calendar, Trash2, Settings, Languages } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import VoiceVisualizer from "./voice-visualizer";
import ConversationHistory from "./conversation-history";
import SettingsModal from "./settings-modal";
import { useVoiceChat } from "@/hooks/use-voice-chat";
import { cn } from "@/lib/utils";

export function VoiceInterface() {
  const [showHistory, setShowHistory] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  
  const {
    isConnected,
    isRecording,
    isProcessing,
    currentStatus,
    statusSubtext,
    messages,
    audioLevels,
    settings,
    setSettings,
    toggleRecording,
    clearConversation,
  } = useVoiceChat();

  const cycleLanguage = () => {
    const languages = ["hinglish", "hindi", "english"];
    const currentIndex = languages.indexOf(settings.preferredLanguage);
    const nextIndex = (currentIndex + 1) % languages.length;
    setSettings({ ...settings, preferredLanguage: languages[nextIndex] });
  };

  const getLanguageDisplay = (lang: string) => {
    switch (lang) {
      case "hindi": return "हिंदी";
      case "english": return "English";
      default: return "Hinglish";
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-deep-black via-black to-deep-black relative overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 bg-grid-pattern opacity-5" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
      
      {/* Header */}
      <div className="relative z-10 flex items-center justify-between p-6 lg:p-8">
        <div className="flex items-center space-x-4">
          <div className="w-10 h-10 bg-gradient-to-br from-revolt-red to-revolt-orange rounded-xl flex items-center justify-center shadow-lg shadow-revolt-red/30">
            <Bike className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Rev Assistant</h1>
            <p className="text-sm text-gray-400">Your Revolt Motors Voice Guide</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {/* Connection Status */}
          <Badge
            variant={isConnected ? "default" : "destructive"}
            className={cn(
              "px-3 py-1 text-xs font-medium",
              isConnected 
                ? "bg-green-600 text-white border-green-500" 
                : "bg-red-600 text-white border-red-500"
            )}
          >
            {isConnected ? "Connected" : "Disconnected"}
          </Badge>
          
          {/* Language Badge */}
          <Badge variant="outline" className="px-3 py-1 text-xs border-zinc-700 text-zinc-300">
            {getLanguageDisplay(settings.preferredLanguage)}
          </Badge>
        </div>
      </div>

      {/* Main Voice Interface */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 lg:px-8">
        {/* Voice Visualizer */}
        <div className="mb-8">
          <VoiceVisualizer 
            levels={audioLevels} 
            isRecording={isRecording || isProcessing}
          />
        </div>

        {/* Status Text */}
        <div className="text-center mb-12 max-w-md">
          <motion.h2 
            className="text-2xl font-semibold text-white mb-2"
            key={currentStatus}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {currentStatus}
          </motion.h2>
          {statusSubtext && (
            <motion.p 
              className="text-gray-400 text-lg"
              key={statusSubtext}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              {statusSubtext}
            </motion.p>
          )}
        </div>

        {/* Main Action Button */}
        <div className="mb-8">
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button
              size="lg"
              disabled={!isConnected}
              onClick={toggleRecording}
              className={cn(
                "w-20 h-20 rounded-full text-white transition-all duration-300 shadow-xl",
                isRecording || isProcessing
                  ? "bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 shadow-red-500/30"
                  : "bg-gradient-to-br from-revolt-red to-revolt-orange hover:from-revolt-red/80 hover:to-revolt-orange/80 shadow-revolt-red/30",
                !isConnected && "opacity-50 cursor-not-allowed"
              )}
              data-testid="voice-toggle-button"
            >
              <motion.div
                animate={isRecording ? { rotate: 360 } : { rotate: 0 }}
                transition={{ duration: 2, repeat: isRecording ? Infinity : 0, ease: "linear" }}
              >
                {isRecording ? (
                  <MicOff className="w-8 h-8" />
                ) : (
                  <Mic className="w-8 h-8" />
                )}
              </motion.div>
            </Button>
          </motion.div>
        </div>

        {/* Quick Actions */}
        <div className="flex space-x-4 text-center max-w-md">
          <Button
            variant="ghost"
            className="flex flex-col items-center space-y-2 p-4 bg-zinc-900/50 backdrop-blur-sm border border-zinc-800 rounded-xl hover:bg-zinc-800/50 transition-colors"
            data-testid="show-history-button"
            onClick={() => setShowHistory(!showHistory)}
          >
            <Calendar className="w-5 h-5 text-zinc-400" />
            <span className="text-xs text-zinc-400">History</span>
          </Button>
        </div>
      </div>

      {/* Conversation History */}
      <ConversationHistory messages={messages} isVisible={showHistory} />

      {/* Bottom Controls */}
      <div className="flex items-center justify-center space-x-6 p-6 lg:p-8">
        <Button
          variant="ghost"
          size="icon"
          onClick={clearConversation}
          className="w-12 h-12 bg-zinc-900/60 backdrop-blur-sm border border-zinc-800 rounded-xl hover:bg-zinc-800/80"
          data-testid="clear-conversation-button"
        >
          <Trash2 className="text-zinc-400 w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setShowSettings(true)}
          className="w-12 h-12 bg-zinc-900/60 backdrop-blur-sm border border-zinc-800 rounded-xl hover:bg-zinc-800/80"
          data-testid="settings-button"
        >
          <Settings className="text-zinc-400 w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={cycleLanguage}
          className="w-12 h-12 bg-zinc-900/60 backdrop-blur-sm border border-zinc-800 rounded-xl hover:bg-zinc-800/80"
          data-testid="language-toggle-button"
        >
          <Languages className="text-zinc-400 w-4 h-4" />
        </Button>
      </div>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        settings={settings}
        onSettingsChange={setSettings}
      />
    </div>
  );
}