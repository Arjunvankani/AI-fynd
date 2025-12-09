# 🚀 Vercel Deployment Guide

Complete guide to deploy your Yelp Rating Predictor web application to Vercel.

## Prerequisites

1. ✅ GitHub account (for Git integration)
2. ✅ Vercel account ([Sign up free](https://vercel.com/signup))
3. ✅ Gemini API key ([Get one here](https://aistudio.google.com/app/apikey))
4. ✅ Node.js 18+ installed locally (for testing)

## Quick Deployment Steps

### Step 1: Prepare Your Repository

1. **Initialize Git** (if not already):
   ```bash
   git init
   git add .
   git commit -m "Initial commit: Yelp Rating Predictor"
   ```

2. **Push to GitHub**:
   - Create a new repository on GitHub
   - Push your code:
   ```bash
   git remote add origin https://github.com/yourusername/yelp-rating-predictor.git
   git branch -M main
   git push -u origin main
   ```

### Step 2: Deploy to Vercel

#### Option A: Via Vercel Dashboard (Recommended)

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **"Add New Project"**
3. Import your GitHub repository
4. Vercel will auto-detect Next.js settings
5. Click **"Deploy"**

#### Option B: Via Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
vercel

# For production
vercel --prod
```

### Step 3: Configure Environment Variables

1. Go to your project in Vercel Dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add the following variables:

   | Name | Value | Environment |
   |------|-------|-------------|
   | `GEMINI_API_KEY` | Your Gemini API key | Production, Preview, Development |
   | `MODEL_NAME` | `gemini-pro` (or `gemini-1.5-flash`, `gemini-1.5-pro`) | Production, Preview, Development |
   | `NEXT_PUBLIC_APP_URL` | Your Vercel app URL (optional) | Production |

4. Click **"Save"**
5. **Redeploy** your application for changes to take effect

### Step 4: Verify Deployment

1. Visit your deployment URL (e.g., `https://your-app.vercel.app`)
2. Test User Dashboard:
   - Enter a sample review
   - Get prediction
   - Submit feedback
3. Test Admin Dashboard:
   - View analytics
   - Check feedback data
   - Test model training

## File Structure

Your project should have this structure:

```
yelp-rating-predictor/
├── app/
│   ├── api/
│   │   ├── predict/
│   │   │   └── route.ts
│   │   ├── feedback/
│   │   │   └── route.ts
│   │   ├── analytics/
│   │   │   └── route.ts
│   │   └── train/
│   │       └── route.ts
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── UserDashboard.tsx
│   ├── AdminDashboard.tsx
│   ├── StarRating.tsx
│   └── FeedbackPanel.tsx
├── package.json
├── next.config.js
├── tailwind.config.js
├── tsconfig.json
└── README.md
```

## Environment Variables Explained

### Required Variables

- **`GEMINI_API_KEY`**: Your Gemini API key for LLM predictions
  - Get from: https://aistudio.google.com/app/apikey
  - Required for all API routes

- **`MODEL_NAME`**: The Gemini model to use
  - Default: `gemini-pro`
  - Options:
    - `gemini-pro` (FREE, recommended)
    - `gemini-1.5-flash` (FREE, faster)
    - `gemini-1.5-pro` (Better performance, may have limits)

### Optional Variables

- **`NEXT_PUBLIC_APP_URL`**: Your app URL for API referrer
  - Used in OpenRouter API headers
  - Example: `https://your-app.vercel.app`

## Data Storage

**Note**: This deployment uses file-based storage (`/data` folder). For production:

1. **Vercel Serverless Functions** have limited file system access
2. **Recommended**: Use a database for production:
   - Vercel Postgres (free tier available)
   - MongoDB Atlas (free tier)
   - Supabase (free tier)
   - PlanetScale (free tier)

### Upgrading to Database (Future Enhancement)

Replace file-based storage in API routes with database queries:

```typescript
// Example: Using Vercel Postgres
import { sql } from '@vercel/postgres'

// Save feedback
await sql`
  INSERT INTO feedback (review_text, predicted_rating, user_rating)
  VALUES (${review_text}, ${predicted_rating}, ${user_rating})
`
```

## API Routes

### `/api/predict`
- **Method**: POST
- **Purpose**: Get AI prediction for a review using Gemini API
- **Body**: `{ review_text: string }`
- **Response**: `{ predicted_stars, explanation, confidence, prediction_id }`

### `/api/feedback`
- **Method**: POST
- **Purpose**: Submit user feedback/corrections
- **Body**: `{ prediction_id, review_text, predicted_rating, user_rating, corrected }`
- **Response**: `{ success: true, feedback_id }`

### `/api/analytics`
- **Method**: GET
- **Purpose**: Get admin analytics
- **Response**: `{ analytics: { total_feedback, accuracy_rate, ... } }`

### `/api/train`
- **Method**: POST
- **Purpose**: Trigger RLHF training with collected feedback
- **Body**: `{ feedback_ids: string[] }`
- **Response**: `{ success: true, training_examples_added }`

## Features

### User Dashboard
- ✅ Enter Yelp reviews
- ✅ Get instant AI predictions
- ✅ Submit feedback/corrections
- ✅ Rate predictions
- ✅ See confidence levels

### Admin Dashboard
- ✅ View all feedback
- ✅ Analytics and metrics
- ✅ Rating distribution charts
- ✅ Accuracy trends
- ✅ Export feedback data
- ✅ Train model with RLHF

## Troubleshooting

### Issue: "API key not found"
**Solution**: 
- Verify `GEMINI_API_KEY` is set in Vercel dashboard
- Ensure variables are set for correct environment (Production/Preview)
- Redeploy after adding variables
- Check key is valid at https://aistudio.google.com/app/apikey

### Issue: "Module not found"
**Solution**:
- Check `package.json` has all dependencies
- Run `npm install` locally to verify
- Check build logs in Vercel dashboard

### Issue: "Data not persisting"
**Solution**:
- File-based storage is limited on Vercel
- Upgrade to database (Vercel Postgres recommended)
- Files reset on each deployment

### Issue: "Build failed"
**Solution**:
- Check build logs in Vercel dashboard
- Verify TypeScript errors locally: `npm run build`
- Ensure all environment variables are set

## Custom Domain

1. Go to Vercel project → Settings → Domains
2. Add your domain
3. Follow DNS configuration instructions
4. SSL is automatically configured

## Performance Optimization

- ✅ Next.js automatic code splitting
- ✅ API routes run as serverless functions
- ✅ Static assets cached via CDN
- ✅ Optimized images (if added)
- ✅ Edge functions for global performance

## Monitoring

- **Analytics**: View in Vercel Dashboard → Analytics
- **Logs**: View in Vercel Dashboard → Logs
- **Performance**: Vercel Analytics (enable in settings)

## Cost Estimate

### Free Tier (Hobby Plan)
- ✅ 100GB bandwidth/month
- ✅ Unlimited requests
- ✅ Serverless functions
- ✅ Automatic HTTPS
- ✅ Deploy previews

### Paid Features (if needed)
- Pro plan: $20/month for more bandwidth
- Team plan: $20/user/month for collaboration

**Note**: Gemini API has a generous free tier. Check [Google AI Pricing](https://ai.google.dev/pricing) for details.

## Next Steps After Deployment

1. ✅ Test all features thoroughly
2. ✅ Monitor API usage and costs
3. ✅ Set up database for production (optional)
4. ✅ Configure custom domain (optional)
5. ✅ Add analytics tracking (optional)
6. ✅ Set up error monitoring (Sentry, etc.)

## Support Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [OpenRouter API Docs](https://openrouter.ai/docs)

---

**Your app will be live at**: `https://your-project.vercel.app` 🚀

