import { Document, parseDocument, stringify } from 'yaml';
import type { DocumentOptions, ParseOptions, SchemaOptions, ToStringOptions } from 'yaml';
import { YamlParseError } from '../types/errors.js';

/**
 * Parse a YAML string into a JavaScript value.
 * Wraps errors with YamlParseError for consistent handling.
 */
export function parseYaml<T = unknown>(
  content: string,
  sourcePath?: string,
): T {
  try {
    const doc = parseDocument(content);
    if (doc.errors.length > 0) {
      const firstError = doc.errors[0];
      throw new YamlParseError(
        sourcePath ?? '<string>',
        firstError?.message,
      );
    }
    return doc.toJS() as T;
  } catch (err) {
    if (err instanceof YamlParseError) throw err;
    throw new YamlParseError(
      sourcePath ?? '<string>',
      err instanceof Error ? err.message : String(err),
    );
  }
}

/**
 * Stringify a JavaScript value to a YAML string.
 */
export function stringifyYaml(
  value: unknown,
  options?: DocumentOptions & SchemaOptions & ParseOptions & ToStringOptions,
): string {
  return stringify(value, options);
}

/**
 * Parse YAML string into a Document for comment-preserving round-trips.
 * The Document API allows modifying values while preserving comments.
 */
export function parseYamlDocument(
  content: string,
  sourcePath?: string,
): Document {
  try {
    const doc = parseDocument(content);
    if (doc.errors.length > 0) {
      const firstError = doc.errors[0];
      throw new YamlParseError(
        sourcePath ?? '<string>',
        firstError?.message,
      );
    }
    return doc;
  } catch (err) {
    if (err instanceof YamlParseError) throw err;
    throw new YamlParseError(
      sourcePath ?? '<string>',
      err instanceof Error ? err.message : String(err),
    );
  }
}

/**
 * Stringify a YAML Document back to string, preserving comments.
 */
export function stringifyYamlDocument(doc: Document): string {
  return doc.toString();
}
