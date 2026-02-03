import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createLogger } from '../../../src/lib/logger.js';

describe('createLogger', () => {
  let stdoutSpy: ReturnType<typeof vi.spyOn>;
  let stderrSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    stdoutSpy = vi.spyOn(process.stdout, 'write').mockReturnValue(true);
    stderrSpy = vi.spyOn(process.stderr, 'write').mockReturnValue(true);
  });

  afterEach(() => {
    stdoutSpy.mockRestore();
    stderrSpy.mockRestore();
  });

  describe('normal mode', () => {
    it('should output success messages', () => {
      const logger = createLogger('normal');
      logger.success('Done');
      expect(stdoutSpy).toHaveBeenCalledWith(expect.stringContaining('Done'));
    });

    it('should output error messages to stderr', () => {
      const logger = createLogger('normal');
      logger.error('Failed');
      expect(stderrSpy).toHaveBeenCalledWith(expect.stringContaining('Failed'));
    });

    it('should output warning messages', () => {
      const logger = createLogger('normal');
      logger.warning('Caution');
      expect(stdoutSpy).toHaveBeenCalledWith(expect.stringContaining('Caution'));
    });

    it('should output info messages', () => {
      const logger = createLogger('normal');
      logger.info('Note');
      expect(stdoutSpy).toHaveBeenCalledWith(expect.stringContaining('Note'));
    });

    it('should NOT output step messages', () => {
      const logger = createLogger('normal');
      logger.step('Step 1');
      expect(stdoutSpy).not.toHaveBeenCalled();
    });

    it('should NOT output detail messages', () => {
      const logger = createLogger('normal');
      logger.detail('key', 'value');
      expect(stdoutSpy).not.toHaveBeenCalled();
    });

    it('should NOT output list messages', () => {
      const logger = createLogger('normal');
      logger.list(['a', 'b']);
      expect(stdoutSpy).not.toHaveBeenCalled();
    });

    it('should output summary messages', () => {
      const logger = createLogger('normal');
      logger.summary('All done');
      expect(stdoutSpy).toHaveBeenCalledWith(expect.stringContaining('All done'));
    });
  });

  describe('quiet mode', () => {
    it('should suppress success messages', () => {
      const logger = createLogger('quiet');
      logger.success('Done');
      expect(stdoutSpy).not.toHaveBeenCalled();
    });

    it('should still output error messages', () => {
      const logger = createLogger('quiet');
      logger.error('Failed');
      expect(stderrSpy).toHaveBeenCalledWith(expect.stringContaining('Failed'));
    });

    it('should suppress warning messages', () => {
      const logger = createLogger('quiet');
      logger.warning('Caution');
      expect(stdoutSpy).not.toHaveBeenCalled();
    });

    it('should suppress info messages', () => {
      const logger = createLogger('quiet');
      logger.info('Note');
      expect(stdoutSpy).not.toHaveBeenCalled();
    });

    it('should suppress summary messages', () => {
      const logger = createLogger('quiet');
      logger.summary('Done');
      expect(stdoutSpy).not.toHaveBeenCalled();
    });
  });

  describe('verbose mode', () => {
    it('should output all message types', () => {
      const logger = createLogger('verbose');
      logger.success('Done');
      logger.warning('Warn');
      logger.info('Info');
      logger.step('Step');
      logger.detail('key', 'value');
      logger.list(['item']);
      logger.summary('Summary');
      // 7 stdout calls (success, warning, info, step, detail, list item, summary)
      expect(stdoutSpy).toHaveBeenCalledTimes(7);
    });

    it('should output step messages', () => {
      const logger = createLogger('verbose');
      logger.step('Processing files');
      expect(stdoutSpy).toHaveBeenCalledWith(expect.stringContaining('Processing files'));
    });

    it('should output detail messages with label and value', () => {
      const logger = createLogger('verbose');
      logger.detail('Path', '/tmp/test');
      expect(stdoutSpy).toHaveBeenCalledWith(expect.stringContaining('Path'));
      expect(stdoutSpy).toHaveBeenCalledWith(expect.stringContaining('/tmp/test'));
    });
  });

  describe('default level', () => {
    it('should default to normal mode', () => {
      const logger = createLogger();
      logger.success('Done');
      expect(stdoutSpy).toHaveBeenCalled();
      stdoutSpy.mockClear();
      logger.step('Step');
      expect(stdoutSpy).not.toHaveBeenCalled();
    });
  });

  describe('detail formatting', () => {
    it('should include optional detail text', () => {
      const logger = createLogger('normal');
      logger.success('Created', '/path/to/file');
      expect(stdoutSpy).toHaveBeenCalledWith(expect.stringContaining('/path/to/file'));
    });
  });
});
