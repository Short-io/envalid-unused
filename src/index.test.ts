import { describe, it, beforeEach, afterEach, mock } from 'node:test';
import assert from 'node:assert';
import {
  warnUnused,
  DEFAULT_IGNORE_PREFIXES,
  DEFAULT_IGNORE_VARIABLES,
} from './index.ts';

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

    assert.deepStrictEqual(result, []);
  });

  it('returns unused env vars not in schema', () => {
    process.env = { FOO: 'bar', UNUSED_VAR: 'value' };
    const cleanedEnv = { FOO: 'bar' };

    const result = warnUnused(cleanedEnv, {
      warn: () => {},
      ignorePrefixes: [],
      ignoreVariables: [],
    });

    assert.deepStrictEqual(result, ['UNUSED_VAR']);
  });

  it('returns multiple unused env vars', () => {
    process.env = { FOO: 'bar', UNUSED1: 'a', UNUSED2: 'b' };
    const cleanedEnv = { FOO: 'bar' };

    const result = warnUnused(cleanedEnv, {
      warn: () => {},
      ignorePrefixes: [],
      ignoreVariables: [],
    });

    assert.deepStrictEqual(result, ['UNUSED1', 'UNUSED2']);
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

      assert.deepStrictEqual(result, ['ANOTHER']);
    });

    it('ignores multiple exact variable names', () => {
      process.env = { FOO: 'bar', IGNORED1: 'a', IGNORED2: 'b', UNUSED: 'c' };
      const cleanedEnv = { FOO: 'bar' };

      const result = warnUnused(cleanedEnv, {
        warn: () => {},
        ignorePrefixes: [],
        ignoreVariables: ['IGNORED1', 'IGNORED2'],
      });

      assert.deepStrictEqual(result, ['UNUSED']);
    });

    it('uses DEFAULT_IGNORE_VARIABLES when ignoreVariables not specified', () => {
      process.env = { FOO: 'bar', SHELL: '/bin/bash', CUSTOM_VAR: 'value' };
      const cleanedEnv = { FOO: 'bar' };

      const result = warnUnused(cleanedEnv, {
        warn: () => {},
        ignorePrefixes: [],
      });

      assert.deepStrictEqual(result, ['CUSTOM_VAR']);
      assert.ok(!result.includes('SHELL'));
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

      assert.deepStrictEqual(result, ['ANOTHER']);
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

      assert.deepStrictEqual(result, ['UNUSED']);
    });

    it('uses DEFAULT_IGNORE_PREFIXES when ignorePrefixes not specified', () => {
      process.env = { FOO: 'bar', npm_config_test: 'value', CUSTOM_VAR: 'x' };
      const cleanedEnv = { FOO: 'bar' };

      const result = warnUnused(cleanedEnv, {
        warn: () => {},
        ignoreVariables: [],
      });

      assert.deepStrictEqual(result, ['CUSTOM_VAR']);
      assert.ok(!result.includes('npm_config_test'));
    });
  });

  describe('warn function', () => {
    it('calls warn function with message when unused vars found', () => {
      process.env = { FOO: 'bar', UNUSED: 'value' };
      const cleanedEnv = { FOO: 'bar' };
      const warnFn = mock.fn();

      warnUnused(cleanedEnv, {
        warn: warnFn,
        ignorePrefixes: [],
        ignoreVariables: [],
      });

      assert.strictEqual(warnFn.mock.callCount(), 1);
      assert.strictEqual(
        warnFn.mock.calls[0].arguments[0],
        '[envalid-unused] Found 1 unused environment variable(s): UNUSED'
      );
    });

    it('does not call warn when no unused vars', () => {
      process.env = { FOO: 'bar' };
      const cleanedEnv = { FOO: 'bar' };
      const warnFn = mock.fn();

      warnUnused(cleanedEnv, {
        warn: warnFn,
        ignorePrefixes: [],
        ignoreVariables: [],
      });

      assert.strictEqual(warnFn.mock.callCount(), 0);
    });

    it('uses console.warn by default', () => {
      process.env = { UNUSED: 'value' };
      const cleanedEnv = {};
      const originalWarn = console.warn;
      const consoleSpy = mock.fn();
      console.warn = consoleSpy;

      try {
        warnUnused(cleanedEnv, {
          ignorePrefixes: [],
          ignoreVariables: [],
        });

        assert.strictEqual(consoleSpy.mock.callCount(), 1);
      } finally {
        console.warn = originalWarn;
      }
    });

    it('includes count and list of unused vars in message', () => {
      process.env = { UNUSED1: 'a', UNUSED2: 'b', UNUSED3: 'c' };
      const cleanedEnv = {};
      const warnFn = mock.fn();

      warnUnused(cleanedEnv, {
        warn: warnFn,
        ignorePrefixes: [],
        ignoreVariables: [],
      });

      assert.strictEqual(
        warnFn.mock.calls[0].arguments[0],
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
      const warnFn = mock.fn();

      const result = warnUnused(cleanedEnv, { warn: warnFn });

      assert.deepStrictEqual(result, ['CUSTOM_UNUSED']);
    });
  });
});

describe('DEFAULT_IGNORE_PREFIXES', () => {
  it('contains expected prefixes', () => {
    assert.ok(DEFAULT_IGNORE_PREFIXES.includes('npm_'));
    assert.ok(DEFAULT_IGNORE_PREFIXES.includes('NODE_'));
    assert.ok(DEFAULT_IGNORE_PREFIXES.includes('LC_'));
    assert.ok(DEFAULT_IGNORE_PREFIXES.includes('SSH_'));
    assert.ok(DEFAULT_IGNORE_PREFIXES.includes('XDG_'));
    assert.ok(DEFAULT_IGNORE_PREFIXES.includes('DBUS_'));
  });

  it('only contains prefixes (ending with underscore)', () => {
    for (const prefix of DEFAULT_IGNORE_PREFIXES) {
      assert.ok(prefix.endsWith('_'), `${prefix} should end with underscore`);
    }
  });
});

describe('DEFAULT_IGNORE_VARIABLES', () => {
  it('contains expected variables', () => {
    assert.ok(DEFAULT_IGNORE_VARIABLES.includes('SHELL'));
    assert.ok(DEFAULT_IGNORE_VARIABLES.includes('TERM'));
    assert.ok(DEFAULT_IGNORE_VARIABLES.includes('USER'));
    assert.ok(DEFAULT_IGNORE_VARIABLES.includes('HOME'));
    assert.ok(DEFAULT_IGNORE_VARIABLES.includes('PATH'));
    assert.ok(DEFAULT_IGNORE_VARIABLES.includes('PWD'));
  });

  it('does not contain prefixes (items ending with underscore)', () => {
    const prefixLike = DEFAULT_IGNORE_VARIABLES.filter(
      (v) => v.endsWith('_') && v !== '_'
    );
    assert.deepStrictEqual(prefixLike, []);
  });
});
