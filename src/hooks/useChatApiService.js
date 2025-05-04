import { useState, useMemo } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';

// API configurations
const SERVER_CONFIG = {
  primary: {
    name: 'Server 1',
    description: 'Primary Server (Gemini)',
    color: 'primary',
    modelName: 'gemini-2.0-flash-lite-preview-02-05'
  },
  secondary: {
    name: 'Server 2',
    description: 'Secondary Server (Phi)',
    color: 'secondary',
    modelName: 'microsoft/phi-4-reasoning-plus:free'
  },
  tertiary: {
    name: 'Server 3',
    description: 'Flash Preview Server (Gemini 2.5)',
    color: 'info',
    modelName: 'gemini-2.5-flash-preview-04-17'
  }
};

const useChatApiService = () => {
  const [selectedServerIndex, setSelectedServerIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // Gemini API initialization
  const genAI = useMemo(
    () => new GoogleGenerativeAI(process.env.REACT_APP_GEMINI_API_KEY),
    []
  );

  const model = useMemo(() => {
    const serverKeys = Object.keys(SERVER_CONFIG);
    const currentServerKey = serverKeys[selectedServerIndex];
    const currentConfig = SERVER_CONFIG[currentServerKey];

    if (currentConfig.modelName.startsWith('gemini')) {
      return genAI.getGenerativeModel({
        model: currentConfig.modelName,
        generationConfig: {
          temperature: 0.7,
          topP: 0.8,
          topK: 40,
        },
      });
    }
    return null;
  }, [genAI, selectedServerIndex]);

  // OpenRouter API configuration
  const openRouterApi = useMemo(() => {
    const serverKeys = Object.keys(SERVER_CONFIG);
    const currentServerKey = serverKeys[selectedServerIndex];
    const currentConfig = SERVER_CONFIG[currentServerKey];

    if (currentConfig.modelName.startsWith('microsoft/phi')) {
       return {
        url: "https://openrouter.ai/api/v1/chat/completions",
        headers: {
          "Authorization": `Bearer ${process.env.REACT_APP_OPENROUTER_API_KEY}`,
          "HTTP-Referer": window.location.origin,
          "X-Title": "MindEase",
          "Content-Type": "application/json"
        },
        model: currentConfig.modelName
      };
    }
    return null;
  }, [selectedServerIndex]);

  const toggleApiService = () => {
    setSelectedServerIndex(prevIndex => (prevIndex + 1) % Object.keys(SERVER_CONFIG).length);
  };

  const setApiService = (serverIndex) => {
    if (serverIndex >= 0 && serverIndex < Object.keys(SERVER_CONFIG).length) {
        setSelectedServerIndex(serverIndex);
    } else {
        console.warn("Invalid server index provided to setApiService:", serverIndex);
    }
  };

  const getCurrentServerInfo = () => {
    const serverKeys = Object.keys(SERVER_CONFIG);
    const currentServerKey = serverKeys[selectedServerIndex];
    return SERVER_CONFIG[currentServerKey];
  };

  // Main function to get chat response
  const getChatResponse = async (userInput, systemInstructions, chatHistory) => {
    setIsLoading(true);
    
    const serverKeys = Object.keys(SERVER_CONFIG);
    const initialServerKey = serverKeys[selectedServerIndex];
    const initialConfig = SERVER_CONFIG[initialServerKey];

    // Ensure system instructions aren't too long for the API
    const trimmedInstructions = systemInstructions.length > 15000 
      ? systemInstructions.substring(0, 15000) + "..."
      : systemInstructions;
    
    const tryServer = async (serverKey) => {
      const config = SERVER_CONFIG[serverKey];
      console.log(`Attempting request with ${config.name} (${config.modelName})...`);
      try {
        let responseText;

        if (config.modelName.startsWith('gemini')) {
          // Use Gemini API
          const geminiModel = genAI.getGenerativeModel({ model: config.modelName, /* Add generationConfig if needed */ });
          const filteredMessages = chatHistory.filter(msg => !msg.isWelcome);
          const updatedChatHistory = [
            { role: 'user', parts: [{ text: trimmedInstructions }] },
            ...filteredMessages.map((msg) => ({
              role: msg.isBot ? 'model' : 'user',
              parts: [{ text: msg.text }],
            })),
          ];

          const chat = geminiModel.startChat({ history: updatedChatHistory });
          const result = await chat.sendMessage(userInput);
          const response = await result.response;
          responseText = response.text();

        } else if (config.modelName.startsWith('microsoft/phi')) {
          // Use OpenRouter API
           const currentOpenRouterConfig = { // Define specific OpenRouter config for this attempt
                url: "https://openrouter.ai/api/v1/chat/completions",
                headers: {
                    "Authorization": `Bearer ${process.env.REACT_APP_OPENROUTER_API_KEY}`,
                    "HTTP-Referer": window.location.origin,
                    "X-Title": "MindEase",
                    "Content-Type": "application/json"
                },
                model: config.modelName
            };

          const formattedHistory = chatHistory
            .filter(msg => !msg.isWelcome)
            .map(msg => ({
              role: msg.isBot ? 'assistant' : 'user',
              content: msg.text
            }));

          const openRouterResponse = await fetch(currentOpenRouterConfig.url, {
            method: "POST",
            headers: currentOpenRouterConfig.headers,
            body: JSON.stringify({
              model: currentOpenRouterConfig.model,
              messages: [
                { role: "system", content: trimmedInstructions },
                ...formattedHistory,
                { role: "user", content: userInput }
              ]
            })
          });

          if (!openRouterResponse.ok) {
             const errorBody = await openRouterResponse.text();
             console.error(`OpenRouter request failed with status ${openRouterResponse.status}:`, errorBody);
             throw new Error(`Server ${config.name} request failed: ${openRouterResponse.statusText}`);
          }

          const data = await openRouterResponse.json();
           if (!data.choices || data.choices.length === 0 || !data.choices[0].message) {
             console.error("Invalid response structure from OpenRouter:", data);
             throw new Error(`Server ${config.name} returned invalid response structure.`);
           }
          responseText = data.choices[0].message.content;
        } else {
           console.error("Unknown model type:", config.modelName);
           throw new Error(`Unknown model type configured for ${config.name}`);
        }

        console.log(`Success with ${config.name}.`);
        return { text: responseText, serverName: config.name, serverKey: serverKey };

      } catch (error) {
        console.error(`Error with ${config.name} (${config.modelName}):`, error);
        throw error; // Re-throw to signal failure
      }
    };

    // Define the order of servers to try, starting with the selected one
    const serverTryOrder = [
        initialServerKey,
        ...serverKeys.filter(key => key !== initialServerKey)
    ];


    let finalResponse = null;
    let errorOccurred = null;

     for (const serverKey of serverTryOrder) {
        try {
            finalResponse = await tryServer(serverKey);
            // If successful, update the selected server to the one that worked
            const workingIndex = serverKeys.indexOf(serverKey);
            if (workingIndex !== selectedServerIndex) {
                 console.log(`Auto-switching to working server: ${SERVER_CONFIG[serverKey].name}`);
                 setSelectedServerIndex(workingIndex);
            }
            errorOccurred = null; // Reset error if a server succeeds
            break; // Exit loop on success
        } catch (err) {
            console.warn(`Server ${SERVER_CONFIG[serverKey].name} failed. Trying next...`);
            errorOccurred = err; // Store the last error
        }
    }


    setIsLoading(false);

    if (finalResponse) {
       return {
            text: finalResponse.text,
            server: finalResponse.serverName // Return the name of the server that responded
       };
    } else {
       console.error("All servers failed:", errorOccurred);
       // Throw the last encountered error or a generic one
       throw errorOccurred || new Error('Failed to get response from all available servers');
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
    selectedServerIndex,
    isLoading,
    SERVER_CONFIG,
    getCurrentServerInfo
  };
};

export default useChatApiService; 