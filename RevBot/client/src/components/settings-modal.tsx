import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Volume2, Mic, Globe, Zap } from "lucide-react";

interface VoiceSettings {
  preferredLanguage: string;
  voiceSpeed: number;
  autoDetectLanguage: boolean;
  pushToTalk: boolean;
}

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: VoiceSettings;
  onSettingsChange: (settings: VoiceSettings) => void;
}

export default function SettingsModal({ isOpen, onClose, settings, onSettingsChange }: SettingsModalProps) {
  const defaultSettings: VoiceSettings = {
    preferredLanguage: 'hinglish',
    voiceSpeed: 1,
    autoDetectLanguage: true,
    pushToTalk: false,
  };
  const [localSettings, setLocalSettings] = useState<VoiceSettings>(settings || defaultSettings);

  const handleSave = () => {
    onSettingsChange(localSettings);
    onClose();
  };

  const handleReset = () => {
    const defaultSettings: VoiceSettings = {
      preferredLanguage: 'hinglish',
      voiceSpeed: 1,
      autoDetectLanguage: true,
      pushToTalk: false,
    };
    setLocalSettings(defaultSettings);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-black border border-zinc-800">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <Zap className="w-5 h-5 text-revolt-red" />
            Voice Settings
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 pt-4">
          {/* Preferred Language */}
          <div className="space-y-2">
            <Label className="text-white flex items-center gap-2">
              <Globe className="w-4 h-4" />
              Preferred Language
            </Label>
            <Select 
              value={localSettings.preferredLanguage} 
              onValueChange={(value) => setLocalSettings({ ...localSettings, preferredLanguage: value })}
            >
              <SelectTrigger className="bg-zinc-900 border-zinc-700 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-zinc-900 border-zinc-700">
                <SelectItem value="hinglish">
                  <div className="flex items-center gap-2">
                    Hinglish
                    <Badge variant="secondary" className="text-xs">Recommended</Badge>
                  </div>
                </SelectItem>
                <SelectItem value="hindi">हिंदी (Hindi)</SelectItem>
                <SelectItem value="english">English</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-zinc-500">
              Rev will primarily respond in this language
            </p>
          </div>

          {/* Auto-detect Language */}
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-white">Auto-detect Language</Label>
              <p className="text-xs text-zinc-500 mt-1">
                Automatically switch languages based on your speech
              </p>
            </div>
            <Switch
              checked={localSettings.autoDetectLanguage}
              onCheckedChange={(checked) => setLocalSettings({ ...localSettings, autoDetectLanguage: checked })}
            />
          </div>

          {/* Voice Speed */}
          <div className="space-y-3">
            <Label className="text-white flex items-center gap-2">
              <Volume2 className="w-4 h-4" />
              Voice Speed
            </Label>
            <div className="px-2">
              <Slider
                value={[localSettings.voiceSpeed]}
                onValueChange={([value]) => setLocalSettings({ ...localSettings, voiceSpeed: value })}
                min={0.5}
                max={2}
                step={0.1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-zinc-500 mt-1">
                <span>Slow</span>
                <span className="text-revolt-red">{localSettings.voiceSpeed.toFixed(1)}x</span>
                <span>Fast</span>
              </div>
            </div>
          </div>

          {/* Push to Talk */}
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-white flex items-center gap-2">
                <Mic className="w-4 h-4" />
                Push to Talk
              </Label>
              <p className="text-xs text-zinc-500 mt-1">
                Hold the mic button to speak instead of tap to toggle
              </p>
            </div>
            <Switch
              checked={localSettings.pushToTalk}
              onCheckedChange={(checked) => setLocalSettings({ ...localSettings, pushToTalk: checked })}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-between pt-6 border-t border-zinc-800">
          <Button
            variant="ghost"
            onClick={handleReset}
            className="text-zinc-400 hover:text-white"
          >
            Reset to Default
          </Button>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={onClose} className="text-zinc-400 hover:text-white">
              Cancel
            </Button>
            <Button 
              onClick={handleSave}
              className="bg-revolt-red hover:bg-revolt-red/80 text-white"
            >
              Save Settings
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}