import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  warnUnused,
  DEFAULT_IGNORE_PREFIXES,
  DEFAULT_IGNORE_VARIABLES,
} from './index';

describe('warnUnused', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = {};
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('returns empty array when all env vars are defined in schema', () => {
    process.env = { FOO: 'bar', BAZ: 'qux' };
    const cleanedEnv = { FOO: 'bar', BAZ: 'qux' };

    const result = warnUnused(cleanedEnv, { warn: () => {} });

    expect(result).toEqual([]);
  });

  it('returns unused env vars not in schema', () => {
    process.env = { FOO: 'bar', UNUSED_VAR: 'value' };
    const cleanedEnv = { FOO: 'bar' };

    const result = warnUnused(cleanedEnv, {
      warn: () => {},
      ignorePrefixes: [],
      ignoreVariables: [],
    });

    expect(result).toEqual(['UNUSED_VAR']);
  });

  it('returns multiple unused env vars', () => {
    process.env = { FOO: 'bar', UNUSED1: 'a', UNUSED2: 'b' };
    const cleanedEnv = { FOO: 'bar' };

    const result = warnUnused(cleanedEnv, {
      warn: () => {},
      ignorePrefixes: [],
      ignoreVariables: [],
    });

    expect(result).toEqual(['UNUSED1', 'UNUSED2']);
  });

  describe('ignoreVariables', () => {
    it('ignores exact variable names specified in ignoreVariables', () => {
      process.env = { FOO: 'bar', IGNORED_VAR: 'value', ANOTHER: 'x' };
      const cleanedEnv = { FOO: 'bar' };

      const result = warnUnused(cleanedEnv, {
        warn: () => {},
        ignorePrefixes: [],
        ignoreVariables: ['IGNORED_VAR'],
      });

      expect(result).toEqual(['ANOTHER']);
    });

    it('ignores multiple exact variable names', () => {
      process.env = { FOO: 'bar', IGNORED1: 'a', IGNORED2: 'b', UNUSED: 'c' };
      const cleanedEnv = { FOO: 'bar' };

      const result = warnUnused(cleanedEnv, {
        warn: () => {},
        ignorePrefixes: [],
        ignoreVariables: ['IGNORED1', 'IGNORED2'],
      });

      expect(result).toEqual(['UNUSED']);
    });

    it('uses DEFAULT_IGNORE_VARIABLES when ignoreVariables not specified', () => {
      process.env = { FOO: 'bar', SHELL: '/bin/bash', CUSTOM_VAR: 'value' };
      const cleanedEnv = { FOO: 'bar' };

      const result = warnUnused(cleanedEnv, {
        warn: () => {},
        ignorePrefixes: [],
      });

      expect(result).toEqual(['CUSTOM_VAR']);
      expect(result).not.toContain('SHELL');
    });
  });

  describe('ignorePrefixes', () => {
    it('ignores vars with specified prefix', () => {
      process.env = { FOO: 'bar', MY_PREFIX_VAR: 'value', ANOTHER: 'x' };
      const cleanedEnv = { FOO: 'bar' };

      const result = warnUnused(cleanedEnv, {
        warn: () => {},
        ignorePrefixes: ['MY_PREFIX_'],
        ignoreVariables: [],
      });

      expect(result).toEqual(['ANOTHER']);
    });

    it('ignores vars matching multiple prefixes', () => {
      process.env = {
        FOO: 'bar',
        PREFIX1_VAR: 'a',
        PREFIX2_VAR: 'b',
        UNUSED: 'c',
      };
      const cleanedEnv = { FOO: 'bar' };

      const result = warnUnused(cleanedEnv, {
        warn: () => {},
        ignorePrefixes: ['PREFIX1_', 'PREFIX2_'],
        ignoreVariables: [],
      });

      expect(result).toEqual(['UNUSED']);
    });

    it('uses DEFAULT_IGNORE_PREFIXES when ignorePrefixes not specified', () => {
      process.env = { FOO: 'bar', npm_config_test: 'value', CUSTOM_VAR: 'x' };
      const cleanedEnv = { FOO: 'bar' };

      const result = warnUnused(cleanedEnv, {
        warn: () => {},
        ignoreVariables: [],
      });

      expect(result).toEqual(['CUSTOM_VAR']);
      expect(result).not.toContain('npm_config_test');
    });
  });

  describe('warn function', () => {
    it('calls warn function with message when unused vars found', () => {
      process.env = { FOO: 'bar', UNUSED: 'value' };
      const cleanedEnv = { FOO: 'bar' };
      const warnFn = vi.fn();

      warnUnused(cleanedEnv, {
        warn: warnFn,
        ignorePrefixes: [],
        ignoreVariables: [],
      });

      expect(warnFn).toHaveBeenCalledTimes(1);
      expect(warnFn).toHaveBeenCalledWith(
        '[envalid-unused] Found 1 unused environment variable(s): UNUSED'
      );
    });

    it('does not call warn when no unused vars', () => {
      process.env = { FOO: 'bar' };
      const cleanedEnv = { FOO: 'bar' };
      const warnFn = vi.fn();

      warnUnused(cleanedEnv, {
        warn: warnFn,
        ignorePrefixes: [],
        ignoreVariables: [],
      });

      expect(warnFn).not.toHaveBeenCalled();
    });

    it('uses console.warn by default', () => {
      process.env = { UNUSED: 'value' };
      const cleanedEnv = {};
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      warnUnused(cleanedEnv, {
        ignorePrefixes: [],
        ignoreVariables: [],
      });

      expect(consoleSpy).toHaveBeenCalledTimes(1);
      consoleSpy.mockRestore();
    });

    it('includes count and list of unused vars in message', () => {
      process.env = { UNUSED1: 'a', UNUSED2: 'b', UNUSED3: 'c' };
      const cleanedEnv = {};
      const warnFn = vi.fn();

      warnUnused(cleanedEnv, {
        warn: warnFn,
        ignorePrefixes: [],
        ignoreVariables: [],
      });

      expect(warnFn).toHaveBeenCalledWith(
        '[envalid-unused] Found 3 unused environment variable(s): UNUSED1, UNUSED2, UNUSED3'
      );
    });
  });

  describe('default options', () => {
    it('uses all defaults when no options provided', () => {
      process.env = {
        DEFINED: 'value',
        SHELL: '/bin/bash',
        npm_config_test: 'x',
        CUSTOM_UNUSED: 'y',
      };
      const cleanedEnv = { DEFINED: 'value' };
      const warnFn = vi.fn();

      const result = warnUnused(cleanedEnv, { warn: warnFn });

      expect(result).toEqual(['CUSTOM_UNUSED']);
    });
  });
});

describe('DEFAULT_IGNORE_PREFIXES', () => {
  it('contains expected prefixes', () => {
    expect(DEFAULT_IGNORE_PREFIXES).toContain('npm_');
    expect(DEFAULT_IGNORE_PREFIXES).toContain('NODE_');
    expect(DEFAULT_IGNORE_PREFIXES).toContain('LC_');
    expect(DEFAULT_IGNORE_PREFIXES).toContain('SSH_');
    expect(DEFAULT_IGNORE_PREFIXES).toContain('XDG_');
    expect(DEFAULT_IGNORE_PREFIXES).toContain('DBUS_');
  });

  it('only contains prefixes (ending with underscore)', () => {
    for (const prefix of DEFAULT_IGNORE_PREFIXES) {
      expect(prefix.endsWith('_')).toBe(true);
    }
  });
});

describe('DEFAULT_IGNORE_VARIABLES', () => {
  it('contains expected variables', () => {
    expect(DEFAULT_IGNORE_VARIABLES).toContain('SHELL');
    expect(DEFAULT_IGNORE_VARIABLES).toContain('TERM');
    expect(DEFAULT_IGNORE_VARIABLES).toContain('USER');
    expect(DEFAULT_IGNORE_VARIABLES).toContain('HOME');
    expect(DEFAULT_IGNORE_VARIABLES).toContain('PATH');
    expect(DEFAULT_IGNORE_VARIABLES).toContain('PWD');
  });

  it('does not contain prefixes (items ending with underscore)', () => {
    const prefixLike = DEFAULT_IGNORE_VARIABLES.filter(
      (v) => v.endsWith('_') && v !== '_'
    );
    expect(prefixLike).toEqual([]);
  });
});
