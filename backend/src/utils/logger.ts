import { Request } from 'express';

export interface SecurityLogEvent {
  event: string;
  email?: string;
  ip?: string;
  timestamp: string;
  requestId?: string;
  details?: Record<string, unknown>;
  userAgent?: string;
}

/**
 * Security event logger
 * Logs important security events for auditing
 */
export class SecurityLogger {
  static log(event: SecurityLogEvent): void {
    console.log(JSON.stringify({
      level: 'security',
      ...event,
    }));
  }

  static logFailedLogin(email: string, req: Request, reason?: string): void {
    this.log({
      event: 'LOGIN_FAILED',
      email,
      ip: req.ip,
      timestamp: new Date().toISOString(),
      requestId: req.id,
      details: { reason },
    });
  }

  static logSuccessfulLogin(email: string, req: Request): void {
    this.log({
      event: 'LOGIN_SUCCESS',
      email,
      ip: req.ip,
      timestamp: new Date().toISOString(),
      requestId: req.id,
    });
  }

  static logPasswordReset(email: string, req: Request): void {
    this.log({
      event: 'PASSWORD_RESET_REQUESTED',
      email,
      ip: req.ip,
      timestamp: new Date().toISOString(),
      requestId: req.id,
    });
  }

  static logRegistration(email: string, req: Request): void {
    this.log({
      event: 'USER_REGISTERED',
      email,
      ip: req.ip,
      timestamp: new Date().toISOString(),
      requestId: req.id,
    });
  }

  static logAccountLockout(email: string, req: Request): void {
    this.log({
      event: 'ACCOUNT_LOCKED',
      email,
      ip: req.ip,
      timestamp: new Date().toISOString(),
      requestId: req.id,
    });
  }

  /**
   * Log detailed error information for debugging
   * Production-safe: removes sensitive data and limits stack traces
   */
  static logError(error: Error, req?: Request, context?: Record<string, unknown>): void {
    const errorInfo: Record<string, unknown> = {
      level: 'error',
      timestamp: new Date().toISOString(),
      name: error.name,
      message: error.message,
      // Only include stack traces in development
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
    };

    // Add request context if available (but filter sensitive data)
    if (req) {
      errorInfo.requestId = req.id;
      errorInfo.ip = req.ip;
      errorInfo.method = req.method;
      errorInfo.url = req.originalUrl;
      errorInfo.userAgent = req.get('User-Agent');
    }

    // Add additional context (but sanitize sensitive data)
    if (context) {
      const sanitizedContext = this.sanitizeContext(context);
      errorInfo.context = sanitizedContext;
    }

    // Handle specific error types
    if ('cause' in error && error.cause) {
      errorInfo.cause = {
        name: (error.cause as Error).name,
        message: (error.cause as Error).message,
        code: (error.cause as { code?: string }).code,
      };
    }

    // Handle Supabase/fetch errors
    if (error.name === 'AuthRetryableFetchError' || error.message === 'fetch failed') {
      errorInfo.errorType = 'SUPABASE_CONNECTION_ERROR';
      errorInfo.isRetryable = true;
      
      if ('status' in error) {
        errorInfo.httpStatus = (error as { status?: number }).status;
      }
      
      if ('code' in error) {
        errorInfo.errorCode = (error as { code?: string }).code;
      }
    }

    // Handle timeout errors specifically
    if (error.message.includes('timeout') || error.message.includes('CONNECT_TIMEOUT')) {
      errorInfo.errorType = 'CONNECTION_TIMEOUT';
      errorInfo.troubleshooting = {
        suggestions: [
          'Check network connectivity',
          'Verify Supabase URL and credentials',
          'Consider increasing timeout settings',
          'Check if Supabase service is operational'
        ]
      };
    }

    console.error(JSON.stringify(errorInfo, null, process.env.NODE_ENV === 'development' ? 2 : 0));
  }

  /**
   * Sanitize context to remove sensitive information
   */
  private static sanitizeContext(context: Record<string, unknown>): Record<string, unknown> {
    const sanitized: Record<string, unknown> = {};
    const sensitiveKeys = ['password', 'token', 'secret', 'key', 'auth', 'credential'];
    
    Object.entries(context).forEach(([key, value]) => {
      const keyLower = key.toLowerCase();
      const hasSensitiveKey = sensitiveKeys.some(sensitive => keyLower.includes(sensitive));
      
      if (hasSensitiveKey) {
        sanitized[key] = '[REDACTED]';
      } else if (typeof value === 'string' && value.length > 100) {
        // Truncate very long strings
        sanitized[key] = `${value.substring(0, 100)}... [TRUNCATED]`;
      } else {
        sanitized[key] = value;
      }
    });
    
    return sanitized;
  }

  /**
   * Log security-related suspicious activity
   */
  static logSecurityEvent(event: string, req: Request, details?: Record<string, unknown>): void {
    this.log({
      event: `SECURITY_${event}`,
      ip: req.ip,
      timestamp: new Date().toISOString(),
      requestId: req.id,
      userAgent: req.get('User-Agent'),
      details: details ? this.sanitizeContext(details) : undefined,
    });
  }

  static warn(message: string, context?: Record<string, unknown>): void {
    console.warn(JSON.stringify({
      level: 'warn',
      timestamp: new Date().toISOString(),
      message,
      context: context ? this.sanitizeContext(context) : undefined,
    }));
  }

  /**
   * Log failed registration attempts with full error context
   */
  static logRegistrationError(email: string, error: Error, req: Request): void {
    this.log({
      event: 'REGISTRATION_FAILED',
      email,
      ip: req.ip,
      timestamp: new Date().toISOString(),
      requestId: req.id,
      details: {
        errorName: error.name,
        errorCode: (error as { code?: string }).code,
        isRetryable: error.name === 'AuthRetryableFetchError' || error.message === 'fetch failed',
        // Only include error message in development
        ...(process.env.NODE_ENV === 'development' && { errorMessage: error.message })
      },
    });

    // Also log the full error details using secure method
    this.logError(error, req, { operation: 'registration', email });
  }
}
