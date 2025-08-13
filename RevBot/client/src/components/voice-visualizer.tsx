import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface VoiceVisualizerProps {
  levels: number[];
  isRecording: boolean;
}

export default function VoiceVisualizer({ levels, isRecording }: VoiceVisualizerProps) {
  const bars = Array.from({ length: 20 }, (_, i) => {
    const level = levels[i % levels.length] || 0;
    const height = isRecording ? Math.max(4, level * 100) : 4;
    
    return (
      <motion.div
        key={i}
        className={cn(
          "bg-gradient-to-t rounded-full transition-colors duration-300",
          isRecording 
            ? "from-revolt-red to-revolt-orange shadow-md shadow-revolt-red/30" 
            : "from-zinc-700 to-zinc-600"
        )}
        animate={{
          height: `${height}px`,
          scaleY: isRecording ? [1, 1.2, 1] : 1,
        }}
        transition={{
          height: { duration: 0.1 },
          scaleY: { 
            duration: 0.8,
            repeat: isRecording ? Infinity : 0,
            ease: "easeInOut",
            delay: i * 0.05
          }
        }}
        style={{
          width: "4px",
          minHeight: "4px"
        }}
      />
    );
  });

  return (
    <div className="relative">
      {/* Outer glow effect when recording */}
      {isRecording && (
        <motion.div
          className="absolute inset-0 rounded-full bg-revolt-red/20 blur-xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.5, 0.8, 0.5],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      )}
      
      {/* Voice bars container */}
      <div className="relative bg-black/40 backdrop-blur-sm rounded-full p-8 border border-zinc-800">
        <div className="flex items-end justify-center gap-1 h-24">
          {bars}
        </div>
        
        {/* Center recording indicator */}
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div
            className={cn(
              "w-4 h-4 rounded-full transition-colors duration-300",
              isRecording ? "bg-revolt-red shadow-lg shadow-revolt-red/50" : "bg-zinc-600"
            )}
            animate={isRecording ? {
              scale: [1, 1.3, 1],
              opacity: [1, 0.8, 1],
            } : {}}
            transition={{
              duration: 1,
              repeat: isRecording ? Infinity : 0,
              ease: "easeInOut"
            }}
          />
        </div>
      </div>
    </div>
  );
}