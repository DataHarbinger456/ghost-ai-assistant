# 🤖 Ghost AI Assistant

<div align="center">

**Personal AI Assistant for Limitless Pendant Recordings**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9+-blue.svg)](https://www.typescriptlang.org/)

*Transform your Limitless recordings into a searchable, intelligent knowledge base*

</div>

---

## ✨ **What It Does**

**Ghost AI Assistant** turns your Limitless Pendant recordings into a powerful personal knowledge base that integrates with your Obsidian vaults.

🎙️ **Import & Organize** - Automatically import recordings with smart tagging
🧠 **AI-Powered Search** - Natural language search across all your knowledge
🗂️ **Multi-Vault Integration** - Connect multiple Obsidian vaults
👥 **Contact Intelligence** - Build relationship profiles from your conversations
📊 **Knowledge Graph** - Automatic topic extraction and cross-referencing
🎯 **Action Items** - Extract actionable insights from your recordings

---

## 🚀 **Quick Start**

### Prerequisites
- **Node.js 18+**
- **Limitless Pendant** with API key
- **Obsidian** (optional but recommended)

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/ghost-ai-assistant.git
cd ghost-ai-assistant

# Install dependencies
npm install

# Build the project
npm run build
```

### Configuration

1. **Get your Limitless API key** from [limitless.ai/developers](https://www.limitless.ai/developers)

2. **Configure environment**:
```bash
cp .env.example .env
# Edit .env and add your API key
```

3. **Configure your Obsidian vaults** (optional):
```bash
cp .env.vaults.example .env.vaults
# Edit .env.vaults and add your vault paths
```

### First Run

```bash
# Test your API connection
npm run dev -- recent --days 1

# Create your Ghost vault
npm run dev -- obsidian setup

# Import your first recordings
npm run dev -- obsidian import recent --days 7
```

---

## 📋 **Features**

### 🔍 **Universal Search**
- Search across Limitless recordings + multiple Obsidian vaults
- Natural language queries with content search
- Tag-based filtering and vault-specific searches
- Cross-reference topics and connections

### 🗂️ **Multi-Vault Integration**
- Connect unlimited Obsidian vaults
- Automatic topic extraction and linking
- Cross-vault knowledge graph
- Unified dashboard for all your knowledge

### 👥 **Contact Intelligence**
- Automatic contact profile creation
- Relationship mapping and network analysis
- Business opportunity identification
- Conversation history tracking

### 📊 **Knowledge Management**
- Daily note generation with recording summaries
- Topic clustering and trend analysis
- Action item extraction
- Project and opportunity tracking

---

## 🎛️ **Command Reference**

### Limitless Recording Commands
```bash
# Recent recordings
npm run dev -- recent --days 7 --full

# Search recordings
npm run dev -- search "business ideas" --days 30

# Get specific recording
npm run dev -- get <recording-id> --save

# Export recordings
npm run dev -- export "topic" --single topic-notes.md
```

### Obsidian Integration Commands
```bash
# Import to Obsidian
npm run dev -- obsidian import recent --days 7
npm run dev -- obsidian import "search term" --max 20

# Move existing transcripts
npm run dev -- obsidian move

# Open Ghost vault
npm run dev -- obsidian open

# Setup new vault
npm run dev -- obsidian setup
```

### Multi-Vault Commands
```bash
# List all vaults
npm run dev -- vaults list

# Search across all vaults
npm run dev -- vaults search "query" --content --limit 10

# Search specific vaults
npm run dev -- vaults search "history" --vaults "History Research,Business"

# Generate cross-vault index
npm run dev -- vaults index

# Configure vaults
npm run dev -- vaults config
```

---

## 📁 **Project Structure**

```
ghost-ai-assistant/
├── 🤖 Ghost AI Vault/          # Generated Obsidian vault
│   ├── 🎙️ Recordings/         # Imported Limitless recordings
│   ├── 👥 Contacts/           # Contact profiles
│   ├── 💡 Insights/            # Extracted insights
│   ├── 📋 Projects/           # Business ideas & projects
│   └── 🎯 Daily/              # Daily notes with summaries
├── 🔧 src/                    # Source code
│   ├── api/                   # Limitless API client
│   ├── cli/                   # Command-line interface
│   ├── obsidian/              # Obsidian integration
│   └── types/                 # TypeScript definitions
├── 📋 transcripts/            # Local transcript storage
├── 📚 docs/                   # Documentation
│   ├── SETUP_GUIDE.md         # Complete setup instructions
│   └── GHOST_COMMANDS.md      # Command reference
├── .env.example               # API key template
├── .env.vaults                # Vault configuration template
└── README.md                  # This file
```

---

## 🎯 **Use Cases**

### 👤 **Personal Knowledge Management**
- Never forget ideas from conversations
- Search across all your knowledge sources
- Build a personal knowledge graph
- Extract action items from discussions

### 💼 **Business Development**
- Track business opportunities from conversations
- Maintain contact intelligence and relationships
- Search across business knowledge and recordings
- Extract actionable business insights

### 🎓 **Research & Learning**
- Connect research from multiple sources
- Search across academic and practical knowledge
- Build comprehensive topic knowledge bases
- Track learning progress and insights

### 🎨 **Content Creation**
- Extract content ideas from conversations
- Research topics across multiple knowledge sources
- Build content libraries and templates
- Track inspiration and creative insights

---

## 🔧 **Advanced Configuration**

### Custom Vault Configuration
Edit `.env.vaults` to connect your vaults:

```bash
# Example vaults
VAULT_1_NAME="Business Vault"
VAULT_1_PATH="/Users/yourname/Documents/Obsidian/Business"
VAULT_1_ENABLED=true

VAULT_2_NAME="Personal Vault"
VAULT_2_PATH="/Users/yourname/Documents/Obsidian/Personal"
VAULT_2_ENABLED=true
```

### Environment Variables
```bash
# Required
LIMITLESS_API_KEY=your_api_key_here

# Optional
DEFAULT_TIMEZONE=America/New_York
```

---

## 🤝 **Contributing**

Contributions are welcome! Please feel free to submit a Pull Request.

### Development Setup
```bash
# Clone your fork
git clone https://github.com/yourusername/ghost-ai-assistant.git
cd ghost-ai-assistant

# Install dependencies
npm install

# Run in development mode
npm run dev -- help

# Build for production
npm run build

# Run tests
npm test
```

### Project Structure
- `src/api/` - Limitless API integration
- `src/cli/` - Command-line interface
- `src/obsidian/` - Obsidian vault management
- `src/types/` - TypeScript type definitions

---

## 📄 **License**

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 **Acknowledgments**

- **Limitless AI** - For the amazing Limitless Pendant and API
- **Obsidian** - For the incredible knowledge management platform
- **OpenAI** - For AI capabilities that power insights

---

## 📞 **Support**

- 📖 **Setup Guide**: See [SETUP_GUIDE.md](SETUP_GUIDE.md) for detailed instructions
- 📋 **Commands**: See [GHOST_COMMANDS.md](GHOST_COMMANDS.md) for complete reference
- 🐛 **Issues**: Report bugs on GitHub Issues
- 💬 **Discussions**: Join our GitHub Discussions for questions

---

<div align="center">

**👻 Transform your recordings into intelligence**

Made with ❤️ by the Ghost AI community

</div>