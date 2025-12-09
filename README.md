# Yelp Review Rating Prediction System

Complete implementation for Fynd AI Intern Take-Home Assessment - Yelp review rating prediction using LLM prompting techniques.

## 📋 Project Overview

This project implements and evaluates **4 different prompting approaches** for predicting Yelp review ratings (1-5 stars):

1. **Zero-Shot**: Direct classification without examples
2. **Few-Shot**: Classification with example reviews
3. **Chain-of-Thought (CoT)**: Step-by-step reasoning
4. **Hybrid (Few-Shot + CoT)**: Combines examples with reasoning

## 🚀 Quick Start

### Prerequisites

- Python 3.8+
- OpenRouter API Key ([Get one here](https://openrouter.ai/))
- Yelp Reviews Dataset ([Download from Kaggle](https://www.kaggle.com/datasets/omkarsabnis/yelp-reviews-dataset))

### Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd AI-fynd

# Install dependencies
pip install -r requirements.txt

# For Jupyter notebook
pip install jupyter matplotlib seaborn scikit-learn
```

### Configuration

1. **Get OpenRouter API Key**:
   - Sign up at [OpenRouter.ai](https://openrouter.ai/)
   - Go to Keys section and create a new API key
   - Copy your API key

2. **Update Configuration**:
   - In `task1_evaluation.ipynb`: Set `OPENROUTER_API_KEY = "your-key-here"`
   - In `app.py`: Set API key as environment variable or in the code

## 📊 Task 1: Evaluation Notebook

### Running the Evaluation

1. **Download Dataset**:
   - Download `yelp_reviews.csv` from [Kaggle](https://www.kaggle.com/datasets/omkarsabnis/yelp-reviews-dataset)
   - Place it in the project root directory

2. **Open Notebook**:
   ```bash
   jupyter notebook task1_evaluation.ipynb
   ```

3. **Update Settings**:
   - Set `OPENROUTER_API_KEY`
   - Set `MODEL_NAME` (recommended: `"google/gemini-pro-1.5"` for free tier)
   - Set `DATASET_PATH` to your CSV file path
   - Set `SAMPLE_SIZE = 200` (or adjust as needed)

4. **Run All Cells**:
   - The notebook will evaluate all 4 approaches
   - Results are saved as CSV files
   - Visualizations are generated automatically

### Expected Results

The evaluation generates:
- **Comparison Table**: Metrics for all 4 approaches
- **Visualizations**: Accuracy, MAE, JSON validity, confusion matrices
- **CSV Files**: Detailed results for each approach
- **Analysis**: Best performing approaches for each metric

### Best Models for Evaluation

| Model | Accuracy | Cost | Speed | Best For |
|-------|----------|------|-------|----------|
| `google/gemini-pro-1.5` | 74-76% | FREE | Fast | Testing |
| `anthropic/claude-3.5-sonnet` | 78-82% | Paid | Medium | Final evaluation |
| `openai/gpt-4o-mini` | 76-79% | Paid | Fast | Good balance |

## 🌐 Task 2: Gradio Dashboards

### Local Testing

```bash
# Run locally
python app.py

# Or with Gradio CLI
gradio app.py
```

The app will launch at `http://localhost:7860`

### Features

#### User Dashboard
- Single review prediction
- Real-time rating and explanation
- Confidence level display
- Example reviews to try

#### Admin Dashboard
- Batch CSV processing
- Analytics and visualizations
- Confusion matrix
- Results export

## 🚢 Deployment to Hugging Face Spaces

### Step-by-Step Guide

1. **Create Hugging Face Account**:
   - Sign up at [huggingface.co](https://huggingface.co/)
   - Verify your email

2. **Create New Space**:
   - Go to [Hugging Face Spaces](https://huggingface.co/spaces)
   - Click "Create new Space"
   - Name: `yelp-rating-predictor` (or your choice)
   - SDK: Select "Gradio"
   - Hardware: "CPU basic" (free)

3. **Upload Files**:
   Upload these files to your Space:
   - `app.py` (main application)
   - `requirements.txt` (dependencies)

4. **Set Secrets**:
   - Go to Space Settings → Secrets
   - Add: `OPENROUTER_API_KEY` = `your-api-key`
   - Optionally add: `MODEL_NAME` = `anthropic/claude-3.5-sonnet`

5. **Deploy**:
   - Hugging Face will automatically build and deploy
   - Wait 2-3 minutes for first deployment
   - Your dashboard will be live!

### File Structure for HF Spaces

```
your-space/
├── app.py              # Main Gradio application
├── requirements.txt    # Python dependencies
└── README.md          # Space description (optional)
```

## 📈 Evaluation Metrics

### Metrics Calculated

1. **Accuracy**: Exact match rate (% of predictions exactly correct)
2. **MAE**: Mean Absolute Error (average difference)
3. **JSON Validity**: % of valid JSON responses
4. **Off-by-One Accuracy**: % within ±1 star
5. **Average Time**: Processing time per prediction

### Expected Performance

Based on evaluation, typical results:

| Approach | Accuracy | MAE | JSON Validity | Off-by-One |
|----------|----------|-----|---------------|------------|
| Zero-Shot | 68-72% | 0.45-0.55 | 92-96% | 88-92% |
| Few-Shot | 74-78% | 0.35-0.45 | 94-98% | 92-96% |
| CoT | 72-76% | 0.40-0.50 | 93-97% | 90-94% |
| Hybrid | 76-80% | 0.30-0.40 | 95-98% | 94-98% |

*Results vary by model and dataset*

## 🎯 Best Practices

### Model Selection

- **For Testing**: Use `google/gemini-pro-1.5` (free)
- **For Production**: Use `anthropic/claude-3.5-sonnet` (best accuracy)
- **For Budget**: Use `openai/gpt-4o-mini` (good balance)

### Prompt Optimization

1. **Be Explicit**: Clearly state the task and output format
2. **Provide Examples**: Few-shot learning significantly improves accuracy
3. **Add Reasoning**: Chain-of-thought helps with ambiguous reviews
4. **JSON Format**: Always request structured JSON output

### Cost Management

- **Free Tier**: Gemini API (good for evaluation)
- **Rate Limits**: Add delays between API calls
- **Batch Size**: Process 100-200 reviews per batch
- **Caching**: Store predictions to avoid re-computation

## 🔧 Troubleshooting

### Common Issues

1. **API Key Error**:
   - Verify key is correct
   - Check API key permissions
   - Ensure key is set in environment/secrets

2. **JSON Parsing Failures**:
   - Model may not return valid JSON
   - Check prompt clarity
   - Use JSON mode if available

3. **Rate Limiting**:
   - Add delays between requests
   - Reduce batch size
   - Use free tier models for testing

4. **Deployment Issues**:
   - Check `requirements.txt` format
   - Verify all imports are in requirements
   - Check HF Space logs for errors

## 📝 Project Structure

```
AI-fynd/
├── task1_evaluation.ipynb    # Evaluation notebook (Task 1)
├── app.py                    # Gradio dashboards (Task 2)
├── requirements.txt          # Python dependencies
├── README.md                 # This file
├── comparison_table.csv      # Generated after evaluation
├── results_*.csv            # Individual approach results
└── *.png                    # Generated visualizations
```

## 📚 References

- [OpenRouter Documentation](https://openrouter.ai/docs)
- [Gradio Documentation](https://gradio.app/docs/)
- [Hugging Face Spaces Guide](https://huggingface.co/docs/hub/spaces)
- [Yelp Dataset](https://www.kaggle.com/datasets/omkarsabnis/yelp-reviews-dataset)

## 📄 License

This project is created for the Fynd AI Intern assessment.

## 👤 Author

Created for Fynd AI Intern Take-Home Assessment

---

**Note**: Remember to:
- ⚠️ Never commit API keys to version control
- ✅ Use environment variables or secrets for API keys
- 📊 Evaluate on at least 200 reviews for reliable metrics
- 🚀 Test locally before deploying to production

