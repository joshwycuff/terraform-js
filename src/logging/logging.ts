import { createLogger, format, transports } from 'winston';
import { config } from '../config/config';

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
    level: config.logging.level,
    format: format.combine(format.timestamp(), myFormat),
    transports: [new transports.Console()],
});
