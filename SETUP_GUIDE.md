# 🚀 Ghost AI Assistant - Complete Setup Guide

*Personal AI assistant for Limitless Pendant recordings with multi-vault Obsidian integration*

## 📋 **Prerequisites**

### Required Software
- **Node.js** (v18 or higher)
- **Obsidian** (for vault management)
- **Limitless Pendant** (for recordings)
- **Code Editor** (VS Code recommended)

### Required Accounts
- **Limitless AI API Key** (get from [limitless.ai/developers](https://www.limitless.ai/developers))
- **Existing Obsidian Vaults** (the ones you want to connect)

---

## 🛠️ **Step 1: Project Setup**

### 1.1 Clone/Download Ghost Project
```bash
# Option A: Clone from repository (if available)
git clone <repository-url> ghost-ai-assistant
cd ghost-ai-assistant

# Option B: Download and extract project files
# Then navigate to project directory
```

### 1.2 Install Dependencies
```bash
npm install
```

### 1.3 Build the Project
```bash
npm run build
```

---

## 🔑 **Step 2: Configure API Key**

### 2.1 Create Environment File
```bash
cp .env.example .env
```

### 2.2 Add Your Limitless API Key
Edit `.env` file:
```bash
# Limitless API Configuration
LIMITLESS_API_KEY=your_actual_api_key_here
DEFAULT_TIMEZONE=America/New_York
```

**Get your API key from**: https://www.limitless.ai/developers

---

## 🗂️ **Step 3: Configure Multi-Vault Integration**

### 3.1 Create Vault Configuration
```bash
cp .env.vaults.example .env.vaults
```

### 3.2 Add Your Obsidian Vaults
Edit `.env.vaults` file with your vault paths:

```bash
# External Obsidian Vaults Configuration
# Replace with your actual vault paths

# Example vaults - modify with your paths:
VAULT_1_NAME="Business Vault"
VAULT_1_PATH="/Users/yourname/Documents/Obsidian/Business"
VAULT_1_ENABLED=true

VAULT_2_NAME="Personal Vault"
VAULT_2_PATH="/Users/yourname/Documents/Obsidian/Personal"
VAULT_2_ENABLED=true

VAULT_3_NAME="History Research"
VAULT_3_PATH="/Users/yourname/Documents/History-Research"
VAULT_3_ENABLED=true

# Add more vaults as needed...
```

### 3.3 Find Your Vault Paths
**On Mac:**
- iCloud Drive: `~/Library/Mobile Documents/com~apple~CloudDocs/Documents/YourVaultName`
- Local Documents: `~/Documents/YourVaultName`
- Custom: Anywhere you store your Obsidian vaults

**On Windows:**
- OneDrive: `%USERPROFILE%\OneDrive\Documents\YourVaultName`
- Documents: `%USERPROFILE%\Documents\YourVaultName`

---

## 🧪 **Step 4: Test Your Setup**

### 4.1 Test Limitless API Connection
```bash
npm run dev -- recent --days 1
```
*Should show your recent Limitless recordings*

### 4.2 Test Multi-Vault Connection
```bash
npm run dev -- vaults list
```
*Should show all your connected vaults*

### 4.3 Test Cross-Vault Search
```bash
npm run dev -- vaults search "test" --content
```
*Should search across all vaults*

---

## 🎯 **Step 5: Initialize Ghost Vault**

### 5.1 Create Ghost Obsidian Vault
```bash
npm run dev -- obsidian setup
```

### 5.2 Open Ghost Vault in Obsidian
1. Open Obsidian
2. Click "Open folder as vault"
3. Navigate to your project directory
4. Select the `Ghost AI Vault` folder

### 5.3 Configure Obsidian Plugins
In your Ghost vault:
1. Go to Settings → Community Plugins
2. Turn on Community plugins
3. Install and enable:
   - **Dataview** (for queries and dashboards)
   - **Local REST API** (for future integrations)

---

## 📥 **Step 6: Import Your First Recordings**

### 6.1 Import Recent Recordings
```bash
npm run dev -- obsidian import recent --days 7
```

### 6.2 Import Specific Topics
```bash
npm run dev -- obsidian import "business ideas" --max 10
```

### 6.3 Move Existing Transcripts
```bash
npm run dev -- obsidian move
```

---

## 🔍 **Step 7: Generate Cross-Vault Intelligence**

### 7.1 Create Knowledge Index
```bash
npm run dev -- vaults index
```

### 7.2 Test Universal Search
```bash
# Search across all vaults + recordings
npm run dev -- vaults search "project" --content

# Search specific vaults
npm run dev -- vaults search "history" --vaults "History Research"

# Search by tags
npm run dev -- vaults search "business" --tags "important"
```

---

## 📋 **Step 8: Daily Workflow Setup**

### 8.1 Create Daily Script (Optional)
Create `daily-ghost.sh`:
```bash
#!/bin/bash
cd /path/to/your/ghost-project

# Import today's recordings
npm run dev -- obsidian import recent --days 1

# Update knowledge index
npm run dev -- vaults index

# Open in Obsidian
npm run dev -- obsidian open
```

### 8.2 Make Script Executable
```bash
chmod +x daily-ghost.sh
```

---

## 🎛️ **Essential Commands Cheat Sheet**

### Limitless Recording Commands
```bash
# Recent recordings
npm run dev -- recent --days 7

# Search recordings
npm run dev -- search "business ideas"

# Get specific recording
npm run dev -- get <recording-id> --save

# Export recordings
npm run dev -- export "topic" --single topic-notes.md
```

### Obsidian Integration Commands
```bash
# Import to Obsidian
npm run dev -- obsidian import recent
npm run dev -- obsidian import "search term"

# Move existing transcripts
npm run dev -- obsidian move

# Open Ghost vault
npm run dev -- obsidian open
```

### Multi-Vault Commands
```bash
# List all vaults
npm run dev -- vaults list

# Search across all vaults
npm run dev -- vaults search "query" --content

# Generate cross-vault index
npm run dev -- vaults index

# Configure new vaults
npm run dev -- vaults config
```

---

## 🔧 **Troubleshooting**

### Common Issues

#### "API Key Not Found"
- Check your `.env` file has the correct API key
- Ensure `.env` file is in project root directory

#### "Vault Not Found"
- Verify vault paths in `.env.vaults` are correct
- Use full absolute paths
- Check for typos in folder names

#### "Permission Denied"
- Ensure script has execute permissions: `chmod +x daily-ghost.sh`
- Check read permissions on your vault directories

#### "Build Errors"
- Run `npm clean` then `npm install`
- Ensure Node.js version is 18+

### Getting Help
1. Check command help: `npm run dev -- --help`
2. Review logs for specific error messages
3. Verify all file paths are correct
4. Test individual components first

---

## 🚀 **Next Steps After Setup**

### 1. Explore Your Knowledge
```bash
# What topics do you have most notes about?
npm run dev -- vaults index

# Search across everything
npm run dev -- vaults search "your interest" --content
```

### 2. Customize Your Workflow
- Add more vaults to `.env.vaults`
- Create custom search queries
- Set up daily automation scripts

### 3. Share with Others
- This guide works for friends and colleagues
- They just need their own Limitless API key
- Vault paths will be different for each person

---

## 📁 **Project Structure (What Gets Created)**
```
ghost-ai-assistant/
├── Ghost AI Vault/          # Your main Obsidian vault
│   ├── 🎙️ Recordings/       # Imported Limitless recordings
│   ├── 👥 Contacts/         # Contact profiles
│   ├── 💡 Insights/          # Extracted insights
│   ├── 📋 Projects/         # Business ideas & projects
│   └── 🎯 Daily/            # Daily notes
├── src/                     # Source code
├── transcripts/             # Local transcript storage
├── .env                     # API key configuration
├── .env.vaults              # Vault configuration
└── SETUP_GUIDE.md           # This guide
```

---

## 🎯 **Success Metrics**

When setup is complete, you should have:
- ✅ **Working CLI commands** for all operations
- ✅ **Connected vaults** showing in `vaults list`
- ✅ **Search capability** across all knowledge sources
- ✅ **Imported recordings** in your Ghost vault
- ✅ **Cross-vault intelligence** connecting your knowledge

---

## 🤝 **Share This Guide**

This setup guide is ready to share with friends who want to:
- Organize their Limitless recordings
- Connect multiple Obsidian vaults
- Create a personal AI knowledge base
- Search across all their knowledge sources

**Just share this project and the SETUP_GUIDE.md file!** 🚀

---

*Happy knowledge building with Ghost AI Assistant! 🧠✨*