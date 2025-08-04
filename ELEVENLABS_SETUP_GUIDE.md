# ElevenLabs Setup Guide for Production Use

## 📋 Table of Contents

1. [Overview](#overview)
2. [Account Setup](#account-setup)
3. [API Key Management](#api-key-management)
4. [Paid Plans & Pricing](#paid-plans--pricing)
5. [Environment Configuration](#environment-configuration)
6. [Testing & Validation](#testing--validation)
7. [Production Deployment](#production-deployment)
8. [Monitoring & Usage](#monitoring--usage)
9. [Troubleshooting](#troubleshooting)
10. [Best Practices](#best-practices)

---

## 🎯 Overview

This application uses **ElevenLabs Text-to-Speech API** to convert PDF documents into high-quality audio podcasts. For long-term production use, you'll need a paid ElevenLabs account to handle larger volumes of content.

### What ElevenLabs Provides:

- **Human-like speech synthesis** (instead of robotic sounds)
- **Multiple voice options** (Rachel, Josh, Arnold, etc.)
- **High-quality audio output** (44kHz, 16-bit WAV)
- **Scalable API** for production workloads

---

## 🚀 Account Setup

### Step 1: Create ElevenLabs Account

1. Go to [https://elevenlabs.io/](https://elevenlabs.io/)
2. Click "Sign Up" or "Get Started"
3. Enter your email address and create a password
4. Verify your email address

### Step 2: Get Your API Key

1. Log into your ElevenLabs account
2. Go to **Profile Settings** (top right corner)
3. Click on **"API Key"** tab
4. Copy your API key (starts with `sk_`)

**⚠️ Important:** Keep your API key secure and never share it publicly!

---

## 💳 Paid Plans & Pricing

### Free Plan (Limited)

- **10,000 characters per month**
- **Basic voices only**
- **Good for testing only**

### Paid Plans (Recommended for Production)

#### 1. **Starter Plan** - $22/month

- **30,000 characters per month**
- **All voices available**
- **Perfect for small to medium usage**

#### 2. **Creator Plan** - $99/month

- **250,000 characters per month**
- **All voices + voice cloning**
- **Ideal for regular content creation**

#### 3. **Independent Publisher** - $330/month

- **1,000,000 characters per month**
- **All features included**
- **Best for high-volume production**

#### 4. **Growing Business** - $990/month

- **4,000,000 characters per month**
- **Enterprise features**
- **For large-scale operations**

### Character Usage Calculator

- **1 page of text** ≈ 2,000-3,000 characters
- **10-page PDF** ≈ 20,000-30,000 characters
- **100-page book** ≈ 200,000-300,000 characters

**💡 Recommendation:** Start with the **Creator Plan** ($99/month) for most business use cases.

---

## ⚙️ Environment Configuration

### Step 1: Create Environment File

Create a file called `.env.local` in your project root:

```env
# ElevenLabs API Configuration
ELEVEN_LABS_API_KEY=sk_your_api_key_here

# Database Configuration
DATABASE_URL="file:./dev.db"

# Authentication
ACCESS_TOKEN_SECRET=your_jwt_secret_here

# Payment Processing (if using Stripe)
STRIPE_SECRET_KEY=your_stripe_secret_key_here
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret_here

# AI Features
OPENROUTER_API_KEY=your_openrouter_api_key_here

# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret_here
```

### Step 2: Production Environment

For production deployment, set these environment variables in your hosting platform:

**Vercel Example:**

```bash
# In Vercel Dashboard > Settings > Environment Variables
ELEVEN_LABS_API_KEY=sk_your_production_api_key
DATABASE_URL=your_production_database_url
ACCESS_TOKEN_SECRET=your_production_jwt_secret
```

**Railway/Heroku Example:**

```bash
# In your hosting platform's environment settings
ELEVEN_LABS_API_KEY=sk_your_production_api_key
DATABASE_URL=your_production_database_url
ACCESS_TOKEN_SECRET=your_production_jwt_secret
```

---

## 🧪 Testing & Validation

### Step 1: Test API Key

1. Start your development server: `npm run dev`
2. Go to: `http://localhost:3000/test-audio`
3. Click "Test ElevenLabs API"
4. You should hear audio if the setup is correct

### Step 2: Test PDF Processing

1. Upload a PDF file
2. Generate a podcast
3. Verify audio quality and duration
4. Check that full content is processed

### Step 3: Monitor Usage

- Check your ElevenLabs dashboard for usage statistics
- Monitor character consumption
- Track API response times

---

## 🚀 Production Deployment

### Step 1: Choose Hosting Platform

**Recommended Options:**

- **Vercel** (easiest, great for Next.js)
- **Railway** (good for full-stack apps)
- **Heroku** (traditional, reliable)
- **AWS/GCP** (enterprise, more complex)

### Step 2: Set Environment Variables

In your hosting platform, set all required environment variables:

```env
ELEVEN_LABS_API_KEY=sk_your_production_key
DATABASE_URL=your_production_database
ACCESS_TOKEN_SECRET=your_production_secret
NEXTAUTH_URL=https://yourdomain.com
NEXTAUTH_SECRET=your_production_nextauth_secret
```

### Step 3: Database Setup

For production, use a proper database:

- **PostgreSQL** (recommended)
- **MySQL**
- **Supabase** (PostgreSQL with easy setup)

### Step 4: Deploy

```bash
# For Vercel
vercel --prod

# For Railway
railway up

# For Heroku
git push heroku main
```

---

## 📊 Monitoring & Usage

### ElevenLabs Dashboard Monitoring

1. **Log into ElevenLabs Dashboard**
2. **Check Usage Statistics:**
   - Characters used this month
   - API calls made
   - Remaining quota
   - Voice usage breakdown

### Application Monitoring

1. **Check Server Logs** for API errors
2. **Monitor Audio Generation** success rates
3. **Track User Feedback** on audio quality
4. **Monitor Database** for podcast generation stats

### Usage Alerts

Set up alerts for:

- **80% quota usage** (to plan for upgrades)
- **API errors** (to catch issues early)
- **High usage periods** (to optimize costs)

---

## 🔧 Troubleshooting

### Common Issues & Solutions

#### 1. **"Quota Exceeded" Error**

```
Error: This request exceeds your quota of 10000.
You have 1198 credits remaining, while 4353 credits are required.
```

**Solution:** Upgrade to a higher plan or wait for next billing cycle.

#### 2. **"Invalid API Key" Error**

```
Error: ElevenLabs API error: 401 - Invalid API key
```

**Solution:**

- Check API key in environment variables
- Verify key is copied correctly
- Ensure no extra spaces or characters

#### 3. **"Audio Not Playing"**

**Possible Causes:**

- Audio file not generated
- File path issues
- Browser audio permissions

**Solutions:**

- Check browser console for errors
- Test with `/test-audio` page
- Verify audio file exists in uploads folder

#### 4. **"Long Content Not Processing"**

**Solution:** Content is automatically truncated to 4,000 characters for API limits.

#### 5. **"Slow Audio Generation"**

**Solutions:**

- Check internet connection
- Monitor ElevenLabs API status
- Consider upgrading plan for faster processing

---

## 💡 Best Practices

### 1. **API Key Security**

- ✅ Store API keys in environment variables
- ✅ Never commit API keys to version control
- ✅ Use different keys for development and production
- ✅ Rotate keys periodically

### 2. **Usage Optimization**

- ✅ Monitor character usage regularly
- ✅ Use appropriate plan for your needs
- ✅ Consider caching frequently used content
- ✅ Implement usage limits for users

### 3. **Content Management**

- ✅ Clean PDF text before processing
- ✅ Remove unnecessary formatting
- ✅ Break large documents into sections
- ✅ Test with sample content first

### 4. **Performance**

- ✅ Implement proper error handling
- ✅ Add loading states for users
- ✅ Cache generated audio files
- ✅ Monitor API response times

### 5. **User Experience**

- ✅ Provide clear feedback during processing
- ✅ Show progress indicators
- ✅ Offer fallback options (browser speech)
- ✅ Handle errors gracefully

---

## 📞 Support & Resources

### ElevenLabs Support

- **Documentation:** [https://elevenlabs.io/docs](https://elevenlabs.io/docs)
- **API Reference:** [https://elevenlabs.io/docs/api](https://elevenlabs.io/docs/api)
- **Community:** [https://discord.gg/elevenlabs](https://discord.gg/elevenlabs)
- **Email Support:** Available with paid plans

### Application Support

- **Developer Contact:** [Your contact information]
- **GitHub Issues:** [Repository link]
- **Documentation:** [Your documentation link]

---

## 🔄 Maintenance Schedule

### Daily

- Check application logs for errors
- Monitor API usage in ElevenLabs dashboard

### Weekly

- Review usage statistics
- Check for any failed audio generations
- Update dependencies if needed

### Monthly

- Review and optimize costs
- Check for plan upgrades/downgrades
- Backup important data
- Update security credentials

### Quarterly

- Review performance metrics
- Plan for scaling if needed
- Update documentation
- Security audit

---

## 📈 Scaling Considerations

### When to Upgrade Plans

- **Starter → Creator:** When consistently using >20,000 characters/month
- **Creator → Publisher:** When consistently using >200,000 characters/month
- **Publisher → Business:** When consistently using >800,000 characters/month

### Cost Optimization

- **Monitor usage patterns** to optimize character usage
- **Cache frequently used content** to reduce API calls
- **Implement user limits** to prevent abuse
- **Use appropriate voice models** for content type

### Performance Optimization

- **Implement audio caching** for repeated content
- **Use background processing** for large files
- **Optimize text preprocessing** to reduce character count
- **Monitor and optimize API response times**

---

## 🎯 Success Metrics

### Key Performance Indicators (KPIs)

- **Audio Generation Success Rate:** >95%
- **Average Processing Time:** <30 seconds
- **User Satisfaction:** >4.5/5 stars
- **Cost per Audio Minute:** <$0.50

### Monitoring Tools

- **ElevenLabs Dashboard:** Usage and performance
- **Application Logs:** Error tracking
- **User Analytics:** Usage patterns
- **Cost Tracking:** Monthly spend analysis

---

## 📝 Conclusion

This setup guide provides everything needed to run the PDF-to-Podcast application in production with ElevenLabs. The key to success is:

1. **Start with the right plan** for your usage needs
2. **Monitor usage regularly** to optimize costs
3. **Implement proper error handling** for reliability
4. **Scale gradually** as your user base grows
5. **Maintain security best practices** for API keys

For any questions or issues, refer to the troubleshooting section or contact the development team.

**Happy podcasting! 🎙️**
