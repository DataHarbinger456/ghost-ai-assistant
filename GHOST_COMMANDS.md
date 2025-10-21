# Ghost AI Assistant - Command Reference

## 🚀 Quick Start
```bash
# Navigate to project
cd /Users/m1-mb-mx/dev-projects/new-ghost

# Show help
npm run dev -- --help
```

## 🔍 Search Commands

### Search by Natural Language
```bash
# Search recent recordings
npm run dev -- search "business ventures"

# Search with date range
npm run dev -- search "meeting notes" --start 2024-01-15 --end 2024-01-20

# Search within last N days
npm run dev -- search "AI notes" --days 30

# Search with full transcripts
npm run dev -- search "important discussions" --full --days 7

# Limit results
npm run dev -- search "lead generation" --max 5
```

### Get Recent Recordings
```bash
# Last 7 days (default)
npm run dev -- recent

# Last 3 days
npm run dev -- recent --days 3

# With full transcripts
npm run dev -- recent --days 1 --full

# Maximum results
npm run dev -- recent --max 20
```

### Get Specific Date
```bash
# Today's recordings
npm run dev -- date 2025-10-21

# With full content
npm run dev -- date 2025-10-21 --full

# Different timezone
npm run dev -- date 2025-10-21 --timezone America/New_York
```

### Get Specific Recording
```bash
# Get by ID
npm run dev -- get WAMCbhLH9SgN3fTBb7zM

# Get and save locally
npm run dev -- get WAMCbhLH9SgN3fTBb7zM --save
```

## 💾 Export Commands

### Export to Local Files
```bash
# Export search results (creates individual files)
npm run dev -- export "business ventures" --max 10

# Export recent recordings
npm run dev -- export recent --days 7

# Export to single consolidated file
npm run dev -- export "AI notes" --single my-ai-notes.md

# Export with date range
npm run dev -- export "meetings" --start 2024-01-01 --end 2024-01-31 --single meetings.md
```

### Manage Local Files
```bash
# List all saved transcripts
npm run dev -- list
```

## 🎛️ Options Reference

### Global Options
- `--timezone <tz>`: Set timezone (e.g., America/New_York)
- `--max <number>`: Maximum number of results
- `--full`: Show full transcript content

### Search Options
- `--days <number>`: Search within last N days
- `--start <date>`: Start date (YYYY-MM-DD or ISO-8601)
- `--end <date>`: End date (YYYY-MM-DD or ISO-8601)

### Export Options
- `--single <filename>`: Export to single file instead of multiple
- `--max <number>`: Maximum recordings to export

## 📂 File Locations

### Local Transcripts
- **Directory:** `/Users/m1-mb-mx/dev-projects/new-ghost/transcripts/`
- **Format:** Markdown files with timestamps and full content
- **Naming:** `YYYY-MM-DD_HH-MM-SS_topic-short-id.md`

### Configuration
- **API Key:** `.env` file (never commit to git)
- **Project:** `/Users/m1-mb-mx/dev-projects/new-ghost/`

## 🎯 Common Workflows

### Daily Review
```bash
npm run dev -- recent --days 1 --full
npm run dev -- export recent --days 1 --single today.md
```

### Topic Research
```bash
npm run dev -- search "topic name" --days 30
npm run dev -- export "topic name" --single topic-research.md
```

### Meeting Preparation
```bash
npm run dev -- search "client meeting" --days 14
npm run dev -- export "client meeting" --single meeting-prep.md
```

### Business Ideas
```bash
npm run dev -- search "business ventures" --full
npm run dev -- export "business ventures" --single business-ideas.md
```

## 🔧 Development Commands

```bash
# Build project
npm run build

# Development mode (no build needed)
npm run dev

# Run built version
npm start

# Clean build files
npm run clean
```

## 📞 Getting Help

```bash
# Show main help
npm run dev -- --help

# Show command-specific help
npm run dev -- search --help
npm run dev -- export --help
```

---

*Last updated: October 21, 2025*