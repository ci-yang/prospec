import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';

export interface AgentInfo {
  name: string;
  id: string;
  detected: boolean;
}

const AGENT_DIRS: { id: string; name: string; dir: string }[] = [
  { id: 'claude', name: 'Claude Code', dir: '.claude' },
  { id: 'gemini', name: 'Gemini CLI', dir: '.gemini' },
  { id: 'copilot', name: 'GitHub Copilot CLI', dir: '.copilot' },
  { id: 'codex', name: 'Codex CLI', dir: '.codex' },
];

/**
 * Detect which AI CLI tools are installed by checking for their
 * configuration directories in the user's home directory.
 *
 * Returns an array of agent info with detection status.
 */
export function detectAgents(): AgentInfo[] {
  const home = os.homedir();

  return AGENT_DIRS.map(({ id, name, dir }) => ({
    id,
    name,
    detected: dirExists(path.join(home, dir)),
  }));
}

function dirExists(dirPath: string): boolean {
  try {
    const stat = fs.statSync(dirPath);
    return stat.isDirectory();
  } catch {
    return false;
  }
}
