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
  - `ignorePrefixes` - Array of prefixes to ignore (default: common system prefixes like `npm_`, `NODE_`, etc.)
  - `ignore` - Array of specific variable names to ignore

#### Returns

Array of unused environment variable names.

### Example with options

```typescript
const unused = warnUnused(env, {
  warn: (msg) => logger.warn(msg),
  ignorePrefixes: ['npm_', 'NODE_', 'CI_'],
  ignore: ['DEBUG', 'VERBOSE'],
});

if (unused.length > 0) {
  // Handle unused variables
}
```

### `DEFAULT_IGNORE_PREFIXES`

Export of the default prefixes that are ignored:

```typescript
import { DEFAULT_IGNORE_PREFIXES } from 'envalid-unused';

// Extend the defaults
warnUnused(env, {
  ignorePrefixes: [...DEFAULT_IGNORE_PREFIXES, 'MY_PREFIX_'],
});
```

## License

MIT
