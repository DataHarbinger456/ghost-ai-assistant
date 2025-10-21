#!/usr/bin/env node

import { Command } from 'commander';
import dotenv from 'dotenv';
import { LimitlessClient } from '../api/limitless-client';
import { TranscriptStorage } from '../api/storage';
import { ObsidianIntegration } from '../obsidian/obsidian-integration';
import { MultiVaultManager } from '../obsidian/multi-vault-manager';
import { Lifelog } from '../types/lifelogs';
import { join } from 'path';
import { writeFile } from 'fs/promises';

// Load environment variables
dotenv.config();

const program = new Command();

// ANSI color codes for better output formatting
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  gray: '\x1b[90m',
};

function colorText(text: string, color: keyof typeof colors): string {
  return `${colors[color]}${text}${colors.reset}`;
}

function formatTimestamp(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleString();
}

function formatLifelog(lifelog: Lifelog, showFullContent: boolean = false): string {
  const startTime = formatTimestamp(lifelog.startTime);
  const duration = new Date(lifelog.endTime).getTime() - new Date(lifelog.startTime).getTime();
  const durationMinutes = Math.round(duration / 60000);

  let output = [
    colorText(`📝 ${lifelog.title}`, 'bright'),
    colorText(`📅 ${startTime}`, 'blue'),
    colorText(`⏱️  ${durationMinutes} min`, 'yellow'),
    colorText(`🆔 ${lifelog.id}`, 'dim'),
  ];

  if (lifelog.isStarred) {
    output.push(colorText('⭐ Starred', 'yellow'));
  }

  if (showFullContent && lifelog.markdown) {
    output.push('', colorText('Transcript:', 'bright'), lifelog.markdown);
  }

  return output.join('\n');
}

function formatSummary(lifelogs: Lifelog[]): string {
  if (lifelogs.length === 0) {
    return colorText('No recordings found.', 'yellow');
  }

  const totalDuration = lifelogs.reduce((acc, log) => {
    return acc + (new Date(log.endTime).getTime() - new Date(log.startTime).getTime());
  }, 0);

  const totalMinutes = Math.round(totalDuration / 60000);
  const starredCount = lifelogs.filter(log => log.isStarred).length;

  return [
    colorText(`Found ${lifelogs.length} recording${lifelogs.length === 1 ? '' : 's'}`, 'green'),
    colorText(`Total duration: ${totalMinutes} minutes`, 'blue'),
    starredCount > 0 ? colorText(`${starredCount} starred`, 'yellow') : '',
  ].filter(Boolean).join(' • ');
}

function handleError(error: any): void {
  if (error.retryAfter) {
    console.error(colorText(`⚠️  Rate limit exceeded. Retry after ${error.retryAfter} seconds.`, 'red'));
  } else if (error.status === 401) {
    console.error(colorText('❌ Invalid API key. Please check your LIMITLESS_API_KEY environment variable.', 'red'));
  } else {
    console.error(colorText(`❌ Error: ${error.message}`, 'red'));
  }
  process.exit(1);
}

// Initialize Limitless client
function getClient(): LimitlessClient {
  const apiKey = process.env.LIMITLESS_API_KEY;
  if (!apiKey) {
    console.error(colorText('❌ LIMITLESS_API_KEY environment variable is required.', 'red'));
    console.error(colorText('Create a .env file with your API key or set the environment variable.', 'yellow'));
    process.exit(1);
  }
  return new LimitlessClient(apiKey);
}

program
  .name('ghost')
  .description('Ghost AI Assistant - Query your Limitless Pendant recordings')
  .version('1.0.0');

// Search command
program
  .command('search')
  .description('Search recordings by natural language query')
  .argument('<query>', 'Search query (e.g., "meeting about project timeline")')
  .option('-d, --days <number>', 'Search within last N days', '7')
  .option('-s, --start <date>', 'Start date (YYYY-MM-DD or ISO-8601)')
  .option('-e, --end <date>', 'End date (YYYY-MM-DD or ISO-8601)')
  .option('-t, --timezone <timezone>', 'Timezone (e.g., America/New_York)', process.env.DEFAULT_TIMEZONE)
  .option('-n, --max <number>', 'Maximum number of results', '20')
  .option('-f, --full', 'Show full transcript content', false)
  .action(async (query: string, options) => {
    try {
      const client = getClient();

      let dateRange;
      if (options.start || options.end) {
        dateRange = {
          start: options.start || new Date(0).toISOString(),
          end: options.end || new Date().toISOString(),
        };
      } else {
        const days = parseInt(options.days, 10);
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(endDate.getDate() - days);
        dateRange = { start: startDate.toISOString(), end: endDate.toISOString() };
      }

      console.log(colorText(`🔍 Searching for: "${query}"`, 'bright'));
      console.log(colorText(`📅 Date range: ${dateRange.start} to ${dateRange.end}`, 'dim'));
      console.log();

      const lifelogs = await client.searchByQuery(query, {
        dateRange,
        timezone: options.timezone,
        maxResults: parseInt(options.max, 10),
      });

      console.log(formatSummary(lifelogs));
      console.log();

      lifelogs.forEach((lifelog, index) => {
        if (index > 0) console.log('\n' + colorText('─'.repeat(50), 'dim'));
        console.log(formatLifelog(lifelog, options.full));
      });

    } catch (error) {
      handleError(error);
    }
  });

// Recent command
program
  .command('recent')
  .description('Get recent recordings')
  .option('-d, --days <number>', 'Number of days to look back', '7')
  .option('-t, --timezone <timezone>', 'Timezone (e.g., America/New_York)', process.env.DEFAULT_TIMEZONE)
  .option('-n, --max <number>', 'Maximum number of results', '10')
  .option('-f, --full', 'Show full transcript content', false)
  .action(async (options) => {
    try {
      const client = getClient();
      const days = parseInt(options.days, 10);

      console.log(colorText(`📋 Recent recordings (last ${days} days)`, 'bright'));
      console.log();

      const lifelogs = await client.getRecentLifelogs(days, {
        timezone: options.timezone,
        maxResults: parseInt(options.max, 10),
      });

      console.log(formatSummary(lifelogs));
      console.log();

      lifelogs.forEach((lifelog, index) => {
        if (index > 0) console.log('\n' + colorText('─'.repeat(50), 'dim'));
        console.log(formatLifelog(lifelog, options.full));
      });

    } catch (error) {
      handleError(error);
    }
  });

// Date command
program
  .command('date')
  .description('Get recordings for a specific date')
  .argument('<date>', 'Date (YYYY-MM-DD format)')
  .option('-t, --timezone <timezone>', 'Timezone (e.g., America/New_York)', process.env.DEFAULT_TIMEZONE)
  .option('-n, --max <number>', 'Maximum number of results', '20')
  .option('-f, --full', 'Show full transcript content', false)
  .action(async (date: string, options) => {
    try {
      const client = getClient();

      console.log(colorText(`📅 Recordings for ${date}`, 'bright'));
      console.log();

      const lifelogs = await client.getLifelogsByDate(date, {
        timezone: options.timezone,
        maxResults: parseInt(options.max, 10),
      });

      console.log(formatSummary(lifelogs));
      console.log();

      lifelogs.forEach((lifelog, index) => {
        if (index > 0) console.log('\n' + colorText('─'.repeat(50), 'dim'));
        console.log(formatLifelog(lifelog, options.full));
      });

    } catch (error) {
      handleError(error);
    }
  });

// Get command
program
  .command('get')
  .description('Get a specific recording by ID')
  .argument('<id>', 'Lifelog ID')
  .option('-s, --save', 'Save transcript to local file', false)
  .action(async (id: string, options) => {
    try {
      const client = getClient();

      console.log(colorText(`📝 Fetching recording ${id}...`, 'bright'));
      console.log();

      const lifelog = await client.getLifelog(id);
      console.log(formatLifelog(lifelog, true));

      if (options.save) {
        const storage = new TranscriptStorage();
        const filepath = await storage.saveLifelog(lifelog);
        console.log();
        console.log(colorText(`💾 Saved to: ${filepath}`, 'green'));
      }

    } catch (error) {
      handleError(error);
    }
  });

// Export command
program
  .command('export')
  .description('Export transcripts to local markdown files')
  .argument('<query>', 'Search query or "recent" for recent recordings')
  .option('-d, --days <number>', 'For recent: number of days to look back', '7')
  .option('-s, --start <date>', 'Start date (YYYY-MM-DD or ISO-8601)')
  .option('-e, --end <date>', 'End date (YYYY-MM-DD or ISO-8601)')
  .option('-t, --timezone <timezone>', 'Timezone (e.g., America/New_York)', process.env.DEFAULT_TIMEZONE)
  .option('-n, --max <number>', 'Maximum number of results', '50')
  .option('-o, --single <filename>', 'Export to single file instead of multiple files')
  .action(async (query: string, options) => {
    try {
      const client = getClient();
      const storage = new TranscriptStorage();

      let lifelogs: Lifelog[] = [];

      if (query.toLowerCase() === 'recent') {
        const days = parseInt(options.days, 10);
        console.log(colorText(`📋 Exporting recent recordings (last ${days} days)`, 'bright'));
        lifelogs = await client.getRecentLifelogs(days, {
          timezone: options.timezone,
          maxResults: parseInt(options.max, 10),
        });
      } else {
        console.log(colorText(`🔍 Exporting recordings for: "${query}"`, 'bright'));

        let dateRange;
        if (options.start || options.end) {
          dateRange = {
            start: options.start || new Date(0).toISOString(),
            end: options.end || new Date().toISOString(),
          };
        } else {
          const days = parseInt(options.days, 10);
          const endDate = new Date();
          const startDate = new Date();
          startDate.setDate(endDate.getDate() - days);
          dateRange = { start: startDate.toISOString(), end: endDate.toISOString() };
        }

        lifelogs = await client.searchByQuery(query, {
          dateRange,
          timezone: options.timezone,
          maxResults: parseInt(options.max, 10),
        });
      }

      console.log();
      console.log(formatSummary(lifelogs));
      console.log();

      if (lifelogs.length === 0) {
        console.log(colorText('No recordings found to export.', 'yellow'));
        return;
      }

      let savedFiles: string[] = [];

      if (options.single) {
        const filepath = await storage.saveLifelogsAsSingleFile(lifelogs, options.single);
        savedFiles.push(filepath);
        console.log(colorText(`💾 Exported ${lifelogs.length} recordings to:`, 'green'));
        console.log(colorText(`   ${filepath}`, 'cyan'));
      } else {
        savedFiles = await storage.saveLifelogs(lifelogs);
        console.log(colorText(`💾 Exported ${savedFiles.length} recordings to:`, 'green'));
        console.log(colorText(`   ${storage.getTranscriptsDir()}`, 'cyan'));
        console.log();
        console.log(colorText('Files:', 'dim'));
        savedFiles.forEach(file => {
          const filename = file.split('/').pop() || file;
          console.log(colorText(`   • ${filename}`, 'dim'));
        });
      }

      console.log();
      console.log(colorText('📚 Tip: Use any markdown editor to view your saved transcripts!', 'yellow'));

    } catch (error) {
      handleError(error);
    }
  });

// List command
program
  .command('list')
  .description('List local transcript files')
  .action(async () => {
    try {
      const storage = new TranscriptStorage();
      const transcriptsDir = storage.getTranscriptsDir();

      const { readdir } = await import('fs/promises');
      const { stat } = await import('fs/promises');

      try {
        const files = await readdir(transcriptsDir);
        const mdFiles = files.filter(file => file.endsWith('.md'));

        if (mdFiles.length === 0) {
          console.log(colorText('No local transcripts found.', 'yellow'));
          console.log(colorText('Use "ghost export" to save transcripts locally.', 'dim'));
          return;
        }

        console.log(colorText(`📁 Local transcripts (${mdFiles.length} files):`, 'bright'));
        console.log(colorText(`📂 Directory: ${transcriptsDir}`, 'cyan'));
        console.log();

        for (const file of mdFiles.sort()) {
          const filepath = join(transcriptsDir, file);
          const stats = await stat(filepath);
          const sizeKB = Math.round(stats.size / 1024);
          const modified = stats.mtime.toLocaleDateString();

          console.log(colorText(`📄 ${file}`, 'white'));
          console.log(colorText(`   📊 ${sizeKB} KB • 📅 ${modified}`, 'dim'));
          console.log();
        }

      } catch (error) {
        console.log(colorText('No local transcripts found.', 'yellow'));
        console.log(colorText('Use "ghost export" to save transcripts locally.', 'dim'));
      }

    } catch (error) {
      handleError(error);
    }
  });

// Obsidian commands
program
  .command('obsidian')
  .description('Obsidian integration commands')
  .addCommand(
    new Command('import')
      .description('Import transcripts to Obsidian vault')
      .argument('<query>', 'Search query or "recent" for recent recordings')
      .option('-d, --days <number>', 'For recent: number of days to look back', '7')
      .option('-n, --max <number>', 'Maximum number of results', '20')
      .action(async (query: string, options) => {
        try {
          const client = getClient();
          const obsidian = new ObsidianIntegration();

          let lifelogs: Lifelog[] = [];

          if (query.toLowerCase() === 'recent') {
            const days = parseInt(options.days, 10);
            console.log(colorText(`📋 Importing recent recordings to Obsidian (last ${days} days)`, 'bright'));
            lifelogs = await client.getRecentLifelogs(days, {
              maxResults: parseInt(options.max, 10),
            });
          } else {
            console.log(colorText(`🔍 Importing recordings for: "${query}"`, 'bright'));
            lifelogs = await client.searchByQuery(query, {
              maxResults: parseInt(options.max, 10),
            });
          }

          console.log();
          console.log(formatSummary(lifelogs));
          console.log();

          if (lifelogs.length === 0) {
            console.log(colorText('No recordings found to import.', 'yellow'));
            return;
          }

          const importedFiles = await obsidian.importLifelogs(lifelogs);

          console.log(colorText(`📚 Imported ${importedFiles.length} recordings to Obsidian vault:`, 'green'));
          console.log(colorText(`   ${obsidian.getVaultPath()}`, 'cyan'));
          console.log();

          // Update daily note
          await obsidian.updateDailyNote(lifelogs);
          console.log(colorText(`📅 Updated today's daily note`, 'green'));

          // Generate insights
          const insights = await obsidian.generateInsights(lifelogs);
          if (insights.length > 0) {
            console.log();
            console.log(colorText('💡 Key Insights:', 'yellow'));
            insights.forEach(insight => console.log(colorText(`   ${insight}`, 'white')));
          }

          console.log();
          console.log(colorText('🚀 Ready to explore in Obsidian!', 'yellow'));

        } catch (error) {
          handleError(error);
        }
      })
  )
  .addCommand(
    new Command('move')
      .description('Move existing transcripts to Obsidian vault')
      .action(async () => {
        try {
          const obsidian = new ObsidianIntegration();

          console.log(colorText('📦 Moving existing transcripts to Obsidian vault...', 'bright'));

          const movedFiles = await obsidian.moveExistingTranscripts();

          if (movedFiles.length > 0) {
            console.log(colorText(`✅ Moved ${movedFiles.length} files to Obsidian vault:`, 'green'));
            console.log(colorText(`   ${obsidian.getVaultPath()}/🎙️ Recordings/`, 'cyan'));
          } else {
            console.log(colorText('No existing transcripts found to move.', 'yellow'));
          }

        } catch (error) {
          handleError(error);
        }
      })
  )
  .addCommand(
    new Command('open')
      .description('Open Ghost vault in Obsidian')
      .action(async () => {
        try {
          const obsidian = new ObsidianIntegration();

          console.log(colorText('🚀 Opening Ghost vault in Obsidian...', 'bright'));
          await obsidian.openInObsidian();

          console.log(colorText(`📁 Vault location: ${obsidian.getVaultPath()}`, 'cyan'));

        } catch (error) {
          handleError(error);
        }
      })
  )
  .addCommand(
    new Command('setup')
      .description('Setup Obsidian vault for Ghost integration')
      .action(async () => {
        try {
          const obsidian = new ObsidianIntegration();

          console.log(colorText('🔧 Setting up Obsidian vault for Ghost...', 'bright'));
          console.log();

          console.log(colorText('📁 Vault created at:', 'green'));
          console.log(colorText(`   ${obsidian.getVaultPath()}`, 'cyan'));
          console.log();

          console.log(colorText('📋 Next steps:', 'yellow'));
          console.log(colorText('1. Open Obsidian', 'white'));
          console.log(colorText('2. Open vault folder', 'white'));
          console.log(colorText(`3. Select folder: ${obsidian.getVaultPath()}`, 'white'));
          console.log(colorText('4. Install Community Plugins:', 'white'));
          console.log(colorText('   - Local REST API', 'white'));
          console.log(colorText('   - Dataview', 'white'));
          console.log(colorText('5. Enable Community Plugins in Settings', 'white'));
          console.log();

          console.log(colorText('🎯 Once setup is complete, run:', 'green'));
          console.log(colorText('   ghost obsidian open', 'white'));
          console.log(colorText('   ghost obsidian import recent', 'white'));

        } catch (error) {
          handleError(error);
        }
      })
  );

// Multi-vault commands
program
  .command('vaults')
  .description('Multi-vault management commands')
  .addCommand(
    new Command('config')
      .description('Configure external Obsidian vaults')
      .action(async () => {
        try {
          console.log(colorText('🔧 Multi-Vault Configuration', 'bright'));
          console.log();
          console.log(colorText('To add your existing Obsidian vaults:', 'yellow'));
          console.log(colorText('1. Open .env.vaults file', 'white'));
          console.log(colorText('2. Uncomment and modify the vault configurations', 'white'));
          console.log(colorText('3. Set your actual vault paths', 'white'));
          console.log(colorText('4. Set enabled=true for each vault', 'white'));
          console.log();

          const configPath = join(process.cwd(), '.env.vaults');
          console.log(colorText(`📁 Configuration file: ${configPath}`, 'cyan'));
          console.log();

          console.log(colorText('Example configuration:', 'yellow'));
          console.log(colorText('```', 'dim'));
          console.log(colorText('VAULT_1_NAME="Main Vault"', 'white'));
          console.log(colorText('VAULT_1_PATH="/Users/yourname/Documents/Obsidian/Main Vault"', 'white'));
          console.log(colorText('VAULT_1_ENABLED=true', 'white'));
          console.log(colorText('', 'dim'));
          console.log(colorText('VAULT_2_NAME="Work Projects"', 'white'));
          console.log(colorText('VAULT_2_PATH="/Users/yourname/Documents/Obsidian/Work"', 'white'));
          console.log(colorText('VAULT_2_ENABLED=true', 'white'));
          console.log(colorText('```', 'dim'));

        } catch (error) {
          handleError(error);
        }
      })
  )
  .addCommand(
    new Command('list')
      .description('List all configured vaults')
      .action(async () => {
        try {
          const vaultManager = new MultiVaultManager();
          const validation = await vaultManager.validateAllVaults();

          console.log(colorText('🗂️  Configured Vaults:', 'bright'));
          console.log();

          for (const { vault, valid } of validation) {
            const status = valid ? colorText('✅ Connected', 'green') : colorText('❌ Not Found', 'red');
            const type = vault.type === 'ghost' ? colorText('👻 Ghost', 'magenta') : colorText('📂 External', 'blue');

            console.log(colorText(`${vault.name}`, 'white'));
            console.log(colorText(`   ${type} • ${status}`, 'dim'));
            console.log(colorText(`   📁 ${vault.path}`, 'cyan'));
            console.log();
          }

          // Show stats
          const stats = await vaultManager.getVaultStats();
          console.log(colorText('📊 Vault Statistics:', 'yellow'));
          for (const [vaultName, { noteCount, totalSize }] of Object.entries(stats)) {
            const sizeMB = Math.round(totalSize / 1024 / 1024 * 100) / 100;
            console.log(colorText(`   ${vaultName}: ${noteCount} notes • ${sizeMB} MB`, 'dim'));
          }

        } catch (error) {
          handleError(error);
        }
      })
  )
  .addCommand(
    new Command('search')
      .description('Search across all vaults')
      .argument('<query>', 'Search query')
      .option('-c, --content', 'Search within note content', false)
      .option('-t, --tags <tags>', 'Filter by tags (comma-separated)', '')
      .option('-v, --vaults <vaults>', 'Search only specific vaults (comma-separated)', '')
      .option('-n, --limit <number>', 'Maximum results', '20')
      .action(async (query: string, options) => {
        try {
          const vaultManager = new MultiVaultManager();

          console.log(colorText(`🔍 Searching across all vaults for: "${query}"`, 'bright'));
          console.log();

          const searchOptions = {
            includeContent: options.content,
            tags: options.tags ? options.tags.split(',').map((t: string) => t.trim()) : undefined,
            vaults: options.vaults ? options.vaults.split(',').map((v: string) => v.trim()) : undefined,
            limit: parseInt(options.limit, 10)
          };

          const results = await vaultManager.searchAllVaults(query, searchOptions);

          if (results.length === 0) {
            console.log(colorText('No results found.', 'yellow'));
            return;
          }

          console.log(colorText(`📝 Found ${results.length} results:`, 'green'));
          console.log();

          for (const note of results) {
            const vaultIcon = note.vault === 'Ghost AI Vault' ? '👻' : '📂';
            const relativeTime = getRelativeTime(note.lastModified);

            console.log(colorText(`${vaultIcon} ${note.title}`, 'white'));
            console.log(colorText(`   📂 ${note.vault}`, 'blue'));
            console.log(colorText(`   📄 ${note.path}`, 'dim'));
            console.log(colorText(`   🕒 ${relativeTime}`, 'dim'));

            if (note.tags.length > 0) {
              const tagStr = note.tags.slice(0, 5).map(tag => `#${tag}`).join(' ');
              console.log(colorText(`   🏷️  ${tagStr}`, 'cyan'));
            }

            console.log();
          }

        } catch (error) {
          handleError(error);
        }
      })
  )
  .addCommand(
    new Command('index')
      .description('Generate cross-vault index')
      .action(async () => {
        try {
          const vaultManager = new MultiVaultManager();

          console.log(colorText('📚 Generating cross-vault index...', 'bright'));
          console.log();

          const index = await vaultManager.generateCrossVaultIndex();

          // Show top topics
          const topTopics = Object.entries(index.topics)
            .sort(([,a], [,b]) => b.count - a.count)
            .slice(0, 10);

          console.log(colorText('🏷️  Top Topics:', 'yellow'));
          for (const [topic, { count, vaults }] of topTopics) {
            const vaultStr = vaults.map(v => v.includes('Ghost') ? '👻' : '📂').join(' ');
            console.log(colorText(`   ${topic} (${count} notes) ${vaultStr}`, 'white'));
          }
          console.log();

          // Show recent activity
          console.log(colorText('🕒 Recent Activity:', 'yellow'));
          for (const note of index.recentNotes.slice(0, 5)) {
            const vaultIcon = note.vault === 'Ghost AI Vault' ? '👻' : '📂';
            const relativeTime = getRelativeTime(note.lastModified);
            console.log(colorText(`   ${vaultIcon} ${note.title} - ${relativeTime}`, 'dim'));
          }
          console.log();

          // Save index to Ghost vault
          const ghostVault = new ObsidianIntegration();
          const indexPath = join(ghostVault.getVaultPath(), '📚 Cross-Vault Index.md');

          let indexContent = `# 📚 Cross-Vault Knowledge Index

*Generated on ${new Date().toLocaleString()}*

## 🏷️  Popular Topics

| Topic | Count | Vaults |
|-------|--------|--------|
`;

          for (const [topic, { count, vaults }] of topTopics) {
            const vaultIcons = vaults.map(v => v.includes('Ghost') ? '👻' : '📂').join(' ');
            indexContent += `| ${topic} | ${count} | ${vaultIcons} |\n`;
          }

          indexContent += `

## 🕒 Recent Activity

`;

          for (const note of index.recentNotes.slice(0, 10)) {
            const vaultIcon = note.vault === 'Ghost AI Vault' ? '👻' : '📂';
            const relativeTime = getRelativeTime(note.lastModified);
            indexContent += `- ${vaultIcon} **[[${note.title}]]** (${note.vault}) - ${relativeTime}\n`;
          }

          indexContent += `

## 📊 Vault Statistics

`;

          for (const [vaultName, { noteCount, totalSize }] of Object.entries(index.vaultStats)) {
            const sizeMB = Math.round(totalSize / 1024 / 1024 * 100) / 100;
            const vaultIcon = vaultName.includes('Ghost') ? '👻' : '📂';
            indexContent += `- ${vaultIcon} **${vaultName}**: ${noteCount} notes, ${sizeMB} MB\n`;
          }

          indexContent += `

---

*Index automatically generated by Ghost AI Assistant*`;

          await writeFile(indexPath, indexContent, 'utf-8');
          console.log(colorText(`💾 Index saved to: ${indexPath}`, 'green'));

        } catch (error) {
          handleError(error);
        }
      })
  );

// Helper function for relative time
function getRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMinutes = Math.floor(diffMs / (1000 * 60));

  if (diffDays > 0) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  if (diffHours > 0) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffMinutes > 0) return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
  return 'Just now';
}

// Parse command line arguments
program.parse();