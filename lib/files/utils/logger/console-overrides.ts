import { AppLogger } from './app-logger.service';

/**
 * Original console methods (stored before override)
 */
const originalConsole = {
  log: console.log.bind(console) as typeof console.log,
  info: console.info.bind(console) as typeof console.info,
  warn: console.warn.bind(console) as typeof console.warn,
  error: console.error.bind(console) as typeof console.error,
  debug: console.debug.bind(console) as typeof console.debug,
  trace: console.trace.bind(console) as typeof console.trace,
};

/**
 * Initialize console overrides to route all console.* calls through Winston
 * This should be called early in the application bootstrap, after AppLogger is available
 */
export function initializeConsoleOverrides(logger: AppLogger): void {
  // Override console.log -> Winston info
  console.log = (...args: unknown[]): void => {
    try {
      const message = formatConsoleArgs(args);
      logger.log(message, 'Console');
    } catch {
      // Fallback to original console if logging fails (should not crash the app)
      originalConsole.log(...args);
    }
  };

  // Override console.info -> Winston info
  console.info = (...args: unknown[]): void => {
    try {
      const message = formatConsoleArgs(args);
      logger.log(message, 'Console');
    } catch {
      originalConsole.info(...args);
    }
  };

  // Override console.warn -> Winston warn
  console.warn = (...args: unknown[]): void => {
    try {
      const message = formatConsoleArgs(args);
      logger.warn(message, 'Console');
    } catch {
      originalConsole.warn(...args);
    }
  };

  // Override console.error -> Winston error
  console.error = (...args: unknown[]): void => {
    try {
      const message = formatConsoleArgs(args);
      // Try to extract stack trace from Error objects
      const stack = args.find(arg => arg instanceof Error)?.stack;
      logger.error(message, stack, 'Console');
    } catch {
      originalConsole.error(...args);
    }
  };

  // Override console.debug -> Winston debug
  console.debug = (...args: unknown[]): void => {
    try {
      const message = formatConsoleArgs(args);
      logger.debug(message, 'Console');
    } catch {
      originalConsole.debug(...args);
    }
  };

  // Override console.trace -> Winston verbose (with stack)
  console.trace = (...args: unknown[]): void => {
    try {
      const message = formatConsoleArgs(args);
      // Generate stack trace for trace calls
      const stack = new Error().stack;
      logger.error(message, stack, 'Console');
    } catch {
      originalConsole.trace(...args);
    }
  };
}

/**
 * Format console arguments into a single message string
 */
function formatConsoleArgs(args: unknown[]): string {
  if (args.length === 0) {
    return '';
  }

  if (args.length === 1) {
    return formatSingleArg(args[0]);
  }

  return args.map(arg => formatSingleArg(arg)).join(' ');
}

/**
 * Format a single argument for logging
 */
function formatSingleArg(arg: unknown): string {
  if (arg === null) {
    return 'null';
  }

  if (arg === undefined) {
    return 'undefined';
  }

  if (typeof arg === 'string') {
    return arg;
  }

  if (typeof arg === 'number' || typeof arg === 'boolean') {
    return String(arg);
  }

  if (arg instanceof Error) {
    return `${arg.name}: ${arg.message}`;
  }

  if (typeof arg === 'object') {
    try {
      return JSON.stringify(arg, null, 2);
    } catch {
      const constructorName =
        arg &&
        typeof arg === 'object' &&
        'constructor' in arg &&
        arg.constructor &&
        typeof arg.constructor === 'function' &&
        'name' in arg.constructor
          ? (arg.constructor as { name?: string }).name
          : undefined;
      return `[object ${constructorName || 'Object'}]`;
    }
  }

  // For other types (symbol, function, etc.), convert safely
  if (typeof arg === 'symbol') {
    return arg.toString();
  }
  if (typeof arg === 'function') {
    return `[Function: ${arg.name || 'anonymous'}]`;
  }
  // For any other type, try JSON.stringify first, then fallback
  try {
    if (arg != null && typeof arg === 'object') {
      return JSON.stringify(arg);
    }
    // For primitives (number, boolean, bigint), convert safely
    if (typeof arg === 'number' || typeof arg === 'boolean' || typeof arg === 'bigint') {
      return String(arg);
    }
    // For undefined or null, handle explicitly
    if (arg === null || arg === undefined) {
      return String(arg);
    }
    // Final fallback - if we get here, arg is some other type
    // Use a safe representation
    return '[object Unknown]';
  } catch {
    return '[object Unknown]';
  }
}
