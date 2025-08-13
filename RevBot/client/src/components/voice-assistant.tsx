import { useState } from "react";
import { useVoiceAssistant } from "@/hooks/use-voice-assistant";
import VoiceVisualizer from "./voice-visualizer";
import ConversationHistory from "./conversation-history";
import SettingsModal from "./settings-modal";
import { useToast } from "@/hooks/use-toast";

export default function VoiceAssistant() {
  const [showSettings, setShowSettings] = useState(false);
  const { toast } = useToast();
  
  const {
    isRecording,
    isConnected,
    currentLanguage,
    conversationHistory,
    currentStatus,
    statusSubtext,
    audioLevels,
    startRecording,
    stopRecording,
    clearConversation,
    toggleLanguage,
    settings,
    updateSettings,
  } = useVoiceAssistant();

  const handleVoiceInteraction = () => {
    if (!isRecording) {
      startRecording();
    } else {
      stopRecording();
    }
  };

  const showBikeModels = () => {
    toast({
      title: "Bike Models",
      description: "Ask me about RV400, RV400 BRZ, or any Revolt Motors bike!",
    });
  };

  const bookTestRide = () => {
    toast({
      title: "Test Ride",
      description: "Say 'Book a test ride' to get started with scheduling!",
    });
  };

  return (
    <div className="relative min-h-screen flex flex-col">
      {/* Background Elements */}
      <div className="fixed inset-0 bg-gradient-to-br from-deep-black via-dark-gray to-deep-black"></div>
      <div className="fixed inset-0 bg-gradient-radial from-revolt-red/5 via-transparent to-transparent"></div>
      
      {/* Animated Background Particles */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-electric-blue/30 rounded-full animate-float"></div>
        <div className="absolute top-1/3 right-1/4 w-1 h-1 bg-energy-orange/40 rounded-full animate-float" style={{animationDelay: '1s'}}></div>
        <div className="absolute bottom-1/3 left-1/3 w-1.5 h-1.5 bg-electric-green/20 rounded-full animate-float" style={{animationDelay: '2s'}}></div>
        <div className="absolute bottom-1/4 right-1/3 w-1 h-1 bg-revolt-red/30 rounded-full animate-float" style={{animationDelay: '0.5s'}}></div>
      </div>

      {/* Main Container */}
      <div className="relative z-10 flex flex-col h-screen">
        
        {/* Header */}
        <header className="flex items-center justify-between p-6 lg:p-8">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-revolt-red to-energy-orange rounded-lg flex items-center justify-center">
              <i className="fas fa-motorcycle text-white text-lg"></i>
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Rev</h1>
              <p className="text-xs text-gray-400">Revolt Motors Assistant</p>
            </div>
          </div>
          
          {/* Status Indicator */}
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full animate-pulse ${isConnected ? 'bg-electric-green' : 'bg-gray-500'}`}></div>
            <span className="text-sm text-gray-400" data-testid="connection-status">
              {isConnected ? 'Connected' : 'Connecting...'}
            </span>
          </div>
        </header>

        {/* Current Status Card */}
        <div className="px-6 lg:px-8 mb-6">
          <div className="bg-dark-gray/60 backdrop-blur-sm border border-gray-800 rounded-2xl p-4 shadow-xl">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-electric-blue/20 to-electric-blue/40 rounded-lg flex items-center justify-center">
                <i className={`fas ${isRecording ? 'fa-microphone text-revolt-red' : 'fa-microphone text-electric-blue'} text-sm`}></i>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-white" data-testid="current-status">{currentStatus}</p>
                <p className="text-xs text-gray-400" data-testid="status-subtext">{statusSubtext}</p>
              </div>
              <div className="text-xs text-gray-500" data-testid="language-detected">{currentLanguage}</div>
            </div>
          </div>
        </div>

        {/* Main Voice Interface */}
        <div className="flex-1 flex flex-col items-center justify-center px-6 lg:px-8">
          
          {/* Voice Visualizer */}
          <div className="mb-8">
            <VoiceVisualizer levels={audioLevels} isRecording={isRecording} />
          </div>

          {/* Main Voice Button */}
          <div className="relative mb-8">
            {/* Pulse Ring Animation */}
            {isRecording && (
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-revolt-red/30 to-energy-orange/30 animate-pulse-ring"></div>
            )}
            
            {/* Main Button */}
            <button 
              className={`relative w-32 h-32 lg:w-36 lg:h-36 bg-gradient-to-br from-revolt-red via-energy-orange to-revolt-red rounded-full shadow-2xl shadow-revolt-red/50 border-4 border-white/10 flex items-center justify-center group hover:scale-105 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-revolt-red/50 ${isRecording ? 'animate-pulse' : ''}`}
              onClick={handleVoiceInteraction}
              data-testid="voice-button"
            >
              <i className={`fas ${isRecording ? 'fa-stop' : 'fa-microphone'} text-white text-3xl lg:text-4xl group-active:scale-90 transition-transform duration-150`}></i>
            </button>
            
            {/* Button Label */}
            <p className="text-center text-sm text-gray-400 mt-4" data-testid="button-label">
              {isRecording ? 'Listening...' : 'Tap to talk'}
            </p>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
            <button 
              className="bg-dark-gray/60 backdrop-blur-sm border border-gray-800 rounded-xl p-3 flex flex-col items-center space-y-2 hover:bg-dark-gray/80 transition-all duration-200"
              onClick={showBikeModels}
              data-testid="button-bike-models"
            >
              <i className="fas fa-motorcycle text-electric-blue text-lg"></i>
              <span className="text-xs font-medium">Bike Models</span>
            </button>
            <button 
              className="bg-dark-gray/60 backdrop-blur-sm border border-gray-800 rounded-xl p-3 flex flex-col items-center space-y-2 hover:bg-dark-gray/80 transition-all duration-200"
              onClick={bookTestRide}
              data-testid="button-test-ride"
            >
              <i className="fas fa-calendar-check text-electric-green text-lg"></i>
              <span className="text-xs font-medium">Test Ride</span>
            </button>
          </div>
        </div>

        {/* Conversation History */}
        <ConversationHistory messages={conversationHistory} />

        {/* Bottom Controls */}
        <div className="flex items-center justify-center space-x-6 p-6 lg:p-8">
          <button 
            className="w-12 h-12 bg-dark-gray/60 backdrop-blur-sm border border-gray-800 rounded-xl flex items-center justify-center hover:bg-dark-gray/80 transition-all duration-200"
            onClick={clearConversation}
            data-testid="button-clear-conversation"
          >
            <i className="fas fa-trash-alt text-gray-400 text-sm"></i>
          </button>
          <button 
            className="w-12 h-12 bg-dark-gray/60 backdrop-blur-sm border border-gray-800 rounded-xl flex items-center justify-center hover:bg-dark-gray/80 transition-all duration-200"
            onClick={() => setShowSettings(true)}
            data-testid="button-settings"
          >
            <i className="fas fa-cog text-gray-400 text-sm"></i>
          </button>
          <button 
            className="w-12 h-12 bg-dark-gray/60 backdrop-blur-sm border border-gray-800 rounded-xl flex items-center justify-center hover:bg-dark-gray/80 transition-all duration-200"
            onClick={toggleLanguage}
            data-testid="button-toggle-language"
          >
            <i className="fas fa-language text-gray-400 text-sm"></i>
          </button>
        </div>
      </div>

      {/* Settings Modal */}
      <SettingsModal 
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        settings={settings}
        onUpdateSettings={updateSettings}
      />
    </div>
  );
}
