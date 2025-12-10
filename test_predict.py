#!/usr/bin/env python3
"""
Test script for the predict API to debug 500 errors
"""

import requests
import json

# Test data
test_review = "Amazing experience! The food was incredible, service was top-notch, and the atmosphere was perfect. Highly recommend this place!"

def test_predict_api():
    url = "http://localhost:3000/api/predict"  # Change to your Vercel URL when deployed

    payload = {
        "review_text": test_review
    }

    print("🧪 Testing Predict API")
    print(f"📝 Test review: {test_review[:50]}...")
    print(f"🌐 URL: {url}")

    try:
        response = requests.post(url, json=payload, timeout=60)

        print(f"📊 Status Code: {response.status_code}")

        if response.status_code == 200:
            result = response.json()
            print("✅ Success!")
            print(f"⭐ Predicted Stars: {result.get('predicted_stars')}")
            print(f"💬 Explanation: {result.get('explanation')}")
            print(f"🎯 Confidence: {result.get('confidence')}")
            print(f"🔍 RAG Used: {result.get('rag_used')}")
        else:
            error_data = response.json()
            print("❌ Error Response:")
            print(json.dumps(error_data, indent=2))

    except requests.exceptions.RequestException as e:
        print(f"🚨 Request Error: {e}")
    except Exception as e:
        print(f"🚨 Unexpected Error: {e}")

if __name__ == "__main__":
    print("🚀 Starting Predict API Test")
    print("=" * 50)
    test_predict_api()
    print("=" * 50)
    print("🏁 Test completed")
