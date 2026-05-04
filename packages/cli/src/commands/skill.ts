/**
 * Skill command - Install bundled Archon skill files into a project
 *
 * Writes the bundled SKILL.md, guides, references and examples into both
 * <targetPath>/.claude/skills/archon/ and <targetPath>/.agents/skills/archon/
 * so Claude Code and Codex-compatible hosts can pick up the skill.
 *
 * Always overwrites existing files to ensure the latest skill version
 * shipped with the current Archon binary is installed.
 */
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { dirname, join, resolve } from 'path';

/**
 * Copy the bundled Archon skill files to both host-skill roots:
 * - <targetPath>/.claude/skills/archon/
 * - <targetPath>/.agents/skills/archon/
 *
 * Pure file-system helper used by both the standalone `skill install` CLI
 * command and the interactive setup wizard.
 *
 * The `bundled-skill` module is dynamically imported here so its text imports
 * only execute when this function is actually called. Compiled binaries (`bun
 * build --compile`) still statically analyze the literal-string `import()` and
 * embed the chunk; linked-source installs (`bun link`) don't touch the source
 * skill files unless the user runs `archon setup` or `archon skill install`.
 * Without this indirection, every `archon` invocation, including
 * `archon --help`, fails at module load when source skill files are missing.
 */
export async function copyArchonSkill(targetPath: string): Promise<void> {
  const { BUNDLED_SKILL_FILES } = await import('../bundled-skill');
  const skillRoots = [
    join(targetPath, '.claude', 'skills', 'archon'),
    join(targetPath, '.agents', 'skills', 'archon'),
  ];

  for (const skillRoot of skillRoots) {
    for (const [relativePath, content] of Object.entries(BUNDLED_SKILL_FILES)) {
      const dest = join(skillRoot, relativePath);
      const destDir = dirname(dest);
      if (!existsSync(destDir)) {
        mkdirSync(destDir, { recursive: true });
      }
      writeFileSync(dest, content);
    }
  }
}

/**
 * Install the bundled Archon skill into a project directory.
 *
 * Returns an exit code: 0 on success, 1 on failure.
 */
export async function skillInstallCommand(targetPath: string): Promise<number> {
  const absoluteTarget = resolve(targetPath);

  if (!existsSync(absoluteTarget)) {
    console.error(`Error: Directory does not exist: ${absoluteTarget}`);
    return 1;
  }

  const claudeSkillRoot = join(absoluteTarget, '.claude', 'skills', 'archon');
  const agentsSkillRoot = join(absoluteTarget, '.agents', 'skills', 'archon');
  try {
    const { BUNDLED_SKILL_FILES } = await import('../bundled-skill');
    const fileCount = Object.keys(BUNDLED_SKILL_FILES).length;
    console.log(`Installing Archon skill (${fileCount} files each) into:`);
    console.log(`  ${claudeSkillRoot}`);
    console.log(`  ${agentsSkillRoot}`);

    await copyArchonSkill(absoluteTarget);
    console.log('Done. Restart Claude Code or Codex to load the skill.');
    return 0;
  } catch (error) {
    const err = error as NodeJS.ErrnoException;
    console.error(`Error: Failed to install skill: ${err.message}`);
    return 1;
  }
}
