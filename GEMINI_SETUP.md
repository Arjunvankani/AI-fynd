# 🔑 Gemini API Setup Guide

This project uses Google's Gemini API directly (not OpenRouter). Follow these steps to set up your API key.

## Step 1: Get Your Gemini API Key

1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Sign in with your Google account
3. Click **"Create API Key"**
4. Copy your API key
5. (Optional) Restrict the API key for security

## Step 2: Configure for Notebook (Task 1)

In `task1_evaluation.ipynb`, update the configuration cell:

```python
GEMINI_API_KEY = "your-api-key-here"  # Paste your key here
MODEL_NAME = "gemini-pro"  # or "gemini-1.5-pro", "gemini-1.5-flash"
```

## Step 3: Configure for Web App (Task 2)

### Local Development

Create `.env.local` file in the root directory:

```env
GEMINI_API_KEY=your-api-key-here
MODEL_NAME=gemini-pro
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Vercel Deployment

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add:
   - **Name**: `GEMINI_API_KEY`
   - **Value**: Your API key
   - **Environment**: Production, Preview, Development
4. (Optional) Add `MODEL_NAME` if you want to use a different model

## Available Models

### Free Tier Models

- **`gemini-pro`**: Standard model, good for most tasks
- **`gemini-1.5-flash`**: Faster responses, optimized for speed

### Pro Models (May have usage limits)

- **`gemini-1.5-pro`**: Better performance, longer context

## Testing Your Setup

### Test in Python (Notebook)

```python
import google.generativeai as genai

genai.configure(api_key="your-api-key")
model = genai.GenerativeModel("gemini-pro")
response = model.generate_content("Hello!")
print(response.text)
```

### Test in JavaScript/TypeScript (Web App)

The API route automatically uses your environment variable. Test by making a prediction in the web app.

## API Limits

- **Free Tier**: 60 requests per minute
- **Rate Limits**: May vary by model
- **Cost**: Free for most use cases (check Google's pricing)

## Troubleshooting

### Error: "API key not valid"
- Verify you copied the full key
- Check for extra spaces
- Ensure the key is enabled in Google AI Studio

### Error: "Quota exceeded"
- You've hit the rate limit
- Wait a minute and try again
- Consider using `gemini-1.5-flash` for faster responses

### Error: "Model not found"
- Verify model name is correct
- Some models may not be available in all regions
- Try `gemini-pro` as default

## Security Best Practices

1. ✅ Never commit API keys to Git
2. ✅ Use environment variables
3. ✅ Restrict API keys in Google Cloud Console
4. ✅ Use different keys for development and production

## Cost

- **Free Tier**: Generous free tier available
- **Pricing**: Check [Google AI Pricing](https://ai.google.dev/pricing)
- **Most users**: Free tier is sufficient for development and evaluation

---

**Your API key is ready!** Update the configuration files and start using Gemini API. 🚀

