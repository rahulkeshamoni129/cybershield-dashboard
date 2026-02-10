import os
import json
import numpy as np
from flask import Flask, request, jsonify
from flask_cors import CORS
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from dotenv import load_dotenv

# Load environment variables from parent directory (server/.env)
dotenv_path = os.path.join(os.path.dirname(__file__), '..', 'server', '.env')
load_dotenv(dotenv_path)

app = Flask(__name__)
CORS(app)

KNOWLEDGE_FILE = os.path.join(os.path.dirname(__file__), 'data', 'knowledge.json')
GROQ_API_KEY = os.getenv('GROQ_API_KEY')
GROQ_MODEL = os.getenv('GROQ_MODEL', 'llama3-70b-8192')

# Diagnostic print for startup
if GROQ_API_KEY and not GROQ_API_KEY.startswith('gsk_YOUR'):
    print(f"Groq Engine initialized with model: {GROQ_MODEL}")
    print(f"API Key detected (prefix): {GROQ_API_KEY[:10]}...")
else:
    print("GROQ_API_KEY not found or invalid. AI will run in fallback (local-only) mode.")

# Global variables for the local model (RAG retrieval)
vectorizer = None
tfidf_matrix = None
knowledge_base = []

def load_knowledge_base():
    global knowledge_base
    try:
        if os.path.exists(KNOWLEDGE_FILE):
            with open(KNOWLEDGE_FILE, 'r') as f:
                knowledge_base = json.load(f)
            print(f"Loaded {len(knowledge_base)} entries from knowledge base.")
        else:
            print("Knowledge base file not found. Starting empty.")
            knowledge_base = []
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
    print("Local Retrieval Model retrained successfully.")

# Initial load and train
load_knowledge_base()
train_model()

@app.route('/chat', methods=['POST'])
def chat():
    global vectorizer, tfidf_matrix, knowledge_base
    
    data = request.json
    user_message = data.get('message', '')
    
    if not user_message:
        return jsonify({"reply": "Please say something!", "severity": "Info"})

    # Context Retrieval (RAG)
    best_match = None
    best_score = 0
    context = ""

    if vectorizer and knowledge_base:
        try:
            query_vec = vectorizer.transform([user_message.lower()])
            similarities = cosine_similarity(query_vec, tfidf_matrix).flatten()
            best_match_idx = np.argmax(similarities)
            best_score = similarities[best_match_idx]
            
            if best_score > 0.1:
                match = knowledge_base[best_match_idx]
                best_match = match
                context = f"Relevant Knowledge Base Entry:\nQuestion: {match['question']}\nAnswer: {match['answer']}\nMITRE ID: {match.get('mitre_id', 'N/A')}"
        except Exception as e:
            print(f"Retrieval error: {e}")

    # Decision: Use Groq or Local Fallback
    if GROQ_API_KEY and not GROQ_API_KEY.startswith('gsk_YOUR'):
        try:
            # System Prompt with Strict Scoping
            system_instruction = """You are CyberShield AI, a specialized Tier 3 SOC Analyst for the CyberShieldplatform.
            
Your ONLY purpose is to assist with cybersecurity operations, threat analysis, and CyberShield platform-related queries.

STRICT SCOPE LIMITATIONS:
1. You must ONLY answer questions related to:
   - Cybersecurity threats (Malware, Phishing, DDoS, CVEs, etc.)
   - Network security, firewalls, protocols, and digital forensics.
   - The CyberShield dashboard features, alerts, and analytics tools.
   - Incident response, mitigation strategies, and security best practices.
   - Analyzing security logs, IP addresses, or code for vulnerabilities.

2. FORBIDDEN TOPICS:
   - General conversation, history, politics, or entertainment.
   - Cooking, recipes, or life advice.
   - General programming not related to security (e.g., "how to build a website").
   - Math, physics, or general science.

3. REFUSAL POLICY:
   - If a question is outside these topics, you MUST say: "I am specialized exclusively in cybersecurity and the CyberShield platform. I cannot assist with non-security related queries."
   - Do not attempt to be helpful on other topics.

4. Context Usage:
   - Use the provided 'Context' from the knowledge base to answer specifically about this project.
"""
            
            import requests # Local import to ensure it's available
            
            response = requests.post(
                url="https://api.groq.com/openai/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {GROQ_API_KEY}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": GROQ_MODEL,
                    "messages": [
                        {"role": "system", "content": system_instruction},
                        {"role": "user", "content": f"Context: {context}\n\nUser Question: {user_message}"}
                    ],
                    "temperature": 0.5
                },
                timeout=20
            )
            
            if response.status_code == 200:
                result = response.json()
                reply_text = result['choices'][0]['message']['content']
                
                # Extract metadata from best match if relevant
                mitre_id = best_match.get('mitre_id') if best_match else None
                mitre_name = best_match.get('mitre_name') if best_match else None
                severity = best_match.get('severity', 'Info') if best_match else 'Info'

                return jsonify({
                    "reply": reply_text,
                    "mitre_id": mitre_id,
                    "mitre_name": mitre_name,
                    "severity": severity,
                    "confidence": 1.0,
                    "source": f"Groq AI ({GROQ_MODEL}) + RAG"
                })
            else:
                print(f"Groq Error: {response.text}")
                # Fall through to local fallback

        except Exception as ai_err:
            print(f"OpenRouter request failed: {ai_err}")
            # Fall through to local fallback below

    # Fallback Mode (Local Only)
    if best_match and best_score > 0.1:
        return jsonify({
            "reply": best_match['answer'],
            "mitre_id": best_match.get('mitre_id'),
            "mitre_name": best_match.get('mitre_name'),
            "severity": best_match.get('severity', 'Info'),
            "confidence": float(best_score),
            "source": "Local Knowledge Base"
        })
    else:
        return jsonify({
            "reply": "I don't have enough information on that topic locally, and my AI brain is currently offline. Please try asking about common threats like DDoS, Phishing, or Malware.",
            "severity": "Unknown",
            "mitre_id": None
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
        
    # Retrain retrieval model
    train_model()
    
    return jsonify({"status": "success", "message": "I have learned this new information locally!"})

@app.route('/test-ai', methods=['GET'])
def test_ai():
    """
    Minimal test endpoint to confirm Groq connectivity.
    """
    if not GROQ_API_KEY or GROQ_API_KEY.startswith('gsk_YOUR'):
        return jsonify({
            "status": "Error",
            "message": "GROQ_API_KEY is missing or contains placeholder value."
        }), 400

    try:
        import requests
        print("DIAGNOSTIC: Sending test prompt to Groq...")
        
        response = requests.post(
            url="https://api.groq.com/openai/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {GROQ_API_KEY}",
                "Content-Type": "application/json"
            },
            json={
                "model": GROQ_MODEL,
                "messages": [
                    {"role": "user", "content": "Say OK if you are working"}
                ],
                "max_tokens": 10
            },
            timeout=15
        )

        if response.status_code == 200:
            result = response.json()
            reply = result['choices'][0]['message']['content']
            print(f"DIAGNOSTIC SUCCESS: Groq responded: {reply}")
            return jsonify({
                "status": "AI working",
                "model": GROQ_MODEL,
                "api_response": reply
            })
        else:
            print(f"DIAGNOSTIC FAILURE: {response.text}")
            return jsonify({
                "status": "Error",
                "code": response.status_code,
                "message": response.text
            }), response.status_code

    except Exception as e:
        print(f"DIAGNOSTIC EXCEPTION: {str(e)}")
        return jsonify({
            "status": "Error",
            "message": str(e)
        }), 500

@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        "status": "healthy",
        "knowledge_count": len(knowledge_base),
        "retrieval_model_loaded": vectorizer is not None,
        "generative_ai_active": GROQ_API_KEY is not None and not GROQ_API_KEY.startswith('gsk_YOUR')
    })

if __name__ == '__main__':
    # Ensure data directory exists
    os.makedirs(os.path.join(os.path.dirname(__file__), 'data'), exist_ok=True)
    app.run(host='0.0.0.0', port=5001)

