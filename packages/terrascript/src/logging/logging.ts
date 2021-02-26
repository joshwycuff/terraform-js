import { createLogger, format, transports } from 'winston';

/**
 * @param info
 * @param opts
 */
const myFormat = format.printf(({ level, message, label, timestamp }) => {
    if (label) {
        return `${timestamp} [${level.toUpperCase()}] ${label} ${message}`;
    }
    return `${timestamp} [${level.toUpperCase()}] ${message}`;
});

export const log = createLogger({
    level: 'warn',
    format: format.combine(format.timestamp(), myFormat),
    transports: [new transports.Console()],
});

/**
 * @param level
 */
export function updateLogLevel(level: string) {
    log.level = level;
}
