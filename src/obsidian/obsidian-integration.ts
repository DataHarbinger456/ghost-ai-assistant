import { writeFile, mkdir, access, readdir, copyFile } from 'fs/promises';
import { join, dirname, basename } from 'path';
import { execSync } from 'child_process';
import { Lifelog } from '../types/lifelogs';

export class ObsidianIntegration {
  private readonly vaultPath: string;
  private readonly recordingsPath: string;
  private readonly insightsPath: string;
  private readonly projectsPath: string;
  private readonly dailyPath: string;

  constructor(vaultPath: string = process.cwd() + '/Ghost AI Vault') {
    this.vaultPath = vaultPath;
    this.recordingsPath = join(vaultPath, '🎙️ Recordings');
    this.insightsPath = join(vaultPath, '💡 Insights');
    this.projectsPath = join(vaultPath, '📋 Projects');
    this.dailyPath = join(vaultPath, '🎯 Daily');
  }

  /**
   * Ensure all vault directories exist
   */
  private async ensureDirectories(): Promise<void> {
    const dirs = [
      this.vaultPath,
      this.recordingsPath,
      this.insightsPath,
      this.projectsPath,
      this.dailyPath,
    ];

    for (const dir of dirs) {
      try {
        await access(dir);
      } catch {
        await mkdir(dir, { recursive: true });
      }
    }
  }

  /**
   * Generate a clean filename for Obsidian
   */
  private generateObsidianFilename(lifelog: Lifelog): string {
    const date = new Date(lifelog.startTime);
    const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD
    const timeStr = date.toTimeString().split(' ')[0].replace(/:/g, '-'); // HH-MM-SS

    // Clean title for filename
    const cleanTitle = lifelog.title
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 60);

    return `${dateStr} ${timeStr} - ${cleanTitle}.md`;
  }

  /**
   * Format lifelog as Obsidian note with frontmatter and tags
   */
  private formatAsObsidianNote(lifelog: Lifelog): string {
    const date = new Date(lifelog.startTime);
    const duration = new Date(lifelog.endTime).getTime() - new Date(lifelog.startTime).getTime();
    const durationMinutes = Math.round(duration / 60000);

    // Extract potential topics from title and content
    const topics = this.extractTopics(lifelog);

    const frontmatter = `---
type: recording
date: ${date.toISOString()}
duration: ${durationMinutes}
id: ${lifelog.id}
starred: ${lifelog.isStarred}
source: limitless
topics: [${topics.map(t => `"${t}"`).join(', ')}]
tags: [recording, ${topics.map(t => `${t}`).join(', ')}${lifelog.isStarred ? ', starred' : ''}]
---

`;

    const content = `# ${lifelog.title}

## 📊 Recording Details
- **Date:** ${date.toLocaleString()}
- **Duration:** ${durationMinutes} minutes
- **Recording ID:** \`${lifelog.id}\`
- **Starred:** ${lifelog.isStarred ? '⭐ Yes' : 'No'}

## 🏷️ Topics
${topics.map(topic => `- [[${topic}]]`).join('\n')}

---

${lifelog.markdown || 'No transcript available.'}

---

## 💡 Potential Actions
- [ ] Extract key insights to separate notes
- [ ] Link to relevant projects
- [ ] Create action items
- [ ] Follow up on mentioned topics

## 🔗 Related Notes
<!-- Add related notes here -->

---

*Recording imported by Ghost AI Assistant on ${new Date().toLocaleString()}*`;

    return frontmatter + content;
  }

  /**
   * Extract topics from lifelog content
   */
  private extractTopics(lifelog: Lifelog): string[] {
    const content = (lifelog.title + ' ' + (lifelog.markdown || '')).toLowerCase();
    const topics: string[] = [];

    // Common business/tech topics
    const topicKeywords = {
      'Business': ['business', 'venture', 'entrepreneur', 'startup', 'revenue', 'profit'],
      'AI': ['ai', 'artificial intelligence', 'machine learning', 'automation', 'chatbot'],
      'Marketing': ['marketing', 'sales', 'lead', 'customer', 'conversion'],
      'Technology': ['software', 'app', 'website', 'code', 'development', 'api'],
      'Meeting': ['meeting', 'call', 'discussion', 'client', 'team'],
      'Ideas': ['idea', 'concept', 'plan', 'strategy', 'vision'],
      'Content': ['content', 'video', 'podcast', 'blog', 'social media'],
      'Lead Generation': ['lead generation', 'leads', 'prospects', 'automation'],
      'Productivity': ['productivity', 'efficiency', 'workflow', 'system'],
      'Learning': ['learn', 'study', 'research', 'knowledge', 'education'],
    };

    for (const [topic, keywords] of Object.entries(topicKeywords)) {
      if (keywords.some(keyword => content.includes(keyword))) {
        topics.push(topic);
      }
    }

    // Extract unique topics, max 5
    return [...new Set(topics)].slice(0, 5);
  }

  /**
   * Import a single lifelog to Obsidian
   */
  async importLifelog(lifelog: Lifelog): Promise<string> {
    await this.ensureDirectories();

    const filename = this.generateObsidianFilename(lifelog);
    const filepath = join(this.recordingsPath, filename);
    const noteContent = this.formatAsObsidianNote(lifelog);

    await writeFile(filepath, noteContent, 'utf-8');
    return filepath;
  }

  /**
   * Import multiple lifelogs to Obsidian
   */
  async importLifelogs(lifelogs: Lifelog[]): Promise<string[]> {
    const importedFiles: string[] = [];

    for (const lifelog of lifelogs) {
      try {
        const filepath = await this.importLifelog(lifelog);
        importedFiles.push(filepath);
      } catch (error) {
        console.error(`Error importing lifelog ${lifelog.id}:`, error);
      }
    }

    return importedFiles;
  }

  /**
   * Move existing transcript files to Obsidian vault
   */
  async moveExistingTranscripts(transcriptsDir: string = './transcripts'): Promise<string[]> {
    await this.ensureDirectories();

    try {
      const files = await readdir(transcriptsDir);
      const mdFiles = files.filter(file => file.endsWith('.md'));
      const movedFiles: string[] = [];

      for (const file of mdFiles) {
        const sourcePath = join(transcriptsDir, file);
        const destPath = join(this.recordingsPath, file);

        await copyFile(sourcePath, destPath);
        movedFiles.push(destPath);
      }

      return movedFiles;
    } catch (error) {
      console.error('Error moving existing transcripts:', error);
      return [];
    }
  }

  /**
   * Create or update today's daily note with recording summary
   */
  async updateDailyNote(lifelogs: Lifelog[]): Promise<string> {
    await this.ensureDirectories();

    const today = new Date().toISOString().split('T')[0];
    const dailyNotePath = join(this.dailyPath, `${today}.md`);

    const totalDuration = lifelogs.reduce((acc, log) => {
      return acc + (new Date(log.endTime).getTime() - new Date(log.startTime).getTime());
    }, 0);

    const totalMinutes = Math.round(totalDuration / 60000);

    let dailyContent = `# 📅 Daily Note - ${today}

## 🎙️ Today's Recordings
- **Total Recordings:** ${lifelogs.length}
- **Total Duration:** ${totalMinutes} minutes

`;

    if (lifelogs.length > 0) {
      dailyContent += '### 📝 Recording Summary\n\n';

      for (const lifelog of lifelogs) {
        const filename = this.generateObsidianFilename(lifelog);
        const recordingNote = `🎙️ Recordings/${filename.replace('.md', '')}`;
        const duration = Math.round(
          (new Date(lifelog.endTime).getTime() - new Date(lifelog.startTime).getTime()) / 60000
        );

        dailyContent += `- [[${recordingNote}]] (${duration} min) - ${lifelog.title}\n`;
      }
    }

    dailyContent += `

## 💡 Key Insights
<!-- Add insights extracted from today's recordings -->

## 📋 Action Items
- [ ] Review recordings for action items
- [ ] Extract key insights to separate notes
- [ ] Follow up on mentioned topics

---

*Daily note updated by Ghost AI Assistant on ${new Date().toLocaleString()}*`;

    await writeFile(dailyNotePath, dailyContent, 'utf-8');
    return dailyNotePath;
  }

  /**
   * Generate insights summary from lifelogs
   */
  async generateInsights(lifelogs: Lifelog[]): Promise<string[]> {
    const insights: string[] = [];

    // Extract common themes and topics
    const allTopics = lifelogs.flatMap(log => this.extractTopics(log));
    const topicCounts = allTopics.reduce((acc, topic) => {
      acc[topic] = (acc[topic] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topTopics = Object.entries(topicCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([topic]) => topic);

    if (topTopics.length > 0) {
      insights.push(`🎯 **Main Topics:** ${topTopics.join(', ')}`);
    }

    // Look for action items and decisions
    const allContent = lifelogs.map(log => log.markdown || '').join(' ').toLowerCase();

    if (allContent.includes('decision') || allContent.includes('decided')) {
      insights.push('💡 **Key Decisions Made** - Review recordings for specific decisions');
    }

    if (allContent.includes('idea') || allContent.includes('thought')) {
      insights.push('🧠 **New Ideas** - Multiple new ideas discussed');
    }

    return insights;
  }

  /**
   * Get vault path
   */
  getVaultPath(): string {
    return this.vaultPath;
  }

  /**
   * Open vault in Obsidian (if Obsidian is installed)
   */
  async openInObsidian(): Promise<void> {
    try {
      execSync(`open "obsidian://open?vault=${encodeURIComponent(basename(this.vaultPath))}&file=📚%20Ghost%20Dashboard"`, { stdio: 'ignore' });
    } catch (error) {
      console.log('Could not open in Obsidian. Make sure Obsidian is installed and the vault is configured.');
      console.log(`Vault location: ${this.vaultPath}`);
    }
  }
}