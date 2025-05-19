# Claude Conversation Analyzer

A powerful web application for analyzing and managing your Claude AI conversation history. This tool helps you gain insights from your conversations with Claude by providing advanced search, visualization, and summarization capabilities.

## Features

### 📊 Comprehensive Analytics
- Visual charts showing conversation trends over time
- Message count and word count statistics
- Most active conversations tracking
- Detailed conversation metrics

### 🔍 Advanced Search
- Full-text search across all conversations
- Date range filtering
- Real-time search results
- Context-aware message highlighting

### 📑 Conversation Management
- Import Claude conversation exports
- Organize and browse conversations
- View detailed message history
- Export selected conversations

### 🤖 AI-Powered Summarization
- Generate summaries of selected conversations
- Customizable summarization prompts
- Support for multiple AI providers:
  - Anthropic (Claude)
  - OpenAI (GPT-4)
  - Mistral AI
  - Grok

### 💾 Local-First
- All data stored locally in your browser
- No server requirements
- Complete privacy - your conversations never leave your device
- IndexedDB-based storage using Dexie.js

### 🎨 Modern UI
- Clean, intuitive interface
- Responsive design
- Dark mode support
- Beautiful data visualizations

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
4. Export your conversations from Claude
5. Upload the JSON export file to the analyzer

## Technical Stack

- **Frontend**: React 18 with TypeScript
- **State Management**: React Hooks
- **Database**: Dexie.js (IndexedDB wrapper)
- **Styling**: Tailwind CSS
- **Charts**: Chart.js with react-chartjs-2
- **Icons**: Lucide React
- **Build Tool**: Vite

## Privacy

This application is completely client-side and processes all data locally in your browser. No data is ever sent to any external servers unless you explicitly configure and use the AI summarization feature with your own API keys.

## License

MIT License - See LICENSE file for details