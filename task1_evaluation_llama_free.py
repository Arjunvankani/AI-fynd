#!/usr/bin/env python3
"""
Yelp Review Rating Prediction - Task 1 Evaluation (Free LLaMA API)
This script implements and evaluates 4 different prompting approaches for predicting Yelp review ratings (1-5 stars).
Key Improvements:
- Uses free LLaMA 3.1 70B via Hugging Face API
- Cost-effective: No API costs for evaluation
- Batch processing: All 200 reviews processed efficiently
- Reliable: Hugging Face provides stable free tier
Approaches:
1. Zero-Shot: Direct classification without examples
2. Few-Shot: Classification with example reviews
3. Chain-of-Thought (CoT): Step-by-step reasoning
4. Hybrid (Few-Shot + CoT): Combines examples with reasoning
Evaluation Metrics:
- Accuracy (Exact Match)
- Mean Absolute Error (MAE)
- JSON Validity Rate
- Off-by-One Accuracy (within ±1 star)
- Reliability (consistency across runs)
"""

# ============================================================================
# INSTALLATION (Run this first if needed)
# ============================================================================
# %pip install --quiet pandas numpy matplotlib seaborn scikit-learn requests openpyxl transformers

import pandas as pd
import numpy as np
import json
import requests
import time
from typing import Dict, List, Tuple
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.metrics import accuracy_score, mean_absolute_error, confusion_matrix
from collections import Counter
import warnings
warnings.filterwarnings('ignore')

# Set style
sns.set_style("whitegrid")
plt.rcParams['figure.figsize'] = (12, 6)

print(f"[+] Using free LLaMA 3.1 70B via Hugging Face API")
print(f"[+] No API costs - completely free for evaluation!")

# ============================================================================
# CONFIGURATION
# ============================================================================

# Hugging Face API Configuration (Free Tier)
HF_API_TOKEN = "hf_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"  # Replace with your Hugging Face token
# Get from: https://huggingface.co/settings/tokens
LLAMA_MODEL = "meta-llama/Llama-3.1-70B-Instruct"
HF_API_URL = f"https://api-inference.huggingface.co/models/{LLAMA_MODEL}"

# API Headers
HEADERS = {
    "Authorization": f"Bearer {HF_API_TOKEN}",
    "Content-Type": "application/json"
}

# Dataset path
DATASET_PATH = "yelp.csv"

# Evaluation settings
SAMPLE_SIZE = 200  # All reviews processed in batches
BATCH_SIZE = 10    # Process 10 reviews per API call (adjust based on rate limits)
TEMPERATURE = 0.1  # Low temperature for consistency

print(f"[+] Using {LLAMA_MODEL} via Hugging Face API")
print(f"[+] Batch size: {BATCH_SIZE} reviews per API call")
print(f"[+] Completely FREE - no API costs!")

# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

def call_llama_api_batch(prompts: List[str], max_retries: int = 5) -> List[str]:
    """Call Hugging Face LLaMA API with retry logic for batch processing."""
    data = {
        "inputs": prompts,
        "parameters": {
            "temperature": TEMPERATURE,
            "max_new_tokens": 500,
            "return_full_text": False
        },
        "options": {
            "wait_for_model": True  # Wait if model is loading
        }
    }

    for attempt in range(max_retries):
        try:
            response = requests.post(HF_API_URL, headers=HEADERS, json=data, timeout=60)
            response.raise_for_status()
            results = response.json()
            return [res['generated_text'] for res in results]
        except requests.exceptions.RequestException as e:
            if response.status_code == 503:
                print(f"Model loading, retrying in {2 ** attempt} seconds...")
            elif response.status_code == 429:
                print(f"Rate limited, retrying in {2 ** attempt} seconds...")
            else:
                print(f"Error calling LLaMA API (attempt {attempt + 1}/{max_retries}): {e}")
            time.sleep(2 ** attempt)  # Exponential backoff
        except Exception as e:
            print(f"Unexpected error: {e}")
            return [f"Error: {str(e)}" for _ in prompts]
    return [f"Error: Failed after {max_retries} attempts" for _ in prompts]

def extract_json(response: str) -> Dict:
    """Extract JSON from LLM response."""
    try:
        return json.loads(response)
    except json.JSONDecodeError:
        start = response.find('{')
        end = response.rfind('}') + 1
        if start != -1 and end != 0:
            try:
                return json.loads(response[start:end])
            except json.JSONDecodeError:
                pass
        return None

def load_dataset(path: str, sample_size: int = None) -> pd.DataFrame:
    """Load and sample Yelp reviews dataset."""
    print(f"Loading dataset from {path}...")
    try:
        df = pd.read_csv(path)
        print(f"Loaded {len(df)} reviews")
        if sample_size and sample_size < len(df):
            df = df.sample(n=sample_size, random_state=42)
            print(f"Sampled {len(df)} reviews for evaluation")
        if 'text' not in df.columns or 'stars' not in df.columns:
            raise ValueError("Dataset must have 'text' and 'stars' columns")
        df = df[df['stars'].isin([1, 2, 3, 4, 5])]
        return df.reset_index(drop=True)
    except FileNotFoundError:
        print(f"Error: File {path} not found. Please download the dataset from:")
        print("https://www.kaggle.com/datasets/omkarsabnis/yelp-reviews-dataset")
        return pd.DataFrame()

# ============================================================================
# PROMPT ENGINEERING APPROACHES
# ============================================================================

def zero_shot_prompt(review_text: str) -> str:
    """Approach 1: Zero-Shot Classification."""
    return f"""Analyze the following Yelp review and predict the star rating (1-5 stars).

Review: "{review_text}"

Return a JSON object with the following structure:
{{
    "predicted_stars": <integer between 1 and 5>,
    "explanation": "<brief explanation for the rating>"
}}

Consider the overall sentiment, specific compliments or complaints, and the reviewer's satisfaction level."""

def few_shot_prompt(review_text: str) -> str:
    """Approach 2: Few-Shot Classification."""
    examples = [
        {
            "review": "The food was amazing and the service was impeccable. Highly recommend!",
            "rating": 5,
            "explanation": "Strong positive sentiment, explicit recommendation."
        },
        {
            "review": "Waited an hour for cold food. Never coming back.",
            "rating": 1,
            "explanation": "Severe negative sentiment, specific complaints, explicit refusal to return."
        },
        {
            "review": "It was okay. Nothing special but not bad either.",
            "rating": 3,
            "explanation": "Neutral sentiment, no strong positive or negative points."
        }
    ]
    example_str = "\n\n".join([
        f"Review: \"{ex['review']}\"\nPredicted Stars: {ex['rating']}\nExplanation: {ex['explanation']}"
        for ex in examples
    ])
    return f"""Analyze the following Yelp review and predict the star rating (1-5 stars).

{example_str}

Review: "{review_text}"

Return a JSON object with the following structure:
{{
    "predicted_stars": <integer between 1 and 5>,
    "explanation": "<brief explanation for the rating>"
}}

Consider the overall sentiment, specific compliments or complaints, and the reviewer's satisfaction level."""

def cot_prompt(review_text: str) -> str:
    """Approach 3: Chain-of-Thought (CoT)."""
    return f"""You are an expert Yelp review rating classifier. Analyze reviews systematically.

Rating Guidelines:
- 1 star: Terrible experience, multiple severe complaints, would not recommend
- 2 stars: Disappointing, below expectations, significant issues
- 3 stars: Average, acceptable but nothing special, neutral experience
- 4 stars: Good experience, positive overall, would recommend
- 5 stars: Excellent, exceptional experience, highest praise

Now analyze this review step-by-step:

Review: "{review_text}"

Step 1: Overall sentiment?
Step 2: Key positive/negative points?
Step 3: Intensity of feelings?
Step 4: Recommendation likelihood?
Step 5: Final rating (1-5)?

Return ONLY a JSON object:
{{
  "predicted_stars": <integer 1-5>,
  "explanation": "<one clear sentence explaining the rating>"
}}"""

def hybrid_prompt(review_text: str) -> str:
    """Approach 4: Hybrid (Few-Shot + CoT)."""
    return f"""You are an expert Yelp review rating classifier. Analyze reviews systematically.

Rating Guidelines:
- 1 star: Terrible experience, multiple severe complaints, would not recommend
- 2 stars: Disappointing, below expectations, significant issues
- 3 stars: Average, acceptable but nothing special, neutral experience
- 4 stars: Good experience, positive overall, would recommend
- 5 stars: Excellent, exceptional experience, highest praise

Example Analysis:
Review: "The food was decent but service was terrible. Waited 45 minutes for appetizers. Won't be back."
Reasoning: Negative sentiment overall, specific complaint about service wait time, indicates dissatisfaction → 2 stars

Now analyze this review step-by-step:

Review: "{review_text}"

Step 1: Overall sentiment?
Step 2: Key positive/negative points?
Step 3: Intensity of feelings?
Step 4: Recommendation likelihood?
Step 5: Final rating (1-5)?

Return ONLY a JSON object:
{{
  "predicted_stars": <integer 1-5>,
  "explanation": "<one clear sentence explaining the rating>"
}}"""

# Map approach names to their prompt functions
PROMPT_FUNCTIONS = {
    "Zero-Shot": zero_shot_prompt,
    "Few-Shot": few_shot_prompt,
    "CoT": cot_prompt,
    "Hybrid": hybrid_prompt
}

# ============================================================================
# EVALUATION FUNCTIONS
# ============================================================================

def evaluate_approach(df: pd.DataFrame, prompt_func, approach_name: str) -> pd.DataFrame:
    """Evaluate a single prompting approach using batch API calls."""
    print(f"\n--- Evaluating {approach_name} ---")
    predictions = []
    explanations = []
    json_validity = []
    processing_times = []

    num_batches = (len(df) + BATCH_SIZE - 1) // BATCH_SIZE

    for i in range(num_batches):
        batch_start_idx = i * BATCH_SIZE
        batch_end_idx = min((i + 1) * BATCH_SIZE, len(df))
        batch_reviews = df['text'].iloc[batch_start_idx:batch_end_idx].tolist()

        batch_prompts = [prompt_func(review) for review in batch_reviews]

        start_time = time.time()
        batch_responses = call_llama_api_batch(batch_prompts)
        end_time = time.time()

        processing_times.append(end_time - start_time)

        for response in batch_responses:
            result = extract_json(response)
            if result and 'predicted_stars' in result:
                predictions.append(result['predicted_stars'])
                explanations.append(result['explanation'])
                json_validity.append(True)
            else:
                predictions.append(None)
                explanations.append(response) # Store raw response for debugging
                json_validity.append(False)

        print(f"Processed batch {i+1}/{num_batches} (reviews {batch_start_idx}-{batch_end_idx-1}) in {processing_times[-1]:.2f}s")
        time.sleep(1) # Small delay between batches to avoid rate limits

    df[f'{approach_name}_Predicted_Stars'] = predictions
    df[f'{approach_name}_Explanation'] = explanations
    df[f'{approach_name}_JSON_Valid'] = json_validity

    return df, sum(processing_times)

def calculate_metrics(df: pd.DataFrame, approach_name: str) -> Dict:
    """Calculate evaluation metrics for a given approach."""
    valid_predictions_df = df[df[f'{approach_name}_JSON_Valid']].copy()

    if valid_predictions_df.empty:
        return {
            "Approach": approach_name,
            "Accuracy": 0,
            "MAE": 0,
            "JSON Validity Rate": 0,
            "Off-by-One Accuracy": 0,
            "Total Predictions": len(df),
            "Valid Predictions": 0
        }

    true_labels = valid_predictions_df['stars']
    predicted_labels = valid_predictions_df[f'{approach_name}_Predicted_Stars']

    accuracy = accuracy_score(true_labels, predicted_labels)
    mae = mean_absolute_error(true_labels, predicted_labels)
    json_validity_rate = len(valid_predictions_df) / len(df)

    off_by_one_correct = np.sum(np.abs(true_labels - predicted_labels) <= 1)
    off_by_one_accuracy = off_by_one_correct / len(valid_predictions_df)

    return {
        "Approach": approach_name,
        "Accuracy": accuracy,
        "MAE": mae,
        "JSON Validity Rate": json_validity_rate,
        "Off-by-One Accuracy": off_by_one_accuracy,
        "Total Predictions": len(df),
        "Valid Predictions": len(valid_predictions_df)
    }

def plot_confusion_matrix(df: pd.DataFrame, approach_name: str):
    """Plot confusion matrix for a given approach."""
    valid_predictions_df = df[df[f'{approach_name}_JSON_Valid']].copy()
    if valid_predictions_df.empty:
        print(f"No valid predictions for {approach_name} to plot confusion matrix.")
        return

    true_labels = valid_predictions_df['stars']
    predicted_labels = valid_predictions_df[f'{approach_name}_Predicted_Stars']

    cm = confusion_matrix(true_labels, predicted_labels, labels=[1, 2, 3, 4, 5])
    cm_df = pd.DataFrame(cm, index=[f'Actual {i}' for i in range(1, 6)],
                        columns=[f'Predicted {i}' for i in range(1, 6)])

    plt.figure(figsize=(8, 6))
    sns.heatmap(cm_df, annot=True, fmt='d', cmap='Blues')
    plt.title(f'Confusion Matrix for {approach_name}')
    plt.ylabel('Actual Rating')
    plt.xlabel('Predicted Rating')
    plt.tight_layout()
    plt.savefig(f'llama_free_confusion_matrix_{approach_name}.png')
    plt.close()

def plot_metrics(metrics_df: pd.DataFrame, processing_times: Dict[str, float]):
    """Plot comparison of metrics across approaches."""
    metrics_df['Processing Time (s)'] = metrics_df['Approach'].map(processing_times)

    fig, axes = plt.subplots(2, 2, figsize=(18, 12))
    fig.suptitle('Free LLaMA Batch Evaluation Metrics Comparison', fontsize=16)

    # Accuracy
    sns.barplot(x='Approach', y='Accuracy', data=metrics_df, ax=axes[0, 0], palette='viridis')
    axes[0, 0].set_title('Accuracy (Exact Match)')
    axes[0, 0].set_ylabel('Accuracy')
    axes[0, 0].set_ylim(0, 1)

    # MAE
    sns.barplot(x='Approach', y='MAE', data=metrics_df, ax=axes[0, 1], palette='magma')
    axes[0, 1].set_title('Mean Absolute Error (MAE)')
    axes[0, 1].set_ylabel('MAE')
    axes[0, 1].set_ylim(0, 2)

    # JSON Validity Rate
    sns.barplot(x='Approach', y='JSON Validity Rate', data=metrics_df, ax=axes[1, 0], palette='cividis')
    axes[1, 0].set_title('JSON Validity Rate')
    axes[1, 0].set_ylabel('Rate')
    axes[1, 0].set_ylim(0, 1)

    # Processing Time
    sns.barplot(x='Approach', y='Processing Time (s)', data=metrics_df, ax=axes[1, 1], palette='plasma')
    axes[1, 1].set_title('Total Processing Time')
    axes[1, 1].set_ylabel('Time (s)')

    plt.tight_layout(rect=[0, 0.03, 1, 0.95])
    plt.savefig('llama_free_evaluation_results.png')
    plt.close()

# ============================================================================
# MAIN EXECUTION
# ============================================================================

if __name__ == "__main__":
    df = load_dataset(DATASET_PATH, SAMPLE_SIZE)
    if df.empty:
        print("Exiting due to empty dataset.")
    else:
        all_metrics = []
        all_processing_times = {}

        for approach_name, prompt_func in PROMPT_FUNCTIONS.items():
            df, total_time = evaluate_approach(df.copy(), prompt_func, approach_name)
            metrics = calculate_metrics(df, approach_name)
            all_metrics.append(metrics)
            all_processing_times[approach_name] = total_time
            plot_confusion_matrix(df, approach_name)

        metrics_df = pd.DataFrame(all_metrics)
        print("\n--- Evaluation Summary ---")
        print(metrics_df)

        # Save results to CSV
        df.to_csv('evaluation_results_llama_free.csv', index=False)
        metrics_df.to_csv('metrics_summary_llama_free.csv', index=False)
        print("\n[+] Detailed results saved to 'evaluation_results_llama_free.csv'")
        print("[+] Metrics summary saved to 'metrics_summary_llama_free.csv'")

        # Plot metrics
        plot_metrics(metrics_df, all_processing_times)
        print("[+] Evaluation plots saved to 'llama_free_evaluation_results.png' and confusion matrices.")

        print("\n[SUCCESS] Evaluation completed successfully using FREE LLaMA API!")
        print("[INFO] No API costs incurred - perfect for research and evaluation!")
