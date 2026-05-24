import { Injectable } from "@angular/core";
import { environment } from "../../../environments/environment.development";

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3
}

@Injectable({ providedIn: 'root' })
export class LoggerService {
  private isEnabled: boolean = !environment.production;
  private logLevel: LogLevel = LogLevel.DEBUG;

  constructor() {
    if (environment.hasOwnProperty('enableLogging')) {
      this.isEnabled = (environment as any).enableLogging;
    }

    if (environment.hasOwnProperty('logLevel')) {
      this.logLevel = (environment as any).logLevel;
    }
  }

  debug(message: any, ...params: any[]): void {
    this.log(LogLevel.DEBUG, message, ...params);
  }

  info(message: any, ...params: any[]): void {
    this.log(LogLevel.INFO, message, ...params);
  }

  warn(message: any, ...params: any[]): void {
    this.log(LogLevel.WARN, message, ...params);
  }

  error(message: any, ...params: any[]): void {
    console.error(message, ...params);
  }

  private log(level: LogLevel, message: any, ...params: any[]): void {
    if (!this.isEnabled || level < this.logLevel) return;

    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${LogLevel[level]}]`;

    switch (level) {
      case LogLevel.DEBUG: console.log(prefix, message, ...params); break;
      case LogLevel.INFO: console.info(prefix, message, ...params); break;
      case LogLevel.WARN: console.warn(prefix, message, ...params); break;
      case LogLevel.ERROR: console.error(prefix, message, ...params); break;
    }
  }
}