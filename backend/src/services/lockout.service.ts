/**
 * Account Lockout Service
 * Prevents brute force attacks by tracking failed login attempts
 * 
 * NOTE: This uses in-memory storage. For production with multiple servers,
 * use Redis or a database to share state across instances.
 */
class LockoutService {
  private failedAttempts: Map<string, { count: number; lockedUntil?: Date }>;
  private readonly MAX_ATTEMPTS = 5;
  private readonly LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

  constructor() {
    this.failedAttempts = new Map();
    // Clean up old entries every hour
    setInterval(() => this.cleanup(), 60 * 60 * 1000);
  }

  /**
   * Check if an account is locked
   */
  isLocked(identifier: string): boolean {
    const record = this.failedAttempts.get(identifier);
    
    if (!record || !record.lockedUntil) {
      return false;
    }

    // Check if lockout period has expired
    if (new Date() > record.lockedUntil) {
      this.failedAttempts.delete(identifier);
      return false;
    }

    return true;
  }

  /**
   * Record a failed login attempt
   * Returns true if account should be locked
   */
  recordFailedAttempt(identifier: string): boolean {
    const record = this.failedAttempts.get(identifier) || { count: 0 };
    
    record.count += 1;

    if (record.count >= this.MAX_ATTEMPTS) {
      record.lockedUntil = new Date(Date.now() + this.LOCKOUT_DURATION_MS);
      this.failedAttempts.set(identifier, record);
      return true;
    }

    this.failedAttempts.set(identifier, record);
    return false;
  }

  /**
   * Clear failed attempts on successful login
   */
  clearAttempts(identifier: string): void {
    this.failedAttempts.delete(identifier);
  }

  /**
   * Get remaining lockout time in minutes
   */
  getRemainingLockoutTime(identifier: string): number {
    const record = this.failedAttempts.get(identifier);
    
    if (!record || !record.lockedUntil) {
      return 0;
    }

    const remaining = record.lockedUntil.getTime() - Date.now();
    return Math.ceil(remaining / 60000); // Convert to minutes
  }

  /**
   * Get current failed attempt count for an identifier
   */
  getFailedAttempts(identifier: string): number {
    const record = this.failedAttempts.get(identifier);
    return record ? record.count : 0;
  }

  /**
   * Clean up expired entries
   */
  private cleanup(): void {
    const now = new Date();
    for (const [identifier, record] of this.failedAttempts.entries()) {
      if (record.lockedUntil && now > record.lockedUntil) {
        this.failedAttempts.delete(identifier);
      }
    }
  }
}

export default new LockoutService();
