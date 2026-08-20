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

describe('GitHub Actions environment', () => {
  const originalEnv = process.env;

  afterEach(() => {
    process.env = originalEnv;
  });

  // Sampled from a real ubuntu-latest GitHub-hosted runner
  const RUNNER_VARS = [
    'GITHUB_STATE',
    'GITHUB_ENV',
    'GITHUB_PATH',
    'GITHUB_OUTPUT',
    'GITHUB_STEP_SUMMARY',
    'GITHUB_EVENT_PATH',
    'GITHUB_WORKFLOW',
    'GITHUB_WORKFLOW_REF',
    'GITHUB_WORKFLOW_SHA',
    'GITHUB_ACTION',
    'GITHUB_ACTION_REF',
    'GITHUB_ACTION_REPOSITORY',
    'GITHUB_ACTIONS',
    'GITHUB_ACTOR',
    'GITHUB_ACTOR_ID',
    'GITHUB_TRIGGERING_ACTOR',
    'GITHUB_API_URL',
    'GITHUB_GRAPHQL_URL',
    'GITHUB_SERVER_URL',
    'GITHUB_BASE_REF',
    'GITHUB_HEAD_REF',
    'GITHUB_REF',
    'GITHUB_REF_NAME',
    'GITHUB_REF_PROTECTED',
    'GITHUB_REF_TYPE',
    'GITHUB_SHA',
    'GITHUB_JOB',
    'GITHUB_RUN_ID',
    'GITHUB_RUN_NUMBER',
    'GITHUB_RUN_ATTEMPT',
    'GITHUB_RETENTION_DAYS',
    'GITHUB_REPOSITORY',
    'GITHUB_REPOSITORY_ID',
    'GITHUB_REPOSITORY_OWNER',
    'GITHUB_REPOSITORY_OWNER_ID',
    'GITHUB_WORKSPACE',
    'GITHUB_EVENT_NAME',
    'GITHUB_ARTIFACTS',
    'GITHUB_ARTIFACTS_LIST',
    'RUNNER_OS',
    'RUNNER_ARCH',
    'RUNNER_NAME',
    'RUNNER_TEMP',
    'RUNNER_TOOL_CACHE',
    'RUNNER_TRACKING_ID',
    'RUNNER_WORKSPACE',
    'RUNNER_ENVIRONMENT',
    'ACTIONS_ORCHESTRATION_ID',
    'ACTIONS_RUNNER_ACTION_ARCHIVE_CACHE',
    'CI',
    'FORCE_COLOR',
    'ImageOS',
    'ImageVersion',
    'AGENT_TOOLSDIRECTORY',
    'DEBIAN_FRONTEND',
    'ACCEPT_EULA',
    'TZ',
    'INVOCATION_ID',
    'JOURNAL_STREAM',
    'SYSTEMD_EXEC_PID',
    'MEMORY_PRESSURE_WATCH',
    'MEMORY_PRESSURE_WRITE',
    'JAVA_HOME',
    'JAVA_HOME_8_X64',
    'JAVA_HOME_11_X64',
    'JAVA_HOME_17_X64',
    'JAVA_HOME_21_X64',
    'JAVA_HOME_25_X64',
    'GRADLE_HOME',
    'ANT_HOME',
    'CONDA',
    'NVM_DIR',
    'SWIFT_PATH',
    'GOROOT_1_24_X64',
    'GOROOT_1_25_X64',
    'GOROOT_1_26_X64',
    'DOTNET_NOLOGO',
    'DOTNET_SKIP_FIRST_TIME_EXPERIENCE',
    'DOTNET_MULTILEVEL_LOOKUP',
    'ANDROID_HOME',
    'ANDROID_NDK',
    'ANDROID_NDK_HOME',
    'ANDROID_NDK_ROOT',
    'ANDROID_NDK_LATEST_HOME',
    'ANDROID_SDK_ROOT',
    'HOMEBREW_NO_AUTO_UPDATE',
    'HOMEBREW_CLEANUP_PERIODIC_FULL_DAYS',
    'PIPX_HOME',
    'PIPX_BIN_DIR',
    'VCPKG_INSTALLATION_ROOT',
    'AZURE_EXTENSION_DIR',
    'POWERSHELL_DISTRIBUTION_CHANNEL',
    'PSModulePath',
    'BOOTSTRAP_HASKELL_NONINTERACTIVE',
    'GHCUP_INSTALL_BASE_PREFIX',
    'USE_BAZEL_FALLBACK_VERSION',
    'SGX_AESM_ADDR',
    'CHROME_BIN',
    'CHROMEWEBDRIVER',
    'GECKOWEBDRIVER',
    'EDGEWEBDRIVER',
    'SELENIUM_JAR_PATH',
    'NX_WORKSPACE_ROOT',
    'NX_TASK_HASH',
    'NX_CLI_SET',
  ];

  it('ignores the variables a GitHub-hosted runner injects', () => {
    process.env = Object.fromEntries(RUNNER_VARS.map((key) => [key, 'x']));
    const cleanedEnv = {};

    const result = warnUnused(cleanedEnv, { warn: () => {} });

    assert.deepStrictEqual(result, []);
  });

  it('still reports application variables set alongside runner variables', () => {
    process.env = {
      ...Object.fromEntries(RUNNER_VARS.map((key) => [key, 'x'])),
      API_URL: 'https://example.com',
      STRIPE_KEY: 'sk_test',
      AWS_SECRET_ACCESS_KEY: 'secret',
    };
    const cleanedEnv = { API_URL: 'https://example.com' };

    const result = warnUnused(cleanedEnv, { warn: () => {} });

    assert.deepStrictEqual(result, ['STRIPE_KEY', 'AWS_SECRET_ACCESS_KEY']);
  });
});
