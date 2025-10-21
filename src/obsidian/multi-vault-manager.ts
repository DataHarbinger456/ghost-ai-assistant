import { readFile, access, readdir, stat } from 'fs/promises';
import { join, basename, dirname } from 'path';
import dotenv from 'dotenv';

export interface VaultConfig {
  name: string;
  path: string;
  enabled: boolean;
  type: 'ghost' | 'external';
}

export interface VaultNote {
  vault: string;
  path: string;
  title: string;
  content: string;
  tags: string[];
  frontmatter: Record<string, any>;
  lastModified: Date;
  size: number;
}

export class MultiVaultManager {
  private ghostVaultPath: string;
  private externalVaults: VaultConfig[] = [];

  constructor(ghostVaultPath: string = process.cwd() + '/Ghost AI Vault') {
    this.ghostVaultPath = ghostVaultPath;
    this.loadExternalVaults();
  }

  /**
   * Load external vault configurations from .env.vaults
   */
  private loadExternalVaults(): void {
    // Load vault-specific environment variables
    dotenv.config({ path: '.env.vaults' });

    const env = process.env;
    const vaults: VaultConfig[] = [];

    // Find all VAULT_X_ entries
    for (let i = 1; i <= 10; i++) { // Support up to 10 vaults
      const name = env[`VAULT_${i}_NAME`];
      const path = env[`VAULT_${i}_PATH`];
      const enabled = env[`VAULT_${i}_ENABLED`] === 'true';

      if (name && path && enabled) {
        vaults.push({
          name,
          path,
          enabled: true,
          type: 'external'
        });
      }
    }

    this.externalVaults = vaults;
  }

  /**
   * Get all configured vaults
   */
  getAllVaults(): VaultConfig[] {
    const ghostVault: VaultConfig = {
      name: 'Ghost AI Vault',
      path: this.ghostVaultPath,
      enabled: true,
      type: 'ghost'
    };

    return [ghostVault, ...this.externalVaults];
  }

  /**
   * Get all enabled external vaults
   */
  getExternalVaults(): VaultConfig[] {
    return this.externalVaults.filter(v => v.enabled);
  }

  /**
   * Check if a vault exists and is accessible
   */
  async validateVault(vault: VaultConfig): Promise<boolean> {
    try {
      await access(vault.path);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Validate all vaults
   */
  async validateAllVaults(): Promise<{ vault: VaultConfig; valid: boolean }[]> {
    const results = [];

    for (const vault of this.getAllVaults()) {
      const valid = await this.validateVault(vault);
      results.push({ vault, valid });
    }

    return results;
  }

  /**
   * Read all markdown files from a vault
   */
  async readVaultNotes(vault: VaultConfig): Promise<VaultNote[]> {
    const notes: VaultNote[] = [];

    try {
      const files = await this.getMarkdownFiles(vault.path);

      for (const file of files) {
        try {
          const note = await this.parseNoteFile(vault, file);
          if (note) {
            notes.push(note);
          }
        } catch (error) {
          console.warn(`Error reading note ${file} from ${vault.name}:`, error);
        }
      }
    } catch (error) {
      console.error(`Error reading vault ${vault.name}:`, error);
    }

    return notes;
  }

  /**
   * Recursively get all markdown files in a directory
   */
  private async getMarkdownFiles(dir: string): Promise<string[]> {
    const files: string[] = [];

    try {
      const entries = await readdir(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = join(dir, entry.name);

        if (entry.isDirectory()) {
          // Skip .obsidian directories
          if (entry.name === '.obsidian' || entry.name === '.git') {
            continue;
          }
          const subFiles = await this.getMarkdownFiles(fullPath);
          files.push(...subFiles);
        } else if (entry.name.endsWith('.md')) {
          files.push(fullPath);
        }
      }
    } catch (error) {
      console.error(`Error reading directory ${dir}:`, error);
    }

    return files;
  }

  /**
   * Parse a markdown note file
   */
  private async parseNoteFile(vault: VaultConfig, filePath: string): Promise<VaultNote | null> {
    try {
      const content = await readFile(filePath, 'utf-8');
      const stats = await stat(filePath);

      // Extract title from filename or content
      const relativePath = filePath.replace(vault.path, '').replace(/^\//, '');
      const title = this.extractTitle(content, relativePath);

      // Extract frontmatter
      const frontmatter = this.extractFrontmatter(content);

      // Extract tags
      const tags = this.extractTags(content, frontmatter);

      return {
        vault: vault.name,
        path: relativePath,
        title,
        content,
        tags,
        frontmatter,
        lastModified: stats.mtime,
        size: stats.size
      };
    } catch (error) {
      console.error(`Error parsing note ${filePath}:`, error);
      return null;
    }
  }

  /**
   * Extract title from content or filename
   */
  private extractTitle(content: string, relativePath: string): string {
    // Try to extract from H1 header
    const h1Match = content.match(/^#\s+(.+)$/m);
    if (h1Match) {
      return h1Match[1].trim();
    }

    // Fallback to filename
    const filename = basename(relativePath, '.md');
    return filename.replace(/-/g, ' ').replace(/_/g, ' ');
  }

  /**
   * Extract YAML frontmatter from content
   */
  private extractFrontmatter(content: string): Record<string, any> {
    const frontmatter: Record<string, any> = {};

    // Simple YAML frontmatter extraction
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
    if (frontmatterMatch) {
      const lines = frontmatterMatch[1].split('\n');
      for (const line of lines) {
        const match = line.match(/^(\w+):\s*(.+)$/);
        if (match) {
          const [, key, value] = match;
          // Try to parse as JSON or keep as string
          try {
            frontmatter[key] = JSON.parse(value);
          } catch {
            frontmatter[key] = value.replace(/^["']|["']$/g, ''); // Remove quotes
          }
        }
      }
    }

    return frontmatter;
  }

  /**
   * Extract tags from content and frontmatter
   */
  private extractTags(content: string, frontmatter: Record<string, any>): string[] {
    const tags = new Set<string>();

    // Extract from frontmatter tags
    if (frontmatter.tags) {
      const frontmatterTags = Array.isArray(frontmatter.tags)
        ? frontmatter.tags
        : [frontmatter.tags];

      frontmatterTags.forEach((tag: string) => {
        if (typeof tag === 'string') {
          // Handle both #tag and tag formats
          const cleanTag = tag.replace(/^#/, '');
          tags.add(cleanTag);
        }
      });
    }

    // Extract inline tags from content
    const tagMatches = content.matchAll(/#([a-zA-Z0-9_\-\s]+)/g);
    for (const match of tagMatches) {
      tags.add(match[1].trim());
    }

    // Extract wiki links as potential tags
    const wikiLinkMatches = content.matchAll(/\[\[([^\]]+)\]\]/g);
    for (const match of wikiLinkMatches) {
      const linkText = match[1];
      // Skip file links, keep concept links
      if (!linkText.includes('.') && !linkText.includes('/')) {
        tags.add(linkText);
      }
    }

    return Array.from(tags);
  }

  /**
   * Search across all vaults
   */
  async searchAllVaults(query: string, options: {
    includeContent?: boolean;
    tags?: string[];
    vaults?: string[];
    limit?: number;
  } = {}): Promise<VaultNote[]> {
    const vaultsToSearch = options.vaults
      ? this.getAllVaults().filter(v => options.vaults!.includes(v.name))
      : this.getAllVaults();

    const allNotes: VaultNote[] = [];

    for (const vault of vaultsToSearch) {
      if (!await this.validateVault(vault)) {
        console.warn(`Vault ${vault.name} is not accessible, skipping...`);
        continue;
      }

      const notes = await this.readVaultNotes(vault);
      allNotes.push(...notes);
    }

    // Filter results
    let filteredNotes = allNotes;

    // Tag filtering
    if (options.tags && options.tags.length > 0) {
      filteredNotes = filteredNotes.filter(note =>
        options.tags!.some(tag =>
          note.tags.some(noteTag =>
            noteTag.toLowerCase().includes(tag.toLowerCase())
          )
        )
      );
    }

    // Content/title search
    if (query) {
      const searchLower = query.toLowerCase();
      filteredNotes = filteredNotes.filter(note =>
        note.title.toLowerCase().includes(searchLower) ||
        (options.includeContent && note.content.toLowerCase().includes(searchLower))
      );
    }

    // Sort by last modified
    filteredNotes.sort((a, b) => b.lastModified.getTime() - a.lastModified.getTime());

    // Limit results
    if (options.limit) {
      filteredNotes = filteredNotes.slice(0, options.limit);
    }

    return filteredNotes;
  }

  /**
   * Get vault statistics
   */
  async getVaultStats(): Promise<Record<string, { noteCount: number; totalSize: number }>> {
    const stats: Record<string, { noteCount: number; totalSize: number }> = {};

    for (const vault of this.getAllVaults()) {
      if (!await this.validateVault(vault)) {
        continue;
      }

      const notes = await this.readVaultNotes(vault);
      const totalSize = notes.reduce((sum, note) => sum + note.size, 0);

      stats[vault.name] = {
        noteCount: notes.length,
        totalSize
      };
    }

    return stats;
  }

  /**
   * Generate a cross-vault index
   */
  async generateCrossVaultIndex(): Promise<{
    topics: Record<string, { count: number; vaults: string[] }>;
    recentNotes: VaultNote[];
    vaultStats: Record<string, { noteCount: number; totalSize: number }>;
  }> {
    const allNotes: VaultNote[] = [];
    const topicIndex: Record<string, { count: number; vaults: string[] }> = {};

    for (const vault of this.getAllVaults()) {
      if (!await this.validateVault(vault)) {
        continue;
      }

      const notes = await this.readVaultNotes(vault);
      allNotes.push(...notes);

      // Index topics
      for (const note of notes) {
        for (const tag of note.tags) {
          if (!topicIndex[tag]) {
            topicIndex[tag] = { count: 0, vaults: [] };
          }
          topicIndex[tag].count++;
          if (!topicIndex[tag].vaults.includes(vault.name)) {
            topicIndex[tag].vaults.push(vault.name);
          }
        }
      }
    }

    // Sort notes by date
    const recentNotes = allNotes
      .sort((a, b) => b.lastModified.getTime() - a.lastModified.getTime())
      .slice(0, 20);

    // Get vault stats
    const vaultStats = await this.getVaultStats();

    return {
      topics: topicIndex,
      recentNotes,
      vaultStats
    };
  }
}