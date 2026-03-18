'use client';

import { useState } from 'react';
import { Folder, FolderOpen, FileCode, FileText, ChevronDown, ChevronRight } from 'lucide-react';
import { DiffEditor } from '@monaco-editor/react';

const MOCK_FILES = {
  original: {
    'src/skills/WebSearch.ts': `export class WebSearch {
  execute(query: string) {
    return fetch('api/search?q=' + query);
  }
}`,
    'src/skills/DataParser.ts': `export function parseData(data: any) {
  return data;
}`,
    'package.json': `{
  "name": "axon",
  "version": "1.0.0"
}`
  },
  modified: {
    'src/skills/WebSearch.ts': `export class WebSearch {
  private endpoint = 'https://api.search.io/v2';
  
  async execute(query: string) {
    const res = await fetch(\`\${this.endpoint}?q=\${encodeURIComponent(query)}\`);
    return res.json();
  }
}`,
    'src/skills/DataParser.ts': `export function parseData(data: any): ParsedData {
  if (!data) throw new Error('No data');
  return { ...data, parsedAt: Date.now() };
}`,
    'package.json': `{
  "name": "axon",
  "version": "1.0.1"
}`
  }
};

type FileNode = {
  name: string;
  path: string;
  type: 'file' | 'folder';
  children?: FileNode[];
};

const FILE_TREE: FileNode[] = [
  {
    name: 'src',
    path: 'src',
    type: 'folder',
    children: [
      {
        name: 'skills',
        path: 'src/skills',
        type: 'folder',
        children: [
          { name: 'WebSearch.ts', path: 'src/skills/WebSearch.ts', type: 'file' },
          { name: 'DataParser.ts', path: 'src/skills/DataParser.ts', type: 'file' },
        ],
      },
    ],
  },
  { name: 'package.json', path: 'package.json', type: 'file' },
];

export default function CodePage() {
  const [activeFile, setActiveFile] = useState<string>('src/skills/WebSearch.ts');
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['src', 'src/skills']));

  const toggleFolder = (path: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(path)) {
      newExpanded.delete(path);
    } else {
      newExpanded.add(path);
    }
    setExpandedFolders(newExpanded);
  };

  const renderTree = (nodes: FileNode[], level: number = 0) => {
    return nodes.map((node) => {
      const isExpanded = expandedFolders.has(node.path);
      const isSelected = activeFile === node.path;

      if (node.type === 'folder') {
        return (
          <div key={node.path}>
            <button
              onClick={() => toggleFolder(node.path)}
              className="flex items-center w-full px-2 py-1.5 focus:outline-none hover:bg-black/5 dark:hover:bg-white/10 text-black dark:text-white transition-colors"
              style={{ paddingLeft: `${level * 12 + 8}px` }}
            >
              {isExpanded ? (
                <ChevronDown className="w-4 h-4 mr-1 opacity-70" />
              ) : (
                <ChevronRight className="w-4 h-4 mr-1 opacity-70" />
              )}
              {isExpanded ? (
                <FolderOpen className="w-4 h-4 mr-2 text-black dark:text-white opacity-80" />
              ) : (
                <Folder className="w-4 h-4 mr-2 text-black dark:text-white opacity-80" />
              )}
              <span className="text-sm truncate select-none">{node.name}</span>
            </button>
            {isExpanded && node.children && (
              <div>{renderTree(node.children, level + 1)}</div>
            )}
          </div>
        );
      }

      return (
        <button
          key={node.path}
          onClick={() => setActiveFile(node.path)}
          className={`flex items-center w-full px-2 py-1.5 focus:outline-none transition-colors ${
            isSelected
              ? 'bg-black/10 dark:bg-white/10 text-black dark:text-white font-medium'
              : 'hover:bg-black/5 dark:hover:bg-white/5 text-black/70 dark:text-white/70'
          }`}
          style={{ paddingLeft: `${level * 12 + 28}px` }}
        >
          {node.name.endsWith('.ts') ? (
            <FileCode className="w-4 h-4 mr-2 opacity-80" />
          ) : (
            <FileText className="w-4 h-4 mr-2 opacity-80" />
          )}
          <span className="text-sm truncate select-none">{node.name}</span>
        </button>
      );
    });
  };

  const getLanguage = (filename: string) => {
    if (filename.endsWith('.json')) return 'json';
    return 'typescript';
  };

  return (
    <div className="h-full flex flex-col bg-white dark:bg-[#0d1117] text-black dark:text-white overflow-hidden">
      {/* Header & Actions */}
      <div className="flex flex-wrap items-center justify-between p-4 border-b border-black/10 dark:border-white/10 bg-white dark:bg-[#161b22] gap-4">
        <div>
          <h1 className="text-xl font-semibold">Code Changes</h1>
          <p className="text-sm text-black/60 dark:text-white/60">Review generated skill code before committing.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="px-4 py-2 text-sm font-medium bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 transition-colors rounded-md">
            Install Skill
          </button>
          <button className="px-4 py-2 text-sm font-medium bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 transition-colors rounded-md">
            Approve Code
          </button>
          <button className="px-4 py-2 text-sm font-medium text-white bg-black hover:bg-black/80 dark:bg-white dark:text-black dark:hover:bg-white/90 transition-colors rounded-md">
            Commit Changes
          </button>
        </div>
      </div>

      <div className="flex-1 flex min-h-0">
        {/* Sidebar */}
        <div className="w-64 border-r border-black/10 dark:border-white/10 bg-black/5 dark:bg-[#0d1117] flex flex-col">
          <div className="p-3 border-b border-black/10 dark:border-white/10 text-xs font-semibold uppercase tracking-wider text-black/60 dark:text-white/60">
            Explorer
          </div>
          <div className="flex-1 overflow-y-auto py-2">
            {renderTree(FILE_TREE)}
          </div>
        </div>

        {/* Diff Viewer */}
        <div className="flex-1 flex flex-col min-w-0 bg-white dark:bg-[#0d1117]">
          <div className="flex items-center p-3 border-b border-black/10 dark:border-white/10 bg-black/5 dark:bg-[#161b22] gap-2">
            {activeFile.endsWith('.ts') ? (
              <FileCode className="w-4 h-4 text-black/60 dark:text-white/60" />
            ) : (
              <FileText className="w-4 h-4 text-black/60 dark:text-white/60" />
            )}
            <span className="text-sm font-medium font-mono">{activeFile}</span>
          </div>
          <div className="flex-1 relative">
            <DiffEditor
              height="100%"
              language={getLanguage(activeFile)}
              original={MOCK_FILES.original[activeFile as keyof typeof MOCK_FILES.original] || ''}
              modified={MOCK_FILES.modified[activeFile as keyof typeof MOCK_FILES.modified] || ''}
              theme="vs-dark"
              options={{
                minimap: { enabled: false },
                fontSize: 13,
                fontFamily: 'var(--font-mono)',
                renderSideBySide: true,
                readOnly: true,
                scrollBeyondLastLine: false,
                padding: { top: 16 }
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
