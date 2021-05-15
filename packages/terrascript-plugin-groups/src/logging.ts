import { createLogger, format, transports } from 'winston';
import { config, IConfig, NAMESPACE } from './config';

const LOG_LEVELS = new Map([
  ['error', 0],
  ['warn', 1],
  ['info', 2],
  ['http', 3],
  ['verbose', 4],
  ['debug', 5],
  ['silly', 6],
]);

const LOG_LEVELS_INVERSE = new Map([
  [0, 'error'],
  [1, 'warn'],
  [2, 'info'],
  [3, 'http'],
  [4, 'verbose'],
  [5, 'debug'],
  [6, 'silly'],
]);

/**
 * @param info
 * @param opts
 */
const myFormat = format.printf(({
  level,
  message,
  label,
  timestamp,
}) => {
  if (label) {
    return `${timestamp} [${level.toUpperCase()}] (${label}) ${message}`;
  }
  return `${timestamp} [${level.toUpperCase()}] ${message}`;
});

export const log = createLogger({
  level: 'warn',
  format: format.combine(format.timestamp(), format.label({ label: NAMESPACE }), myFormat),
  transports: [new transports.Console()],
});

/**
 * @param level
 */
function updateLogLevel(level: string | number) {
  if (typeof level === 'number') {
    log.level = LOG_LEVELS_INVERSE.get(level) || 'warn';
  } else {
    log.level = level;
  }
}

/**
 * @param config
 * @param conf
 */
function updateLogLevelFromConfig(conf: IConfig) {
  let level = 0;
  if (conf.error) {
    level = LOG_LEVELS.get('error')!;
  }
  if (conf.warn) {
    level = LOG_LEVELS.get('warn')!;
  }
  if (conf.info) {
    level = LOG_LEVELS.get('info')!;
  }
  if (conf.verbose) {
    level = LOG_LEVELS.get('verbose')!;
  }
  if (conf.debug) {
    level = LOG_LEVELS.get('debug')!;
  }
  if (conf.silly) {
    level = LOG_LEVELS.get('silly')!;
  }
  level = Math.max(level, LOG_LEVELS.get(conf.logLevel) || 0);
  updateLogLevel(level);
}

updateLogLevelFromConfig(config.peek());
config.onChange((conf) => {
  updateLogLevelFromConfig(conf);
});
