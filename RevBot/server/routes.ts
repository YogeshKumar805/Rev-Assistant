import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { GeminiLiveService } from "./services/gemini-live";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  
  // Initialize Gemini Live WebSocket service
  const geminiLive = new GeminiLiveService();
  
  // WebSocket server for Gemini Live API proxy
  const wss = new WebSocketServer({ 
    server: httpServer, 
    path: '/ws' 
  });
  
  wss.on('connection', (ws: WebSocket) => {
    console.log('Client connected to voice assistant WebSocket');
    
    // Handle incoming messages from client
    ws.on('message', async (data: Buffer) => {
      try {
        const message = JSON.parse(data.toString());
        
        switch (message.type) {
          case 'configure':
            await geminiLive.configure(message.config, ws);
            break;
            
          case 'audio_input':
            await geminiLive.sendAudio(message.audio, ws);
            break;
            
          case 'end_input':
            await geminiLive.endInput(ws);
            break;
            
          case 'reset_session':
            await geminiLive.resetSession(ws);
            break;
            
          case 'update_settings':
            await geminiLive.updateSettings(message.settings, ws);
            break;
            
          default:
            console.warn('Unknown message type:', message.type);
        }
        
      } catch (error) {
        console.error('Error processing WebSocket message:', error);
        ws.send(JSON.stringify({
          type: 'error',
          message: 'Failed to process message'
        }));
      }
    });
    
    ws.on('close', () => {
      console.log('Client disconnected from voice assistant WebSocket');
      geminiLive.cleanup(ws);
    });
    
    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
      geminiLive.cleanup(ws);
    });
  });

  return httpServer;
}
