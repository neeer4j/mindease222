import { useState, useMemo } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';

// API configurations
const SERVER_CONFIG = {
  primary: {
    name: 'Server 1',
    description: 'Primary Server (Gemini)',
    color: 'primary'
  },
  backup: {
    name: 'Server 2',
    description: 'Backup Server (Phi)',
    color: 'secondary'
  }
};

const useChatApiService = () => {
  const [useBackupApi, setUseBackupApi] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Gemini API initialization
  const genAI = useMemo(
    () => new GoogleGenerativeAI(process.env.REACT_APP_GEMINI_API_KEY),
    []
  );

  const model = useMemo(
    () => genAI.getGenerativeModel({
      model: 'gemini-2.0-flash-lite-preview-02-05',
      generationConfig: {
        temperature: 0.7,
        topP: 0.8,
        topK: 40
      }
    }),
    [genAI]
  );

  // OpenRouter API configuration
  const openRouterApi = useMemo(() => ({
    url: "https://openrouter.ai/api/v1/chat/completions",
    headers: {
      "Authorization": `Bearer ${process.env.REACT_APP_OPENROUTER_API_KEY}`,
      "HTTP-Referer": window.location.origin,
      "X-Title": "MindEase",
      "Content-Type": "application/json"
    },
    model: "microsoft/phi-4-reasoning-plus:free"
  }), []);

  const toggleApiService = () => {
    setUseBackupApi(prev => !prev);
  };

  const setApiService = (useBackup) => {
    setUseBackupApi(useBackup);
  };

  const getCurrentServerInfo = () => {
    return useBackupApi ? SERVER_CONFIG.backup : SERVER_CONFIG.primary;
  };

  // Main function to get chat response
  const getChatResponse = async (userInput, systemInstructions, chatHistory) => {
    setIsLoading(true);
    
    // Ensure system instructions aren't too long for the API
    const trimmedInstructions = systemInstructions.length > 15000 
      ? systemInstructions.substring(0, 15000) + "..."
      : systemInstructions;
    
    const tryServer = async (isPrimary) => {
      try {
        let response;
        
        if (isPrimary) {
          // Use Gemini API (Server 1)
          const filteredMessages = chatHistory.filter(msg => !msg.isWelcome);
          const updatedChatHistory = [
            {
              role: 'user',
              parts: [{ text: trimmedInstructions }],
            },
            ...filteredMessages.map((msg) => ({
              role: msg.isBot ? 'model' : 'user',
              parts: [{ text: msg.text }],
            })),
          ];

          const chat = model.startChat({ history: updatedChatHistory });
          const result = await chat.sendMessage(userInput);
          response = await result.response;
          return response.text();
        } else {
          // Use OpenRouter API (Server 2)
          const formattedHistory = chatHistory
            .filter(msg => !msg.isWelcome)
            .map(msg => ({
              role: msg.isBot ? 'assistant' : 'user',
              content: msg.text
            }));

          const openRouterResponse = await fetch(openRouterApi.url, {
            method: "POST",
            headers: openRouterApi.headers,
            body: JSON.stringify({
              model: openRouterApi.model,
              messages: [
                {
                  role: "system",
                  content: trimmedInstructions
                },
                ...formattedHistory,
                {
                  role: "user",
                  content: userInput
                }
              ]
            })
          });

          if (!openRouterResponse.ok) {
            throw new Error('Server 2 request failed');
          }

          const data = await openRouterResponse.json();
          return data.choices[0].message.content;
        }
      } catch (error) {
        console.error(`Error with ${isPrimary ? 'Server 1' : 'Server 2'}:`, error);
        throw error;
      }
    };

    try {
      // Try current server first
      const currentServer = !useBackupApi;
      let response;
      let serverUsed;
      
      try {
        response = await tryServer(currentServer);
        serverUsed = currentServer ? 'Server 1' : 'Server 2';
      } catch (error) {
        // If current server fails, try other server
        response = await tryServer(!currentServer);
        serverUsed = !currentServer ? 'Server 1' : 'Server 2';
        // Auto-switch to working server
        setUseBackupApi(!currentServer);
      }

      setIsLoading(false);
      return {
        text: response,
        server: serverUsed
      };
    } catch (error) {
      setIsLoading(false);
      throw new Error('Failed to get response from both servers');
    }
  };

  // Function to generate quick replies
  const generateQuickReplies = async (userMessage, botResponse) => {
    try {
      const prompt = `
Based on this therapeutic conversation, suggest 3-4 natural, empathetic responses the user might want to say next. These should feel like organic continuations of the conversation, not generic options.

User: ${userMessage}
Therapist: ${botResponse}

Provide brief, conversational replies that could help the user:
- Express their feelings more deeply
- Explore the topic further
- Respond to your therapeutic suggestions
- Share more about their experience

Format as simple reply options without bullets or numbers.`;

      const quickReplyChat = model.startChat({
        history: [
          {
            role: 'user',
            parts: [
              {
                text: 'You are an assistant that provides quick reply options based on the conversation context.',
              },
            ],
          },
          {
            role: 'user',
            parts: [{ text: prompt }],
          },
        ],
      });
      const quickReplyResult = await quickReplyChat.sendMessage('');
      const quickRepliesText = await quickReplyResult.response.text();
      const quickReplies = quickRepliesText
        .split('\n')
        .map((reply) =>
          reply.replace(/^\s*[-•]\s?/, '').replace(/\*/g, '').trim()
        )
        .filter(
          (reply) =>
            reply.length > 0 &&
            !reply.toLowerCase().includes('quick replies') &&
            !reply.toLowerCase().includes('provide')
        );
      return quickReplies.slice(0, 5);
    } catch (error) {
      console.error('Error fetching quick replies:', error);
      return [];
    }
  };

  return {
    getChatResponse,
    generateQuickReplies,
    toggleApiService,
    setApiService,
    useBackupApi,
    isLoading,
    SERVER_CONFIG,
    getCurrentServerInfo
  };
};

export default useChatApiService; 