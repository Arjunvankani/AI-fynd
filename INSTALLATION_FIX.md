# 🔧 Installation Fix - google-generativeai

## Problem
You're getting `ModuleNotFoundError: No module named 'google.generativeai'`

## Solution

### Step 1: Run the Installation Cell First

**IMPORTANT**: Always run cells in order! 

1. **Run Cell 1** (Installation cell) first:
   ```python
   %pip install --quiet pandas numpy matplotlib seaborn scikit-learn requests openpyxl google-generativeai
   ```

2. **Wait for it to complete** - You should see installation messages

3. **Then run Cell 2** (Imports) - It will auto-install if needed

4. **Finally run Cell 3** (Configuration)

### Step 2: Alternative - Manual Installation

If the notebook installation doesn't work, run this in your terminal:

```bash
pip install google-generativeai
```

Or if using conda:
```bash
conda install -c conda-forge google-generativeai
```

### Step 3: Restart Kernel

After installing:
1. Go to **Kernel** → **Restart Kernel** in Jupyter
2. Run all cells from the beginning

## Quick Fix Command

Run this in a new cell **before** your configuration cell:

```python
import subprocess
import sys

# Install google-generativeai
subprocess.check_call([sys.executable, "-m", "pip", "install", "google-generativeai"])

# Verify installation
import google.generativeai as genai
print("✓ google-generativeai installed successfully!")
```

## Verification

After installation, verify it works:

```python
import google.generativeai as genai
print(f"Google Generative AI version: {genai.__version__}")
```

---

**Tip**: I've already added auto-installation to Cell 2, so it should work automatically. Just make sure to run cells in order!

