import { motion, AnimatePresence } from "framer-motion";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { User, Bot } from "lucide-react";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
  language?: string;
}

interface ConversationHistoryProps {
  messages: Message[];
  isVisible: boolean;
}

export default function ConversationHistory({ messages, isVisible }: ConversationHistoryProps) {
  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="fixed inset-x-4 top-4 bottom-32 lg:inset-x-8 lg:bottom-40 bg-black/80 backdrop-blur-sm rounded-lg border border-zinc-800 z-40"
      >
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Conversation History</h2>
          <Badge variant="outline" className="text-xs">
            {messages.length} messages
          </Badge>
        </div>
        
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {messages.length === 0 ? (
              <div className="text-center text-zinc-500 py-8">
                <Bot className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No conversation yet</p>
                <p className="text-sm mt-2">Start talking to Rev about Revolt Motors!</p>
              </div>
            ) : (
              messages.map((message, index) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, x: message.sender === 'user' ? 20 : -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={cn(
                    "flex gap-3 max-w-[85%]",
                    message.sender === 'user' ? "ml-auto" : "mr-auto"
                  )}
                >
                  {message.sender === 'assistant' && (
                    <div className="w-8 h-8 bg-revolt-red rounded-full flex items-center justify-center flex-shrink-0">
                      <Bot className="w-4 h-4 text-white" />
                    </div>
                  )}
                  
                  <div className={cn(
                    "rounded-lg p-3 max-w-full",
                    message.sender === 'user' 
                      ? "bg-zinc-800 text-white" 
                      : "bg-zinc-900 text-zinc-100 border border-zinc-700"
                  )}>
                    <p className="text-sm leading-relaxed break-words">
                      {message.text}
                    </p>
                    <div className="flex items-center justify-between mt-2 gap-2">
                      <span className="text-xs text-zinc-500">
                        {message.timestamp.toLocaleTimeString([], { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </span>
                      {message.language && (
                        <Badge variant="secondary" className="text-xs">
                          {message.language}
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  {message.sender === 'user' && (
                    <div className="w-8 h-8 bg-zinc-700 rounded-full flex items-center justify-center flex-shrink-0">
                      <User className="w-4 h-4 text-white" />
                    </div>
                  )}
                </motion.div>
              ))
            )}
          </div>
        </ScrollArea>
      </motion.div>
    </AnimatePresence>
  );
}