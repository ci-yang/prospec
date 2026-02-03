/**
 * Content merger for Prospec content markers.
 *
 * Handles merging of system-generated (auto) and user-written sections
 * using HTML comment markers:
 *
 *   <!-- prospec:auto-start -->
 *   (system content — overwritten on regeneration)
 *   <!-- prospec:auto-end -->
 *
 *   <!-- prospec:user-start -->
 *   (user content — preserved on regeneration)
 *   <!-- prospec:user-end -->
 */

/** Marker patterns */
const AUTO_START = '<!-- prospec:auto-start -->';
const AUTO_END = '<!-- prospec:auto-end -->';
const USER_START = '<!-- prospec:user-start -->';
const USER_END = '<!-- prospec:user-end -->';

interface ContentSection {
  type: 'auto' | 'user' | 'static';
  content: string;
}

/**
 * Parse a document into sections based on prospec content markers.
 *
 * Sections are classified as:
 * - 'auto': between auto-start and auto-end (system-generated)
 * - 'user': between user-start and user-end (user-written)
 * - 'static': everything else
 */
export function parseSections(content: string): ContentSection[] {
  const lines = content.split('\n');
  const sections: ContentSection[] = [];
  let currentLines: string[] = [];
  let currentType: ContentSection['type'] = 'static';

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed === AUTO_START) {
      // Flush current static section
      if (currentLines.length > 0) {
        sections.push({ type: currentType, content: currentLines.join('\n') });
        currentLines = [];
      }
      // Include the marker line in the auto section
      currentLines.push(line);
      currentType = 'auto';
      continue;
    }

    if (trimmed === AUTO_END && currentType === 'auto') {
      currentLines.push(line);
      sections.push({ type: 'auto', content: currentLines.join('\n') });
      currentLines = [];
      currentType = 'static';
      continue;
    }

    if (trimmed === USER_START) {
      // Flush current static section
      if (currentLines.length > 0) {
        sections.push({ type: currentType, content: currentLines.join('\n') });
        currentLines = [];
      }
      currentLines.push(line);
      currentType = 'user';
      continue;
    }

    if (trimmed === USER_END && currentType === 'user') {
      currentLines.push(line);
      sections.push({ type: 'user', content: currentLines.join('\n') });
      currentLines = [];
      currentType = 'static';
      continue;
    }

    currentLines.push(line);
  }

  // Flush remaining lines
  if (currentLines.length > 0) {
    sections.push({ type: currentType, content: currentLines.join('\n') });
  }

  return sections;
}

/**
 * Extract user sections from existing content.
 *
 * Returns an array of user section contents (including markers),
 * in the order they appear in the document.
 */
export function extractUserSections(content: string): string[] {
  return parseSections(content)
    .filter((s) => s.type === 'user')
    .map((s) => s.content);
}

/**
 * Merge new content with existing content, preserving user sections.
 *
 * Strategy:
 * - Auto sections in the new content replace auto sections in the existing content
 * - User sections from the existing content are preserved (not overwritten)
 * - Static sections use the new content version
 *
 * If the existing content is empty or has no user sections, the new content
 * is returned as-is.
 *
 * @param newContent - Freshly generated content (from templates)
 * @param existingContent - Previously existing file content (may contain user edits)
 * @returns Merged content with user sections preserved
 */
export function mergeContent(
  newContent: string,
  existingContent: string,
): string {
  if (!existingContent.trim()) {
    return newContent;
  }

  const existingUserSections = extractUserSections(existingContent);

  // If there are no user sections in the existing content, return new content as-is
  if (existingUserSections.length === 0) {
    return newContent;
  }

  // Parse new content into sections
  const newSections = parseSections(newContent);

  // Replace user sections in the new content with existing user sections
  let userIndex = 0;
  const mergedSections = newSections.map((section) => {
    if (section.type === 'user' && userIndex < existingUserSections.length) {
      const preserved = existingUserSections[userIndex]!;
      userIndex++;
      return { ...section, content: preserved };
    }
    return section;
  });

  return mergedSections.map((s) => s.content).join('\n');
}
