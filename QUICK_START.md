# 🚀 Quick Start Guide - Vercel Web Application

## What You Have

✅ **Complete Next.js web application** with:
- Beautiful User Dashboard for predictions
- Admin Dashboard with analytics
- RLHF (Reinforcement Learning from Human Feedback) system
- API routes for predictions and feedback
- Ready for Vercel deployment

## Immediate Next Steps

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Environment Variables

Create a file named `.env.local` in the root directory:

```env
GEMINI_API_KEY=your-api-key-here
MODEL_NAME=gemini-pro
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**To get Gemini API key:**
1. Go to https://aistudio.google.com/app/apikey
2. Sign in with Google account
3. Click "Create API Key"
4. Copy your API key
5. Paste in `.env.local`

See `GEMINI_SETUP.md` for detailed instructions.

### 3. Run Locally

```bash
npm run dev
```

Visit: http://localhost:3000

### 4. Test the Application

**User Dashboard:**
- Enter a sample review
- Get AI prediction
- Submit feedback if prediction is wrong

**Admin Dashboard:**
- View analytics
- See feedback data
- Train model with RLHF

## Deploy to Vercel

### Option 1: Vercel Dashboard (Easiest)

1. Push code to GitHub
2. Go to https://vercel.com
3. Click "Add New Project"
4. Import your GitHub repo
5. Add environment variables in Vercel settings
6. Deploy!

### Option 2: Vercel CLI

```bash
npm i -g vercel
vercel login
vercel
```

See `VERCEL_DEPLOYMENT.md` for detailed instructions.

## Key Features

### User Side
- ✅ Enter Yelp reviews
- ✅ Get instant predictions (1-5 stars)
- ✅ See explanations
- ✅ Correct predictions
- ✅ Submit feedback

### Admin Side
- ✅ View all feedback
- ✅ Analytics dashboard
- ✅ Charts and visualizations
- ✅ Export data
- ✅ Train model (RLHF)

## File Structure

```
├── app/
│   ├── api/          # Backend API routes
│   ├── page.tsx      # Main page
│   └── layout.tsx    # Root layout
├── components/       # React components
├── package.json      # Dependencies
└── next.config.js    # Next.js config
```

## Troubleshooting

**Issue: "API key not found"**
- Check `.env.local` file exists
- Verify variable name: `GEMINI_API_KEY`
- Restart dev server after adding variables

**Issue: "Module not found"**
- Run `npm install`
- Check `package.json` has all dependencies

**Issue: Build fails**
- Check Node.js version (need 18+)
- Clear `.next` folder: `rm -rf .next`
- Run `npm run build` to see errors

## Best Models to Use

**Free Option (Recommended):**
```env
MODEL_NAME=gemini-pro
```

**Faster Option:**
```env
MODEL_NAME=gemini-1.5-flash
```

**Better Performance:**
```env
MODEL_NAME=gemini-1.5-pro
```

## What's Different from Gradio?

✅ Full-stack web application
✅ More customizable UI
✅ Better user experience
✅ Built-in analytics
✅ Production-ready
✅ Scalable architecture

## Need Help?

- Check `VERCEL_DEPLOYMENT.md` for deployment
- Check `README_VERCEL.md` for app details
- Review API routes in `app/api/`

---

**Ready to deploy?** Follow VERCEL_DEPLOYMENT.md for step-by-step instructions! 🚀

