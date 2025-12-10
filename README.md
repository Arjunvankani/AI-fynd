# 🌟 Yelp Review Rating Predictor

> **Built with curiosity, caffeine, and a lot of AI engineering** ☕🤖

Hey there! 👋 Welcome to my Yelp rating prediction system. This project was born out of a take-home assessment for Fynd AI, but honestly, it turned into something I'm genuinely proud of. Let me walk you through it!

[![Live Demo](https://img.shields.io/badge/Live-Demo-brightgreen)](https://ai-fynd-arjuns-projects-9e82a67f.vercel.app/)
[![GitHub](https://img.shields.io/badge/GitHub-Repo-blue)](https://github.com/Arjunvankani/AI-fynd/)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-Connect-0077B5)](https://www.linkedin.com/in/arjunvankani/)

---

## 🎯 What's This All About?

You know that moment when you're reading a Yelp review and thinking, "Wait, is this a 3-star or 4-star review?" Well, I built an AI that does exactly that—except it actually commits to a rating! 😄

This system uses Google's Gemini 2.5 Flash to predict star ratings (1-5 ⭐) from review text using four different prompting techniques. No model training required—just pure prompt engineering magic! ✨

### Why Should You Care?

- **Real-world application**: Automated sentiment analysis for businesses
- **Prompt engineering showcase**: Four different approaches, from simple to sophisticated
- **Production-ready**: Fully deployed web app with admin dashboard
- **Learning resource**: Perfect for understanding LLM prompting strategies

---

## 🧠 The Four Approaches (aka "The Experiments")

I didn't just stick with one method—I tested four different prompting strategies to see what works best:

### 1. 🎯 Zero-Shot: "Just Wing It"
No examples, no hand-holding. Just tell the AI what to do and hope for the best.

**Pros**: Fast, simple, no prep needed  
**Cons**: Sometimes confused by sarcasm (aren't we all?)  
**Accuracy**: ~70% (not bad for a first try!)

### 2. 📚 Few-Shot: "Learn by Example"
I showed the AI a few examples of reviews with their ratings, like a mini training session.

**Pros**: Much better accuracy, learns patterns quickly  
**Cons**: Longer prompts = slightly slower  
**Accuracy**: ~76% (we're getting somewhere!)

### 3. 🤔 Chain-of-Thought: "Show Your Work"
Remember when your math teacher said "show your reasoning"? Same idea here.

**Pros**: Better at handling tricky, ambiguous reviews  
**Cons**: Takes more time, uses more tokens  
**Accuracy**: ~73% (thoughtful but not the fastest)

### 4. 🚀 Hybrid: "Best of Both Worlds"
Combined examples with reasoning. This is where things got interesting!

**Pros**: Highest accuracy, robust across all review types  
**Cons**: Longest prompts, but worth it  
**Accuracy**: ~78% (🏆 Winner!)

---

## 📊 The Results (aka "What Actually Happened")

After testing on 200 real Yelp reviews, here's what I found:

| Approach | Accuracy | MAE | Off-by-One | Best For |
|----------|----------|-----|------------|----------|
| Zero-Shot | 70.5% | 0.48 | 90.2% | Quick tests |
| Few-Shot | 75.8% | 0.38 | 94.1% | General use |
| CoT | 73.1% | 0.43 | 92.0% | Complex reviews |
| **Hybrid** | **77.6%** | **0.33** | **95.3%** | **Production** ✨ |

**Translation**: The Hybrid approach gets it exactly right 78% of the time, and within ±1 star 95% of the time. Pretty solid for an AI reading between the lines of human emotions!

---

## 🎨 The Interface (Because UX Matters)

I built two dashboards because why not? 😎

### 👤 User Dashboard

<img width="1896" height="882" alt="fy3" src="https://github.com/user-attachments/assets/f7897e1f-faea-4f19-9315-f2b365e85c16" />

- **Type or paste** any Yelp review
- Get **instant rating prediction** with AI explanation
- See **confidence scores** (yes, the AI can doubt itself too!)
- **Disagree?** Submit feedback to help improve the system

### 🔐 Admin Dashboard
<img width="1875" height="882" alt="fy5" src="https://github.com/user-attachments/assets/9c90692e-93ae-40be-ae42-85adebc37871" />


- **Real-time analytics**: Track accuracy, user feedback, trends
- **Time-series charts**: See how ratings change over time
- **Confusion matrices**: Visualize where the AI gets confused
- **Review management**: View, edit, and export all predictions
- **AI insights**: Auto-generated summaries and business recommendations

---


## Output
Below are example placeholders for visual templates that may be included in UI or documentation.
# 1: Users Pannel: Users can type a Yelp review and click ”Predict Rating” to view the model’s predicted star value. The right panel displays the predicted rating, an explanation of the reasoning, and a confidence score.

<img width="1888" height="963" alt="fy1" src="https://github.com/user-attachments/assets/545e0a8c-f964-4e9c-aeec-23cc4979ac73" />


# 2: Users Pannel: If a user disagrees with the prediction, they may submit a corrected rating. This correction is logged in the backend and contributes to training data preparation

<img width="1877" height="872" alt="fy2" src="https://github.com/user-attachments/assets/ab490cc5-0b3c-47c3-83ea-78d80c42ce01" />

# 3: Users Pannel: After submitting a corrected rating, the interface displays a confirmation that the feedback was successfully recorded. The system uses this data for improving model performance.

<img width="1896" height="882" alt="fy3" src="https://github.com/user-attachments/assets/21a9858a-17d4-48cd-ab8f-038d1352dd11" />

# 4: Admin Pannel: The Admin Dashboard summarizes key metrics such as total feedback, accuracy, number of corrections, and distribution of positive/neutral/negative reviews. Charts visualize rating distributions and response patterns

<img width="1882" height="888" alt="fy4" src="https://github.com/user-attachments/assets/67ef2d7c-02ca-4d2e-8850-e17cfd7d4542" />

# 5 : Admin Panel:

<img width="1875" height="882" alt="fy5" src="https://github.com/user-attachments/assets/2ff75fe4-df01-485e-854e-3c5594968d54" />

# 6: Admin Pannel: This chart displays how average predicted rating changes over time. The admin can toggle the time granularity (minute, hour, day, week, month), enabling monitoring of rating trends and potential model drift.

<img width="1707" height="552" alt="fy6" src="https://github.com/user-attachments/assets/3e0f2314-c53a-4842-9716-fe9bad11eea0" />

# 7 : Admin Pannel: This page lists all user submissions collected so far. For each entry, the system shows the original review, user rating, predicted rating, correctness label, actions(edit/delete), and timestamp. Selecting a row expands it to reveal the full review and an AI-generated summary + recommended actions section.

<img width="1918" height="867" alt="fy7" src="https://github.com/user-attachments/assets/24b9b85b-a169-4165-af81-abf0c3d885fd" />




# 8: Admin Pannel: When a review row is expanded, the system displays a detailed view including the full review text, the model’s generated explanation, and AI-suggested recommended
business actions. This provides interpretability for each prediction.

<img width="1871" height="877" alt="fy8" src="https://github.com/user-attachments/assets/c1b30ecb-5b41-429d-8048-0d8a3b5437a9" />







## 🚀 Try It Yourself

### Option 1: Use the Live Demo (Easiest)
Just visit: [ai-fynd-arjuns-projects-9e82a67f.vercel.app](https://ai-fynd-arjuns-projects-9e82a67f.vercel.app/)

No setup needed. Just type a review and boom! 💥

### Option 2: Run It Locally (For Developers)

```bash
# Clone this bad boy
git clone https://github.com/Arjunvankani/AI-fynd.git
cd AI-fynd

# Install dependencies
npm install  # For the web app
pip install -r requirements.txt  # For the Jupyter notebooks

# Set up your API key
echo "GEMINI_API_KEY=your-key-here" > .env.local

# Run the web app
npm run dev

# Or run the Jupyter evaluation
jupyter notebook task1_evaluation.ipynb
```

**Get Your API Key**: Head to [Google AI Studio](https://aistudio.google.com/app/apikey) and grab a free Gemini API key. It's free for reasonable usage!

---

## 🔬 Running the Evaluation Notebook

Want to see the science behind the magic? Here's how:

1. **Download the dataset**: Grab `yelp.csv` from [Kaggle](https://www.kaggle.com/datasets/omkarsabnis/yelp-reviews-dataset)
2. **Open the notebook**: `task1_evaluation.ipynb`
3. **Configure settings**:
   ```python
   GEMINI_API_KEY = "your-api-key-here"
   MODEL_NAME = "gemini-2.0-flash-exp"  # Fast and free!
   SAMPLE_SIZE = 200  # Start small, scale up
   ```
4. **Run all cells** and watch the magic happen ✨
5. **Check outputs**: CSV results, comparison tables, confusion matrices

**Pro tip**: Start with 20-50 reviews to test, then scale up. The full 200 takes about 20-30 minutes.

---

## 📁 What's Inside?

```
AI-fynd/
├── 📓 task1_evaluation.ipynb       # The main evaluation notebook
├── 🌐 app/                         # Next.js web application
├── 🎨 components/                  # React UI components
├── 🔧 lib/                         # Utility functions & API calls
├── 📊 results_*.csv                # Evaluation results (generated)
├── 📈 confusion_matrices.png       # Visualization (generated)
├── 📝 README.md                    # You are here!
├── 📦 package.json                 # Node dependencies
└── 🐍 requirements.txt             # Python dependencies
```

---

## 🎓 What I Learned

This project taught me a lot:

1. **Prompt engineering is an art**: Small wording changes = big accuracy differences
2. **JSON parsing is harder than it looks**: LLMs sometimes get creative with formatting
3. **Rate limits are real**: Always add delays between API calls
4. **Hybrid approaches work**: Combining techniques often beats individual ones
5. **UX matters**: Even the best AI is useless with a bad interface

---

## 🐛 Common Hiccups (And How to Fix Them)

### "My accuracy is stuck at 20%!"
- Check if your API key is valid
- Ensure `max_output_tokens` is at least 1000
- Verify JSON parsing isn't failing (add debug prints)

### "Rate limit errors everywhere!"
- Add `time.sleep(0.5)` between API calls
- Use batch processing (50 reviews per call)
- Consider upgrading your API tier

### "Deployment failed on Vercel!"
- Check environment variables are set
- Verify API key in Vercel dashboard
- Look at deployment logs for specific errors

### "JSON parsing keeps failing!"
- Increase `max_output_tokens` to 1000+
- Simplify your prompts (shorter is often better)
- Add retry logic with fallback defaults

---

## 🌟 Future Ideas (aka "TODO List")

- [ ] Add support for multiple languages
- [ ] Implement fine-tuning on user corrections
- [ ] Build a Chrome extension for live Yelp integration
- [ ] Add sentiment analysis breakdown (food, service, ambiance)
- [ ] Create a mobile app version
- [ ] Implement A/B testing for different prompts

---

## 🤝 Contributing

Found a bug? Have a cool idea? PRs are welcome! Just:

1. Fork the repo
2. Create a feature branch (`git checkout -b cool-feature`)
3. Commit your changes (`git commit -m 'Add cool feature'`)
4. Push to the branch (`git push origin cool-feature`)
5. Open a Pull Request

---

## 📜 License

This project was created for the Fynd AI internship assessment. Feel free to learn from it, but please don't submit it as your own work! 😉

---

## 💭 Final Thoughts

Building this project was a journey—from late-night debugging sessions to the "aha!" moments when accuracy jumped. The biggest lesson? Prompt engineering is powerful, but understanding your model's quirks is what makes the difference.

If you're working on something similar, my advice:
- **Start simple** (zero-shot is your friend for testing)
- **Iterate quickly** (don't spend hours on the perfect prompt)
- **Test on real data** (synthetic examples lie!)
- **Build for users** (even research projects need good UX)

---

## 🙏 Acknowledgments

- **Fynd AI** for the awesome assessment prompt
- **Google** for the Gemini API (seriously impressive!)
- **Kaggle** for the Yelp dataset
- **Coffee** for existing ☕

---

## 📫 Get in Touch

Built by **Arjun Vankani** with passion and purpose 🚀

- 💼 [LinkedIn](https://www.linkedin.com/in/arjunvankani/)
- 💻 [GitHub](https://github.com/Arjunvankani)
- 📧 Email: arjunvankani@example.com
- 🌐 [Live Demo](https://ai-fynd-arjuns-projects-9e82a67f.vercel.app/)

**Questions? Feedback? Just want to chat about AI?** Feel free to reach out! I love talking about this stuff. 😊

---

<div align="center">

**If this project helped you, give it a ⭐ on GitHub!**

Made with ❤️ and a lot of ☕ in December 2025

</div>

---

### 📌 Quick Links

- [📊 View Live Demo](https://ai-fynd-arjuns-projects-9e82a67f.vercel.app/)
- [📓 Evaluation Notebook](./task1_evaluation.ipynb)
- [📚 Full Report PDF](./Fynd.pdf)
- [🚀 Deployment Guide](./DEPLOYMENT_GUIDE.md)
- [🔧 Troubleshooting](./INSTALLATION_FIX.md)

---

*P.S. - If you're from Fynd AI and reading this... hi! 👋 Thanks for the fun challenge!*
