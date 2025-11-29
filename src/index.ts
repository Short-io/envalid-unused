export interface WarnUnusedOptions {
  /** Custom warning function. Defaults to console.warn */
  warn?: (message: string) => void;
  /** List of env variable prefixes to ignore (e.g., ['npm_', 'NODE_']) */
  ignorePrefixes?: string[];
  /** List of specific env variable names to ignore */
  ignoreVariables?: string[];
}

const DEFAULT_IGNORE_PREFIXES = [
  'npm_',
  'NODE_',
  'LC_',
  'SSH_',
  'XDG_',
  'DBUS_',
];

const DEFAULT_IGNORE_VARIABLES = [
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
