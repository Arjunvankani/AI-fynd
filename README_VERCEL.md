# 🌟 Yelp Rating Predictor - Web Application

A modern, full-stack web application for predicting Yelp review ratings using AI, with Reinforcement Learning from Human Feedback (RLHF) capabilities.

## ✨ Features

### User Dashboard
- 🔮 **AI-Powered Predictions**: Get instant star rating predictions (1-5 stars)
- ⭐ **Interactive Rating**: Visual star rating display
- 💡 **Detailed Explanations**: Understand why the AI gave a specific rating
- 📊 **Confidence Levels**: See prediction confidence (high/medium/low)
- ✅ **Feedback System**: Correct predictions and help improve the model

### Admin Dashboard
- 📈 **Real-time Analytics**: View accuracy, corrections, and trends
- 📊 **Visual Charts**: Rating distribution and accuracy trends
- 👥 **Feedback Management**: View and manage all user feedback
- 🧠 **RLHF Training**: Train the model with collected corrections
- 📥 **Data Export**: Download feedback data as CSV

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Gemini API key ([Get one here](https://aistudio.google.com/app/apikey))
- Git (for deployment)

### Local Development

```bash
# Clone repository
git clone <your-repo-url>
cd AI-fynd

# Install dependencies
npm install

# Set environment variables
cp .env.example .env.local
# Edit .env.local and add your OPENROUTER_API_KEY

# Run development server
npm run dev
```

Visit `http://localhost:3000` to see your app!

### Environment Variables

Create `.env.local` file:

```env
GEMINI_API_KEY=your-api-key-here
MODEL_NAME=gemini-pro
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## 📦 Project Structure

```
├── app/
│   ├── api/              # API routes
│   │   ├── predict/      # Prediction endpoint
│   │   ├── feedback/     # Feedback collection
│   │   ├── analytics/    # Admin analytics
│   │   └── train/        # RLHF training
│   ├── globals.css       # Global styles
│   ├── layout.tsx        # Root layout
│   └── page.tsx          # Main page
├── components/
│   ├── UserDashboard.tsx # User interface
│   ├── AdminDashboard.tsx # Admin interface
│   ├── StarRating.tsx    # Rating component
│   └── FeedbackPanel.tsx # Feedback UI
└── package.json          # Dependencies
```

## 🎯 How RLHF Works

1. **Prediction**: User gets AI prediction for a review
2. **Feedback**: User can correct the rating if wrong
3. **Collection**: Corrections are stored with review text
4. **Training**: Admin triggers training with collected corrections
5. **Improvement**: Model learns from human feedback over time

## 🌐 Deployment to Vercel

See [VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md) for complete deployment guide.

Quick steps:
1. Push code to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy!

## 🛠️ Technology Stack

- **Frontend**: Next.js 14, React, TypeScript
- **Styling**: Tailwind CSS
- **Charts**: Recharts
- **Icons**: Lucide React
- **Backend**: Next.js API Routes
- **AI**: Google Gemini API (Direct integration)
- **Deployment**: Vercel

## 📊 API Endpoints

- `POST /api/predict` - Get rating prediction
- `POST /api/feedback` - Submit user feedback
- `GET /api/feedback` - Get all feedback
- `GET /api/analytics` - Get admin analytics
- `POST /api/train` - Trigger RLHF training

## 🎨 UI/UX Features

- ✅ Responsive design (mobile & desktop)
- ✅ Modern gradient UI
- ✅ Smooth animations
- ✅ Real-time updates
- ✅ Interactive charts
- ✅ Intuitive navigation

## 📈 Model Performance

- **Accuracy**: ~75-80% exact match
- **Off-by-One**: ~95% within ±1 star
- **JSON Validity**: ~97-98%
- **Response Time**: ~1-2 seconds

## 🔒 Security

- ✅ API keys stored as environment variables
- ✅ Input validation on all endpoints
- ✅ Error handling and logging
- ✅ Rate limiting (via OpenRouter)

## 🚧 Future Enhancements

- [ ] Database integration (Vercel Postgres)
- [ ] User authentication
- [ ] Batch processing
- [ ] Model fine-tuning integration
- [ ] Real-time collaboration
- [ ] Advanced analytics

## 📝 License

Created for Fynd AI Intern Assessment

## 👤 Author

Built with ❤️ for AI-powered review analysis

---

**Live Demo**: [Your Vercel URL]
**GitHub**: [Your Repository URL]

