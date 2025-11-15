# 🍳 PantryChef CulinaryGPT Chatbot Server

Welcome to **CulinaryGPT**! 👨‍🍳✨  
A comprehensive, modular culinary AI assistant powered by a **hybrid RAG (Retrieval-Augmented Generation)** architecture. This server combines the power of Cohere AI with semantic search to deliver expert-level cooking guidance grounded in a verified culinary knowledge base.

This server is designed with a clean, service-oriented architecture, making it maintainable, scalable, and ready for production deployment on Vercel.

---

## 📚 Table of Contents

- [✨ Features](#features)
- [🏗️ Architecture (Hybrid-RAG)](#architecture-hybrid-rag)
- [📁 Project Structure](#project-structure)
- [🔌 API Endpoints](#api-endpoints)
- [⚡ Getting Started](#getting-started)
- [🚀 Deployment](#deployment)
- [🛠️ Tech Stack](#tech-stack)
- [📊 Monitoring & Analytics](#monitoring--analytics)
- [🤓 Usage Examples](#usage-examples)
- [👨‍🍳 Knowledge Base](#knowledge-base)
- [🚀 Performance](#performance)
- [👥 Contributing](#contributing)
- [🙏 Acknowledgements](#acknowledgements)

---

## ✨ Features

- 🤖 **Hybrid-RAG AI:** Intelligently combines specific recipe context (e.g., your chicken recipe) with a general knowledge base (e.g., how to sear) for highly relevant, contextual answers
- 🧱 **Modular Architecture:** Fully refactored into services, routes, utils, and config for clean, maintainable code
- ⚡ **Persistent Embeddings:** Computes document embeddings once and saves them to `embeddings/embeddings.json` file, allowing for lightning-fast server reboots
- 🔄 **Graceful Initialization:** Automatically creates the embeddings/ folder and file if missing, ensuring the server can build itself from scratch
- 🔍 **Semantic Search:** Vector embeddings with cosine similarity for intelligent document retrieval
- 📚 **Comprehensive Knowledge Base:** 7 specialized categories of culinary expertise
- 🌍 **Multilingual Support:** Powered by Cohere's `embed-multilingual-v3.0` model
- ☁️ **Vercel-Optimized:** Built from the ground up to deploy seamlessly to Vercel's serverless environment
- 🏥 **Lightweight Monitoring:** Simple `/health` and `/stats` endpoints for reliable, essential monitoring

---

## 🏗️ Architecture (Hybrid-RAG)

This API now uses a powerful **Hybrid-RAG** model for enhanced contextual responses:

### **1. Indexing Phase (Startup):**

- On first run, `documentService.js` loads all JSON files from `/documents`
- Generates vector embeddings using Cohere's `embed-multilingual-v3.0`
- Saves embeddings to `embeddings/embeddings.json` for persistent caching
- On subsequent runs, reads cached file in seconds, skipping compute step

### **2. Querying Phase (Two Paths):**

**Path A: Standard RAG (General Questions)**

```json
Input: { "prompt": "How do I chop an onion?" }
```

- Embeds the prompt and finds 5 most relevant documents from general knowledge base
- Passes relevant context to Cohere for grounded response

**Path B: Hybrid-RAG (Recipe-Specific Questions)**

```json
Input: {
  "prompt": "How long do I marinate the chicken?",
  "recipeContext": "Step 1: Marinate chicken in buttermilk..."
}
```

- **Recipe Context:** Adds `recipeContext` as the most important document
- **RAG Retrieval:** Embeds prompt and finds 5 most relevant documents from knowledge base
- **Combined Generation:** Sends both specific recipe and general tips to Cohere for perfectly contextualized answers

---

## 📁 Project Structure

This project uses a clean, modular structure:

```
PROG7314-Cohere-Chatbot-Server/
├── server.js               # Main server orchestrator
├── vercel.json             # Vercel deployment configuration
├── package.json            # Dependencies and scripts
├── .env                    # Local environment variables
├── .gitignore              # .env, node_modules/, embeddings/
│
├── config/
│   └── cohereClient.js     # Initializes and exports Cohere client
│
├── utils/
│   ├── monitoring.js       # Lightweight monitoring helpers (memory, uptime)
│   └── vector.js           # Vector math (cosineSimilarity, getTopKDocuments)
│
├── services/
│   └── documentService.js  # Document loading, embedding, caching, and retrieval
│
├── routes/
│   ├── chatRoutes.js       # POST /prompt endpoint with Hybrid-RAG logic
│   └── monitoringRoutes.js # GET /health and GET /stats endpoints
│
├── documents/              # General knowledge base (7 categories)
│   ├── recipes.json
│   ├── techniques_Tips.json
│   ├── nutrition_Advice.json
│   ├── ingredient_Substitutions.json
│   ├── food_Safety.json
│   ├── equipment_Usage.json
│   └── cooking_Advice.json
│
└── embeddings/             # (Auto-generated, .gitignored)
    └── embeddings.json     # Stored embeddings for fast startup
```

---

## 🔌 API Endpoints

### 🎯 Main Chat Interface

This is the primary endpoint for all chat functionality supporting both standard and hybrid RAG.

```http
POST /prompt
Content-Type: application/json
```

**Hybrid-RAG (with recipe context):**

```json
{
  "prompt": "What can I use instead of buttermilk for this?",
  "recipeContext": "Step 1: Marinate chicken in 1 cup of buttermilk for 2 hours..."
}
```

**Standard-RAG (general question):**

```json
{
  "prompt": "What can I use instead of buttermilk?"
}
```

**Response Structure:**

```json
{
  "text": "For this recipe, you can make a substitute by mixing 1 cup of milk with 1 tablespoon of lemon juice or white vinegar...",
  "citations": [
    {
      "start": 15,
      "end": 42,
      "document_id": "substitutions_1"
    }
  ],
  "documentsUsed": 6,
  "categoriesReferenced": ["substitutions", "techniques", "cooking_advice"]
}
```

### 🏥 Health Check

A lightweight endpoint to confirm server status and knowledge base readiness.

```http
GET /health
```

**Response Structure:**

```json
{
  "status": "healthy",
  "timestamp": "2025-11-15T18:10:00.123Z",
  "uptime": "15m 32s",
  "memoryUsage": "85 MB / 120 MB",
  "knowledgeBase": {
    "documentsLoaded": 1247,
    "status": "Ready",
    "embeddingsReady": true,
    "categoriesCount": 7
  },
  "system": {
    "nodeVersion": "v18.17.0",
    "environment": "production"
  }
}
```

### 📊 Knowledge Base Stats

Simple endpoint for knowledge base statistics and analytics.

```http
GET /stats
```

**Response Structure:**

```json
{
  "knowledgeBase": {
    "totalDocuments": 1247,
    "totalCategories": 7,
    "embeddingsComputedAt": "2025-11-15T17:54:28.000Z",
    "model": "embed-multilingual-v3.0",
    "inputType": "search_document",
    "categories": {
      "recipes": { "count": 312, "percentage": 25 },
      "techniques": { "count": 185, "percentage": 15 },
      "nutrition": { "count": 176, "percentage": 14 }
    }
  },
  "performance": {
    "memoryUsage": {
      "rss": 142,
      "heapUsed": 89,
      "heapTotal": 123
    },
    "averageDocumentsPerQuery": 5
  }
}
```

---

## ⚡ Getting Started

### 🧰 Prerequisites

- Node.js (v18 or newer)
- npm or yarn package manager
- Cohere API key ([Get one here](https://cohere.ai))

### 🏗️ Local Development

1. **Clone the repository:**

   ```bash
   git clone https://github.com/SashveerRamjathan/PROG7314-Cohere-Chatbot-Server.git
   cd PROG7314-Cohere-Chatbot-Server
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Set up environment variables:**

   ```bash
   # Create .env file
   echo "COHERE_API_KEY=your_cohere_api_key_here" > .env
   ```

4. **Verify knowledge base files exist:**

   ```bash
   # Ensure documents directory contains:
   # documents/recipes.json
   # documents/techniques_Tips.json
   # documents/nutrition_Advice.json
   # documents/ingredient_Substitutions.json
   # documents/food_Safety.json
   # documents/equipment_Usage.json
   # documents/cooking_Advice.json
   ```

5. **Start the development server:**

   ```bash
   npm run dev
   ```

   **Note:** On the very first run, the console will show `[DocumentService] Computing embeddings for the first time...`. This may take 1-2 minutes. On all future runs, the server will load cached embeddings and start in seconds.

6. **Verify it's running:**
   ```bash
   curl http://localhost:5000/health
   ```

---

## 🚀 Deployment

### ☁️ Vercel Deployment (Recommended)

**CulinaryGPT is optimized for Vercel serverless deployment:**

1. **Prepare for deployment:**

   ```bash
   # Ensure embeddings/ is in .gitignore
   echo "embeddings/" >> .gitignore
   echo "node_modules/" >> .gitignore
   echo ".env" >> .gitignore

   # Commit your changes
   git add .
   git commit -m "Ready for Vercel deployment"
   git push origin main
   ```

2. **Deploy to Vercel:**

   - Go to [vercel.com](https://vercel.com) and create a "New Project"
   - Import your GitHub repository
   - Vercel will automatically detect `vercel.json` - **No build commands needed!**
   - Set environment variables in Vercel dashboard:
     ```
     COHERE_API_KEY = your_cohere_api_key_here
     NODE_ENV = production
     ```

3. **First deployment note:**

   - On the first run, the API will have a "cold start" where it computes and saves embeddings
   - This may cause the first `/health` check to show 0 documents
   - After ~1-2 minutes, embeddings will be created and the API will be fully operational

4. **Your live endpoints:**
   ```
   https://your-project.vercel.app/prompt  - Hybrid-RAG chat interface
   https://your-project.vercel.app/health - Health check with system metrics
   https://your-project.vercel.app/stats  - Knowledge base analytics
   ```

### 🐳 Alternative Deployment Options

**Docker:**

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 5000
CMD ["npm", "start"]
```

**Traditional Hosting:**

- Set `PORT` environment variable
- Ensure all document files are present
- Run `npm start`

---

## 🛠️ Tech Stack

- **Runtime:** Node.js v18+ with ES6 modules
- **Framework:** Express.js
- **AI Platform:** Cohere AI
  - **Embedding Model:** `embed-multilingual-v3.0`
  - **Chat Model:** `command-r-plus`
- **Architecture:** Service-oriented (services, routes, utils, config)
- **Vector Search:** Cosine similarity
- **Storage:** JSON files + persistent embedding cache
- **Environment:** dotenv
- **Deployment:** Vercel Serverless Functions
- **Monitoring:** Built-in lightweight analytics

---

## 📊 Monitoring & Analytics

### 🔍 **Lightweight Health Monitoring**

CulinaryGPT provides essential monitoring capabilities:

**System Health:**

- Server uptime and memory usage tracking
- Node.js version and environment information
- Knowledge base loading status and readiness

**Knowledge Base Status:**

- Document count and category breakdown
- Embeddings computation and caching status
- Real-time system performance metrics

**Performance Insights:**

- Memory usage patterns (RSS, Heap)
- Average documents used per query
- Category distribution and usage analytics

### 🎯 **Usage Tracking**

Monitor your CulinaryGPT deployment with:

- **Server Health:** Essential uptime and memory metrics
- **Knowledge Base:** Document loading and embedding status
- **Performance:** Response efficiency and resource usage

---

## 🤓 Usage Examples

### Basic Cooking Question (Standard RAG)

```javascript
const response = await fetch("https://your-project.vercel.app/prompt", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    prompt: "What's the best way to sear a steak?",
  }),
});

const result = await response.json();
console.log(result.text);
console.log(
  `Used ${
    result.documentsUsed
  } documents from categories: ${result.categoriesReferenced.join(", ")}`
);
```

### Recipe-Specific Question (Hybrid RAG)

```javascript
const response = await fetch("https://your-project.vercel.app/prompt", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    prompt: "How long should I marinate the chicken?",
    recipeContext:
      "Honey Garlic Chicken: Step 1: Marinate chicken thighs in buttermilk for 2 hours. Step 2: Mix honey, soy sauce, and garlic...",
  }),
});

const advice = await response.json();
// Response will combine the specific recipe context with general marination knowledge
```

### Ingredient Substitution Query (Hybrid RAG)

```javascript
const response = await fetch("https://your-project.vercel.app/prompt", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    prompt: "I'm out of eggs for this recipe. What can I use instead?",
    recipeContext:
      "Chocolate Chip Cookies: 2 eggs, 1 cup flour, 1/2 cup sugar, 1/2 cup butter, 1 cup chocolate chips...",
  }),
});

const advice = await response.json();
// Response will include substitution options specific to this cookie recipe
```

### Health Monitoring

```javascript
// Monitor server health and readiness
const healthCheck = async () => {
  try {
    const response = await fetch("https://your-project.vercel.app/health");
    const status = await response.json();

    console.log(`Server Status: ${status.status}`);
    console.log(`Uptime: ${status.uptime}`);
    console.log(`Documents Loaded: ${status.knowledgeBase.documentsLoaded}`);
    console.log(`Memory Usage: ${status.memoryUsage}`);
  } catch (error) {
    console.error("Health check failed:", error);
  }
};
```

### Knowledge Base Analytics

```javascript
// Get knowledge base statistics
const getStats = async () => {
  try {
    const response = await fetch("https://your-project.vercel.app/stats");
    const stats = await response.json();

    console.log("=== CulinaryGPT Analytics ===");
    console.log(`Total Documents: ${stats.knowledgeBase.totalDocuments}`);
    console.log(`Categories: ${stats.knowledgeBase.totalCategories}`);
    console.log(`Embeddings Model: ${stats.knowledgeBase.model}`);

    // Category breakdown
    Object.entries(stats.knowledgeBase.categories || {}).forEach(
      ([category, data]) => {
        console.log(`${category}: ${data.count} docs (${data.percentage}%)`);
      }
    );
  } catch (error) {
    console.error("Stats fetch failed:", error);
  }
};
```

---

## 👨‍🍳 Knowledge Base

CulinaryGPT's expertise spans **7 specialized categories**:

### 🍽️ **Recipes** (`recipes.json`)

- Traditional and modern recipes from around the world
- Step-by-step cooking instructions
- Ingredient lists and measurements
- Cooking times and temperatures

### 🎯 **Techniques & Tips** (`techniques_Tips.json`)

- Professional cooking techniques adapted for home cooks
- Kitchen tips and tricks
- Troubleshooting common cooking problems
- Skill development guidance

### 🥗 **Nutrition & Health** (`nutrition_Advice.json`)

- Nutritional information and dietary guidance
- Healthy eating tips and meal planning
- Special dietary needs (keto, vegan, gluten-free, etc.)
- Calorie and macro information

### 🔄 **Ingredient Substitutions** (`ingredient_Substitutions.json`)

- Creative alternatives for dietary restrictions
- Allergy-friendly ingredient swaps
- Emergency substitutions for missing ingredients
- Seasonal ingredient recommendations

### 🛡️ **Food Safety** (`food_Safety.json`)

- Safe storage temperatures and guidelines
- Spoilage detection and prevention
- Proper food handling techniques
- Cross-contamination prevention

### 🔪 **Equipment Usage** (`equipment_Usage.json`)

- Proper use and maintenance of cookware
- Appliance selection and recommendations
- Tool techniques and best practices
- Kitchen organization tips

### 💡 **Cooking Advice** (`cooking_Advice.json`)

- General cooking wisdom and best practices
- Flavor pairing and combination suggestions
- Meal planning strategies
- Kitchen management tips

---

## 🚀 Performance

### ⚡ **Optimization Features:**

- **Persistent Embeddings:** Documents embedded once and cached to disk
- **Graceful Initialization:** Auto-creates embedding files on clean deploys
- **Modular Architecture:** Clean service separation for optimal performance
- **Hybrid Context:** Combines specific recipe context with general knowledge
- **Memory Caching:** All embeddings stored in memory for instant retrieval
- **Smart Rate Limiting:** Optimized for serverless environments

### 📊 **Performance Metrics:**

**Local Development:**

- **Cold Start (First Run):** ~1-2 minutes (computing embeddings)
- **Warm Start (Subsequent):** ~5-10 seconds (cached embeddings)
- **Query Response:** ~1-3 seconds (varies by complexity)
- **Memory Usage:** ~50-200MB (tracked in real-time)

**Vercel Deployment:**

- **Cold Start:** ~10-30 seconds (serverless initialization)
- **Warm Queries:** ~1-2 seconds (cached function)
- **Memory Usage:** ~50-200MB (scales with knowledge base)
- **Embedding Generation:** ~1-2 minutes (first deployment only)

**Hybrid-RAG Performance:**

- **Standard RAG:** Uses 5 retrieved documents
- **Hybrid RAG:** Recipe context + 5 retrieved documents
- **Response Quality:** Enhanced contextual accuracy
- **Memory Efficiency:** Optimized vector operations

---

## 👥 Contributing

We welcome contributions from fellow developers and culinary enthusiasts! 🤝

### 🔧 **Development Setup:**

```bash
# Fork and clone the repository
git clone https://github.com/yourusername/PROG7314-Cohere-Chatbot-Server.git
cd PROG7314-Cohere-Chatbot-Server

# Install dependencies
npm install

# Set up your environment
echo "COHERE_API_KEY=your_api_key_here" > .env

# Run the development server
npm run dev
```

### 📝 **Adding Knowledge:**

1. Add new entries to appropriate JSON files in `/documents/`
2. Delete `/embeddings/embeddings.json` to force re-computation
3. Restart server to generate new embeddings
4. Test your additions with relevant queries
5. Monitor impact using `/health` and `/stats` endpoints

### 🧪 **Testing:**

```bash
# Test health endpoint
curl http://localhost:5000/health

# Test stats endpoint
curl http://localhost:5000/stats

# Test standard RAG
curl -X POST http://localhost:5000/prompt \
  -H "Content-Type: application/json" \
  -d '{"prompt": "How do I boil water?"}'

# Test hybrid RAG
curl -X POST http://localhost:5000/prompt \
  -H "Content-Type: application/json" \
  -d '{"prompt": "How long should I cook this?", "recipeContext": "Pasta recipe: Boil water, add pasta, cook for 8-10 minutes"}'
```

### 🚀 **Deployment Testing:**

```bash
# Test Vercel deployment health
curl https://your-project.vercel.app/health

# Test analytics endpoint
curl https://your-project.vercel.app/stats

# Test hybrid functionality
curl -X POST https://your-project.vercel.app/prompt \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Is this safe to eat?", "recipeContext": "Chicken left out for 3 hours"}'
```

### 📊 **Monitoring Your Contributions:**

Use the analytics endpoints to:

- Track impact of new knowledge additions
- Monitor query patterns and popular categories
- Analyze performance improvements
- Validate system health after changes

---

## 🙏 Acknowledgements

- 🤖 **Cohere AI** for providing powerful embedding and chat models
- ☁️ **Vercel** for seamless serverless deployment platform
- 📚 **Culinary experts** whose knowledge forms our comprehensive database
- 🔬 **RAG Architecture** pioneers for the retrieval-augmented generation concept
- 👨‍🍳 **Home cooks everywhere** who inspire us to make cooking accessible
- 🌟 **Open source community** for the incredible tools and libraries
- 🎯 **Hybrid-RAG Innovation** for advancing contextual AI responses

---

**Happy Cooking with AI! 🍳🤖**

_"Where artificial intelligence meets culinary excellence!"_ ✨

---

### 🔧 **Technical Notes:**

**Hybrid-RAG Architecture:**

- Combines specific recipe context with general knowledge retrieval
- Uses cosine similarity for document ranking
- Embedding dimension: 1024 (Cohere's embed-multilingual-v3.0)
- Temperature setting: 0.3 for consistent, factual responses

**Modular Design:**

- Service-oriented architecture with clear separation of concerns
- `documentService.js` handles all embedding and retrieval logic
- `chatRoutes.js` manages hybrid RAG query processing
- `monitoringRoutes.js` provides health and analytics endpoints

**Serverless Optimizations:**

- Persistent embedding cache eliminates cold-start compute
- Graceful initialization for clean deployments
- Cross-platform file path handling
- Lightweight monitoring for essential metrics

**Performance Enhancements:**

- In-memory embedding storage for fast retrieval
- Efficient vector operations with cosine similarity
- Batch processing optimized for Cohere API limits
- Smart caching strategies for production deployment

---

**🚀 Ready to deploy to Vercel with hybrid RAG capabilities!**

Push your code and deploy - the server will automatically initialize embeddings and be ready for both standard and recipe-specific queries.

**📊 Monitor your deployment:** Use `/health` and `/stats` endpoints to track performance and system readiness.
