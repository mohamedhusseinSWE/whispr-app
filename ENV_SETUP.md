# Environment Setup Guide

To fix the ringtone issue and get proper speech synthesis, you need to set up your environment variables.

## Step 1: Create .env.local file

Create a file called `.env.local` in the root of your project with the following content:

```env
# ElevenLabs API Key for Text-to-Speech
# Get your free API key from: https://elevenlabs.io/
ELEVEN_LABS_API_KEY=your_elevenlabs_api_key_here

# Database URL (if using Prisma)
DATABASE_URL="file:./dev.db"

# JWT Secret for authentication
ACCESS_TOKEN_SECRET=your_jwt_secret_here

# Stripe Keys (for payments)
STRIPE_SECRET_KEY=your_stripe_secret_key_here
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret_here

# OpenRouter API Key (for AI features)
OPENROUTER_API_KEY=your_openrouter_api_key_here

# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret_here
```

## Step 2: Get ElevenLabs API Key

1. Go to https://elevenlabs.io/
2. Sign up for a free account
3. Go to your profile settings
4. Copy your API key
5. Replace `your_elevenlabs_api_key_here` with your actual API key

## Step 3: Restart your development server

After creating the `.env.local` file, restart your development server:

```bash
npm run dev
```

## What this fixes:

- **Ringtone Issue**: The ElevenLabs API will provide real human speech instead of the synthesized ringtone sound
- **Better Quality**: Real TTS will sound much more natural and professional
- **Fallback**: If the API fails, the improved synthesized speech will be used as a backup

## Alternative Solutions:

If you don't want to set up the API key, the application now includes:

1. **Improved Synthesized Speech**: Better than the original ringtone sound
2. **Browser Speech Synthesis**: Uses your browser's built-in speech synthesis as a fallback
3. **Error Handling**: Clear messages when audio fails to load

The ringtone issue should now be resolved with any of these approaches! 