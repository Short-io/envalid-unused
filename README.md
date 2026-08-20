# envalid-unused

Detect unused environment variables by comparing `process.env` with envalid's `cleanEnv` result.

## Installation

```bash
npm install envalid-unused
```

## Usage

```typescript
import { cleanEnv, str, num } from 'envalid';
import { warnUnused } from 'envalid-unused';

const env = cleanEnv(process.env, {
  API_URL: str(),
  PORT: num(),
});

// Warn about any env variables not defined in the schema
warnUnused(env);
// Output: [envalid-unused] Found 2 unused environment variable(s): DATABASE_URL, SECRET_KEY
```

## API

### `warnUnused(cleanedEnv, options?)`

#### Parameters

- `cleanedEnv` - The result from envalid's `cleanEnv` function
- `options` - Optional configuration object:
  - `warn` - Custom warning function (default: `console.warn`)
  - `ignorePrefixes` - Array of prefixes to ignore (default: `DEFAULT_IGNORE_PREFIXES`)
  - `ignoreVariables` - Array of exact variable names to ignore (default: `DEFAULT_IGNORE_VARIABLES`)

Both defaults already cover shell/OS variables, Node and package-manager variables, and
everything a GitHub Actions runner injects (`GITHUB_*`, `RUNNER_*`, `ACTIONS_*`, `CI`,
preinstalled toolchain paths such as `JAVA_HOME_*`, `ANDROID_*`, `GOROOT_*`, ...), so
`warnUnused` stays quiet in CI unless your own variables really are unused.

Note that passing either option **replaces** the corresponding default list rather than
extending it - spread the exported default in if you want to keep it.

#### Returns

Array of unused environment variable names.

### Example with options

```typescript
import { DEFAULT_IGNORE_PREFIXES, DEFAULT_IGNORE_VARIABLES } from 'envalid-unused';

const unused = warnUnused(env, {
  warn: (msg) => logger.warn(msg),
  ignorePrefixes: [...DEFAULT_IGNORE_PREFIXES, 'MY_APP_'],
  ignoreVariables: [...DEFAULT_IGNORE_VARIABLES, 'DEBUG', 'VERBOSE'],
});

if (unused.length > 0) {
  // Handle unused variables
}
```

### `DEFAULT_IGNORE_PREFIXES` / `DEFAULT_IGNORE_VARIABLES`

Exports of the prefixes and exact names that are ignored by default:

```typescript
import { DEFAULT_IGNORE_PREFIXES, DEFAULT_IGNORE_VARIABLES } from 'envalid-unused';

// Extend the defaults
warnUnused(env, {
  ignorePrefixes: [...DEFAULT_IGNORE_PREFIXES, 'MY_PREFIX_'],
  ignoreVariables: [...DEFAULT_IGNORE_VARIABLES, 'MY_VAR'],
});
```

## License

MIT
