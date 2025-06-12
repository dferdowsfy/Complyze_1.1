import { NextRequest, NextResponse } from 'next/server';

// OpenRouter API key endpoint for Chrome extension
export async function GET(req: NextRequest) {
  try {
    // Get the OpenRouter API key from environment variables
    const apiKey = process.env.OPENROUTER_API_KEY;
    
    if (!apiKey) {
      console.error('OPENROUTER_API_KEY not found in environment variables');
      return NextResponse.json({ 
        error: 'OpenRouter API key not configured on server' 
      }, { status: 500 });
    }
    
    // Optionally validate the authorization header (if needed)
    // const authHeader = req.headers.get('authorization');
    // if (!authHeader || !authHeader.startsWith('Bearer ')) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }
    
    console.log('Complyze: Providing OpenRouter API key to extension');
    console.log('Complyze: API key prefix:', apiKey.substring(0, 15) + '...');
    
    return NextResponse.json({ 
      apiKey: apiKey,
      model: 'google/gemini-2.5-flash-preview-05-20', // Default model
      baseUrl: 'https://openrouter.ai/api/v1/chat/completions',
      fallbackMode: false
    }, { status: 200 });
    
  } catch (error: any) {
    console.error('OpenRouter key endpoint error:', error);
    return NextResponse.json({ 
      error: 'Failed to retrieve API key', 
      details: error.message 
    }, { status: 500 });
  }
} 