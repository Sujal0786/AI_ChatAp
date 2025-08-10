import { Configuration, OpenAIApi } from 'openai';

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});

const openai = new OpenAIApi(configuration);

export const generateAIResponse = async (message, conversationHistory = []) => {
  try {
    const messages = [
      {
        role: 'system',
        content: 'You are a helpful AI assistant in a chat application. Be friendly, concise, and helpful. Keep responses under 200 words unless specifically asked for longer responses.'
      },
      ...conversationHistory.slice(-10).map(msg => ({
        role: msg.messageType === 'ai' ? 'assistant' : 'user',
        content: msg.content
      })),
      {
        role: 'user',
        content: message
      }
    ];

    const completion = await openai.createChatCompletion({
      model: 'gpt-3.5-turbo',
      messages,
      max_tokens: 300,
      temperature: 0.7,
    });

    return completion.data.choices[0].message.content;
  } catch (error) {
    console.error('OpenAI API Error:', error);
    
    if (error.response?.status === 429) {
      return 'I apologize, but the AI service is currently unavailable due to quota limits. Please try again later.';
    } else if (error.response?.status === 401) {
      return 'AI service is not properly configured. Please contact the administrator.';
    } else {
      return 'I apologize, but I encountered an error while processing your request. Please try again.';
    }
  }
};
