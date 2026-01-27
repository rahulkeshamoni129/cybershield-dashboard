import os
import json
import numpy as np
from flask import Flask, request, jsonify
from flask_cors import CORS
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

app = Flask(__name__)
CORS(app)

KNOWLEDGE_FILE = os.path.join(os.path.dirname(__file__), 'data', 'knowledge.json')

# Global variables for the model
vectorizer = None
tfidf_matrix = None
knowledge_base = []

def load_knowledge_base():
    global knowledge_base
    try:
        with open(KNOWLEDGE_FILE, 'r') as f:
            knowledge_base = json.load(f)
        print(f"Loaded {len(knowledge_base)} entries from knowledge base.")
    except Exception as e:
        print(f"Error loading knowledge base: {e}")
        knowledge_base = []

def train_model():
    global vectorizer, tfidf_matrix, knowledge_base
    if not knowledge_base:
        return

    # Combine keywords, question, and answer for richer context matching
    corpus = [
        f"{entry.get('keywords', '')} {entry.get('question', '')} {entry.get('answer', '')}" 
        for entry in knowledge_base
    ]
    
    vectorizer = TfidfVectorizer(stop_words='english')
    tfidf_matrix = vectorizer.fit_transform(corpus)
    print("AI Model retrained successfully.")

# Initial load and train
load_knowledge_base()
train_model()

@app.route('/chat', methods=['POST'])
def chat():
    global vectorizer, tfidf_matrix, knowledge_base
    
    if not vectorizer or not knowledge_base:
        return jsonify({
            "reply": "My brain is currently empty. Please train me first!",
            "severity": "Unknown"
        })

    data = request.json
    user_message = data.get('message', '').lower()
    
    # 1. Vectorize the user query
    query_vec = vectorizer.transform([user_message])
    
    # 2. Calculate cosine similarity against all knowledge entries
    similarities = cosine_similarity(query_vec, tfidf_matrix).flatten()
    
    # 3. Find the best match
    best_match_idx = np.argmax(similarities)
    best_score = similarities[best_match_idx]
    
    # Threshold for "I don't know"
    # 0.1 is a low bar, but allows for fuzzy matching. 
    # If the user types "ddos", it hits "ddos" in keywords resulting in high score.
    if best_score < 0.1: 
        return jsonify({
            "reply": "I'm not sure about that specific topic yet. I specialize in cybersecurity threats like DDoS, Phishing, and Malware. Try asking me about those!",
            "severity": "Unknown",
            "mitre_id": None
        })
    
    match = knowledge_base[best_match_idx]
    
    return jsonify({
        "reply": match['answer'],
        "mitre_id": match.get('mitre_id'),
        "mitre_name": match.get('mitre_name'),
        "severity": match.get('severity', 'Info'),
        "confidence": float(best_score)
    })

@app.route('/train', methods=['POST'])
def train_endpoint():
    """
    Endpoint to add new knowledge dynamically.
    Expects JSON: { "question": "...", "answer": "...", "keywords": "...", "mitre_id": "..." }
    """
    data = request.json
    if not data or 'question' not in data or 'answer' not in data:
        return jsonify({"error": "Missing usage question or answer"}), 400
        
    new_entry = {
        "keywords": data.get('keywords', ''),
        "question": data['question'],
        "answer": data['answer'],
        "mitre_id": data.get('mitre_id'),
        "mitre_name": data.get('mitre_name'),
        "severity": data.get('severity', 'Info')
    }
    
    # Add to in-memory list
    knowledge_base.append(new_entry)
    
    # Save to file
    try:
        with open(KNOWLEDGE_FILE, 'w') as f:
            json.dump(knowledge_base, f, indent=2)
    except Exception as e:
        return jsonify({"error": f"Failed to save to disk: {e}"}), 500
        
    # Retrain model
    train_model()
    
    return jsonify({"status": "success", "message": "I have learned this new information!"})

@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        "status": "healthy",
        "knowledge_count": len(knowledge_base),
        "model_loaded": vectorizer is not None
    })

if __name__ == '__main__':
    # Ensure data directory exists
    os.makedirs(os.path.join(os.path.dirname(__file__), 'data'), exist_ok=True)
    app.run(host='0.0.0.0', port=5001)
