export interface WarnUnusedOptions {
  /** Custom warning function. Defaults to console.warn */
  warn?: (message: string) => void;
  /** List of env variable prefixes to ignore (e.g., ['npm_', 'NODE_']) */
  ignorePrefixes?: string[];
  /** List of specific env variable names to ignore */
  ignoreVariables?: string[];
}

const DEFAULT_IGNORE_PREFIXES = [
  // Node.js / package managers
  'npm_',
  'NODE_',
  'PNPM_',
  'pnpm_',
  'YARN_',
  'COREPACK_',
  // Shell / OS
  'LC_',
  'SSH_',
  'XDG_',
  'DBUS_',
  'MEMORY_PRESSURE_',
  // GitHub Actions runner
  'GITHUB_',
  'RUNNER_',
  'ACTIONS_',
  // Toolchains preinstalled on CI runner images
  'ANDROID_',
  'DOTNET_',
  'GOROOT_',
  'JAVA_HOME_',
  'HOMEBREW_',
  'PIPX_',
  'NX_',
];

const DEFAULT_IGNORE_VARIABLES = [
  // Shell / OS
  'SHELL',
  'TERM',
  'USER',
  'HOME',
  'PATH',
  'PWD',
  'LANG',
  'DISPLAY',
  'COLORTERM',
  'EDITOR',
  'VISUAL',
  'PAGER',
  'LESS',
  'HOSTNAME',
  'LOGNAME',
  'MAIL',
  'OLDPWD',
  'SHLVL',
  '_',
  'TZ',
  // systemd (present when the process is started by a unit, incl. CI runners)
  'INVOCATION_ID',
  'JOURNAL_STREAM',
  'SYSTEMD_EXEC_PID',
  // Node.js / package managers
  'INIT_CWD',
  'NODE',
  // CI
  'CI',
  'FORCE_COLOR',
  'ImageOS',
  'ImageVersion',
  'AGENT_TOOLSDIRECTORY',
  'DEBIAN_FRONTEND',
  'ACCEPT_EULA',
  // Toolchains preinstalled on CI runner images
  'JAVA_HOME',
  'GRADLE_HOME',
  'ANT_HOME',
  'CONDA',
  'NVM_DIR',
  'SWIFT_PATH',
  'VCPKG_INSTALLATION_ROOT',
  'AZURE_EXTENSION_DIR',
  'POWERSHELL_DISTRIBUTION_CHANNEL',
  'PSModulePath',
  'BOOTSTRAP_HASKELL_NONINTERACTIVE',
  'GHCUP_INSTALL_BASE_PREFIX',
  'USE_BAZEL_FALLBACK_VERSION',
  'SGX_AESM_ADDR',
  // Browsers / drivers preinstalled on CI runner images
  'CHROME_BIN',
  'CHROMEWEBDRIVER',
  'GECKOWEBDRIVER',
  'EDGEWEBDRIVER',
  'SELENIUM_JAR_PATH',
];

/**
 * Warns about environment variables that exist in process.env
 * but were not defined in envalid's cleanEnv schema.
 *
 * @param cleanedEnv - The result from envalid's cleanEnv function
 * @param options - Configuration options
 * @returns Array of unused environment variable names
 */
export function warnUnused<T extends object>(
  cleanedEnv: T,
  options: WarnUnusedOptions = {}
): string[] {
  const {
    warn = console.warn,
    ignorePrefixes = DEFAULT_IGNORE_PREFIXES,
    ignoreVariables = DEFAULT_IGNORE_VARIABLES,
  } = options;

  const definedKeys = new Set(Object.keys(cleanedEnv));
  const processEnvKeys = Object.keys(process.env);
  const ignoreVariablesSet = new Set(ignoreVariables);

  const unusedKeys = processEnvKeys.filter((key) => {
    if (definedKeys.has(key)) return false;
    if (ignoreVariablesSet.has(key)) return false;
    if (ignorePrefixes.some((prefix) => key.startsWith(prefix))) return false;
    return true;
  });

  if (unusedKeys.length > 0) {
    const message = '[envalid-unused] Found ' + unusedKeys.length + ' unused environment variable(s): ' + unusedKeys.join(', ');
    warn(message);
  }

  return unusedKeys;
}

/**
 * Default ignore prefixes for common system environment variables
 */
export { DEFAULT_IGNORE_PREFIXES };

/**
 * Default ignore variables for common system environment variables
 */
export { DEFAULT_IGNORE_VARIABLES };
