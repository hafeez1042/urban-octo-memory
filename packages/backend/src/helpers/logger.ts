import * as winston from "winston";

const transports: winston.transport[] = [];

transports.push(
  new winston.transports.Console({
    level: "info",
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    ),
  })
);

export const logger = winston.createLogger({
  transports,
});
