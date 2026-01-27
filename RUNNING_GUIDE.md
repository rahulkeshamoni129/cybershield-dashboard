# How to Run the Project

You can run the project in two ways:
1. **Using Docker (Recommended)** - Simplest, includes database and persistence.
2. **Manually** - For development or if Docker is not available.

---

## Option 1: Using Docker (Recommended)
This approach automatically sets up the Client, Server, AI Engine, MongoDB, and Redis.

### Steps:
1. Open a terminal in the project root directory.
2. Run the following command to build and start everything:
   ```powershell
   docker-compose up --build
   ```
3. Wait for the containers to build and start.
   - You might see logs from all services.
   - Wait until you see "Server running on port 5000" and "ready in ..." from the client.

4. Access the Application:
   - **Main Dashboard**: [http://localhost](http://localhost) (runs on port 80)
   - *Note: Since Docker runs on port 80, you don't need :8080.*

5. To stop the project, press `Ctrl+C` in the terminal, or run:
   ```powershell
   docker-compose down
   ```

---

## Option 2: Manual Setup
This serves as a fallback if you cannot use Docker. You will need 3 terminal windows.

### Prerequisites
Ensure you have the following installed:
- **Node.js**: [Download Here](https://nodejs.org/)
- **Python** (3.8+): [Download Here](https://www.python.org/)
- **MongoDB** (Optional, for data persistence): [Download Here](https://www.mongodb.com/try/download/community)
- **Redis** (Optional, for caching): [Download Here](https://redis.io/download)

### Step 1: Start the AI Engine (Python)
(Terminal 1)
1. Navigate to `ai-engine`: `cd ai-engine`
2. Install deps: `pip install -r requirements.txt`
3. Start: `python app.py`

### Step 2: Start the Backend Server (Node.js)
(Terminal 2)
1. Navigate to `server`: `cd server`
2. Install deps: `npm install`
3. Start: `npm run dev`

### Step 3: Start the Frontend Client (React)
(Terminal 3)
1. Navigate to `client`: `cd client`
2. Install deps: `npm install`
3. Start: `npm run dev`

### Access
Open [http://localhost:8080](http://localhost:8080)

