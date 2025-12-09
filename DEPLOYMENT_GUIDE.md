# 🚀 Deployment Guide - Hugging Face Spaces

Complete step-by-step guide for deploying your Yelp Rating Prediction dashboards to Hugging Face Spaces.

## Prerequisites

1. ✅ Hugging Face account ([Sign up here](https://huggingface.co/join))
2. ✅ OpenRouter API key ([Get one here](https://openrouter.ai/keys))
3. ✅ GitHub account (optional, for Git-based deployment)
4. ✅ Your project files ready (`app.py` and `requirements.txt`)

## Method 1: Direct Upload (Easiest)

### Step 1: Create a New Space

1. Go to [Hugging Face Spaces](https://huggingface.co/spaces)
2. Click **"Create new Space"** button
3. Fill in the form:
   - **Space name**: `yelp-rating-predictor` (or your choice)
   - **SDK**: Select **"Gradio"**
   - **Hardware**: Select **"CPU basic"** (free tier)
   - **Visibility**: **Public** (required for assessment)
4. Click **"Create Space"**

### Step 2: Upload Files

1. In your new Space, click **"Files"** tab
2. Click **"Add file"** → **"Upload file"**
3. Upload these files:
   - `app.py` (main application file)
   - `requirements.txt` (dependencies)

### Step 3: Set API Key as Secret

1. Click **"Settings"** tab in your Space
2. Scroll to **"Repository secrets"** section
3. Click **"New secret"**
4. Add:
   - **Name**: `OPENROUTER_API_KEY`
   - **Value**: Your OpenRouter API key
5. Click **"Add secret"**

### Step 4: Configure Model (Optional)

1. In Settings → Repository secrets, add another secret:
   - **Name**: `MODEL_NAME`
   - **Value**: `anthropic/claude-3.5-sonnet` (or your preferred model)

### Step 5: Wait for Deployment

- Hugging Face will automatically detect Gradio and start building
- Wait 2-3 minutes for first deployment
- Check the **"Logs"** tab if there are any errors
- Your Space URL will be: `https://huggingface.co/spaces/your-username/your-space-name`

### Step 6: Test Your Deployment

1. Visit your Space URL
2. Test the User Dashboard with a sample review
3. Test the Admin Dashboard with a sample CSV

## Method 2: Git-Based Deployment (Recommended)

### Step 1: Prepare Repository

```bash
# Initialize git repository
git init

# Create .gitignore
echo "*.csv
*.png
*.pkl
__pycache__/
*.pyc
.env
.DS_Store" > .gitignore

# Add files
git add app.py requirements.txt README.md .gitignore
git commit -m "Initial commit: Yelp rating prediction app"
```

### Step 2: Connect to Hugging Face

1. Create a new Space on Hugging Face (same as Method 1, Step 1)
2. In Space settings, note the Git URL (e.g., `https://huggingface.co/spaces/username/space-name`)

### Step 3: Push Code

```bash
# Add Hugging Face remote
git remote add huggingface https://huggingface.co/spaces/username/space-name

# Push code
git push huggingface main
```

### Step 4: Set Secrets

- Follow Method 1, Step 3-4 to set API keys as secrets

## File Structure for Deployment

Your Space should have this structure:

```
your-space/
├── app.py              # Main Gradio application (REQUIRED)
├── requirements.txt    # Python dependencies (REQUIRED)
└── README.md          # Optional: Space description
```

## Environment Variables in app.py

The `app.py` file already handles environment variables:

```python
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY", "YOUR_API_KEY_HERE")
MODEL_NAME = os.getenv("MODEL_NAME", "anthropic/claude-3.5-sonnet")
```

This means:
- ✅ Secrets set in HF Spaces are automatically used
- ✅ No need to hardcode API keys
- ✅ Safe for public repositories

## Best Models for Deployment

### Free Tier (Recommended for Testing)

```python
MODEL_NAME = "google/gemini-pro-1.5"
```
- ✅ **FREE** - No cost
- ✅ Fast response times
- ✅ Good accuracy (~74-76%)
- ✅ Perfect for public demos

### Paid Tier (Best Accuracy)

```python
MODEL_NAME = "anthropic/claude-3.5-sonnet"
```
- ✅ Best accuracy (~78-82%)
- ✅ Excellent explanations
- ⚠️ Costs ~$0.003 per request
- ✅ Best for final submission

### Balanced Option

```python
MODEL_NAME = "openai/gpt-4o-mini"
```
- ✅ Good accuracy (~76-79%)
- ✅ Fast and reliable
- ⚠️ Costs ~$0.00015 per request
- ✅ Good for production

## Troubleshooting Deployment

### Issue: "Module not found"

**Solution**: Check `requirements.txt` includes all dependencies:
```
gradio>=4.0.0
pandas>=1.5.0
numpy>=1.23.0
requests>=2.28.0
plotly>=5.14.0
scikit-learn>=1.2.0
```

### Issue: "API key not found"

**Solution**:
1. Verify secret is set: Settings → Repository secrets
2. Check secret name matches exactly: `OPENROUTER_API_KEY`
3. Restart the Space (Settings → Restart this Space)

### Issue: "Model not available"

**Solution**:
1. Check model name is correct
2. Verify your OpenRouter account has access
3. For free models, ensure you're using the correct identifier

### Issue: "Timeout errors"

**Solution**:
1. Reduce batch size in Admin Dashboard
2. Add longer delays between API calls
3. Use faster models (Gemini instead of Claude)

### Issue: "Build failed"

**Solution**:
1. Check Logs tab for specific errors
2. Verify Python version compatibility
3. Ensure `requirements.txt` format is correct

## Testing Your Deployment

### Test Checklist

- [ ] User Dashboard loads correctly
- [ ] Can enter a review and get prediction
- [ ] Rating display shows correctly (⭐ stars)
- [ ] Explanation is displayed
- [ ] Confidence level shows
- [ ] Admin Dashboard loads
- [ ] Can upload CSV file
- [ ] Batch processing works
- [ ] Charts/visualizations render
- [ ] Download CSV works

### Sample Test CSV

Create `test_reviews.csv` for testing:

```csv
text,stars
"This restaurant was amazing! Best food ever!",5
"Terrible service and cold food. Very disappointed.",1
"It was okay. Nothing special.",3
```

## Updating Your Deployment

### Method 1: Direct Upload

1. Edit files locally
2. Upload updated files via HF Spaces web interface
3. Space will automatically rebuild

### Method 2: Git Push

```bash
# Make changes locally
git add .
git commit -m "Update app"
git push huggingface main
```

## Monitoring Your Space

### Logs

- View logs in **"Logs"** tab
- Check for API errors, timeouts, etc.
- Monitor resource usage

### Usage Stats

- View in **"Metrics"** tab
- Track number of visitors
- Monitor API call frequency

## Security Best Practices

1. ✅ **Never commit API keys** to repository
2. ✅ **Always use secrets** for sensitive data
3. ✅ **Use environment variables** in code
4. ✅ **Set appropriate visibility** (public for assessment)
5. ✅ **Monitor API usage** to prevent abuse

## Cost Estimation

### Free Tier (Gemini)

- Cost: **$0**
- Rate limits: ~60 requests/minute
- Perfect for: Testing and evaluation

### Paid Tier (Claude Sonnet)

- Cost: ~$0.003 per prediction
- 200 predictions: ~$0.60
- Perfect for: Final submission

### Monthly Estimates

- 1,000 predictions/day: ~$90/month (Claude)
- 1,000 predictions/day: $0/month (Gemini)

## Final Checklist Before Submission

- [ ] Both dashboards deployed and accessible
- [ ] Public URLs working
- [ ] User Dashboard functional
- [ ] Admin Dashboard functional
- [ ] API keys set as secrets (not hardcoded)
- [ ] README updated with deployment URLs
- [ ] No errors in logs
- [ ] Tested with sample data
- [ ] All files committed to repository

## Getting Your Deployment URLs

1. **User Dashboard**: `https://huggingface.co/spaces/username/space-name` (default tab)
2. **Admin Dashboard**: Same URL, click "Admin Dashboard" tab

Both dashboards are in the same deployment, just different tabs!

## Support Resources

- [Hugging Face Spaces Docs](https://huggingface.co/docs/hub/spaces)
- [Gradio Documentation](https://gradio.app/docs/)
- [OpenRouter API Docs](https://openrouter.ai/docs)

---

**Ready to deploy?** Follow Method 1 (Direct Upload) for the fastest setup! 🚀

