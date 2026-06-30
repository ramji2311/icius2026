import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class SecurityLogger {
    constructor() {
        this.logDir = path.join(__dirname, '..', 'logs');
        this.securityLogFile = path.join(this.logDir, 'security.log');
        this.accessLogFile = path.join(this.logDir, 'access.log');
        this.errorLogFile = path.join(this.logDir, 'error.log');
        
        // Ensure log directory exists
        this.ensureLogDirectory();
    }

    ensureLogDirectory() {
        // Skip file system operations in serverless environment
        if (process.env.NODE_ENV === 'production' && process.env.VERCEL) {
            return; // Don't create directories in Vercel
        }
        
        if (!fs.existsSync(this.logDir)) {
            fs.mkdirSync(this.logDir, { recursive: true });
        }
    }

    // Format timestamp
    getTimestamp() {
        return new Date().toISOString();
    }

    // Get client IP address
    getClientIP(req) {
        return req.ip || 
               req.connection.remoteAddress || 
               req.socket.remoteAddress ||
               (req.connection.socket ? req.connection.socket.remoteAddress : null) ||
               'unknown';
    }

    // Get user agent
    getUserAgent(req) {
        return req.get('user-agent') || 'unknown';
    }

    // Sanitize sensitive data for logging
    sanitizeForLogging(data) {
        if (!data || typeof data !== 'object') return data;
        
        const sensitiveFields = [
            'password', 'token', 'secret', 'key', 'authorization',
            'cookie', 'session', 'csrf', 'otp', 'resetPasswordOTP'
        ];
        
        const sanitized = { ...data };
        
        const sanitizeValue = (obj, path = '') => {
            if (typeof obj !== 'object' || obj === null) return obj;
            
            const result = Array.isArray(obj) ? [...obj] : { ...obj };
            
            Object.keys(result).forEach(key => {
                const currentPath = path ? `${path}.${key}` : key;
                const lowerKey = key.toLowerCase();
                
                if (sensitiveFields.some(field => lowerKey.includes(field))) {
                    result[key] = '[REDACTED]';
                } else if (typeof result[key] === 'object' && result[key] !== null) {
                    result[key] = sanitizeValue(result[key], currentPath);
                }
            });
            
            return result;
        };
        
        return sanitizeValue(sanitized);
    }

    // Write to log file
    writeToFile(logFile, message) {
        // Skip file operations in serverless environment - use console.log instead
        if (process.env.NODE_ENV === 'production' && process.env.VERCEL) {
            console.log(`[SECURITY_LOG] ${message}`);
            return;
        }
        
        // Use asynchronous append to avoid blocking the event loop
        fs.appendFile(logFile, message + '\n', (err) => {
            if (err) console.error('Failed to write to log file:', err);
        });
    }

    // Log security events
    logSecurityEvent(event, details = {}, severity = 'info', req = null) {
        const timestamp = this.getTimestamp();
        const logEntry = {
            timestamp,
            type: 'SECURITY',
            event,
            severity: severity.toUpperCase(),
            details: this.sanitizeForLogging(details)
        };

        // Add request information if available
        if (req) {
            logEntry.request = {
                ip: this.getClientIP(req),
                method: req.method,
                url: req.url,
                userAgent: this.getUserAgent(req),
                referer: req.get('referer') || 'none'
            };
        }

        const logMessage = JSON.stringify(logEntry);
        
        // Always log to console
        const emoji = severity === 'critical' ? '🚨' : severity === 'high' ? '⚠️' : severity === 'medium' ? '⚡' : 'ℹ️';
        console.log(`${emoji} [SECURITY-${severity.toUpperCase()}] ${event}`, this.sanitizeForLogging(details));
        
        // Write to security log file
        this.writeToFile(this.securityLogFile, logMessage);
        
        // In production, you might want to send critical events to external monitoring
        if (process.env.NODE_ENV === 'production' && (severity === 'critical' || severity === 'high')) {
            this.sendToExternalMonitoring(logEntry);
        }
    }

    // Log access events
    logAccessEvent(req, res, responseTime = null) {
        const timestamp = this.getTimestamp();
        const logEntry = {
            timestamp,
            type: 'ACCESS',
            request: {
                ip: this.getClientIP(req),
                method: req.method,
                url: req.url,
                userAgent: this.getUserAgent(req),
                referer: req.get('referer') || 'none'
            },
            response: {
                statusCode: res.statusCode,
                responseTime: responseTime ? `${responseTime}ms` : null
            }
        };

        // Add user information if authenticated
        if (req.user) {
            logEntry.user = {
                userId: req.user.userId,
                email: req.user.email,
                role: req.user.role
            };
        }

        const logMessage = JSON.stringify(logEntry);
        this.writeToFile(this.accessLogFile, logMessage);
    }

    // Log error events
    logError(error, req = null, context = {}) {
        const timestamp = this.getTimestamp();
        const logEntry = {
            timestamp,
            type: 'ERROR',
            error: {
                message: error.message,
                stack: error.stack,
                name: error.name
            },
            context
        };

        if (req) {
            logEntry.request = {
                ip: this.getClientIP(req),
                method: req.method,
                url: req.url,
                userAgent: this.getUserAgent(req)
            };
        }

        const logMessage = JSON.stringify(logEntry);
        console.error('❌ [ERROR]', error.message);
        this.writeToFile(this.errorLogFile, logMessage);
    }

    // Send to external monitoring service
    async sendToExternalMonitoring(logEntry) {
        if (!process.env.SECURITY_WEBHOOK_URL) return;

        try {
            await fetch(process.env.SECURITY_WEBHOOK_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'User-Agent': 'SecurityLogger/1.0'
                },
                body: JSON.stringify(logEntry)
            });
        } catch (error) {
            console.error('Failed to send security event to external monitoring:', error);
        }
    }

    // Get recent security events
    getRecentSecurityEvents(limit = 100) {
        try {
            if (!fs.existsSync(this.securityLogFile)) {
                return [];
            }

            const content = fs.readFileSync(this.securityLogFile, 'utf8');
            const lines = content.trim().split('\n').filter(line => line);
            const events = lines.map(line => {
                try {
                    return JSON.parse(line);
                } catch {
                    return null;
                }
            }).filter(event => event !== null);

            return events.slice(-limit);
        } catch (error) {
            console.error('Failed to read security log:', error);
            return [];
        }
    }

    // Get security statistics
    getSecurityStats() {
        const events = this.getRecentSecurityEvents(1000);
        const stats = {
            total: events.length,
            bySeverity: {},
            byEvent: {},
            last24h: 0,
            uniqueIPs: new Set()
        };

        const now = new Date();
        const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);

        events.forEach(event => {
            // Count by severity
            const severity = event.severity || 'unknown';
            stats.bySeverity[severity] = (stats.bySeverity[severity] || 0) + 1;

            // Count by event type
            const eventType = event.event || 'unknown';
            stats.byEvent[eventType] = (stats.byEvent[eventType] || 0) + 1;

            // Count last 24h
            const eventTime = new Date(event.timestamp);
            if (eventTime > last24h) {
                stats.last24h++;
            }

            // Count unique IPs
            if (event.request && event.request.ip) {
                stats.uniqueIPs.add(event.request.ip);
            }
        });

        stats.uniqueIPs = stats.uniqueIPs.size;
        return stats;
    }

    // Clean old log files
    cleanOldLogs(daysToKeep = 30) {
        try {
            const files = fs.readdirSync(this.logDir);
            const cutoffTime = Date.now() - (daysToKeep * 24 * 60 * 60 * 1000);

            files.forEach(file => {
                const filePath = path.join(this.logDir, file);
                const stats = fs.statSync(filePath);
                
                if (stats.mtime.getTime() < cutoffTime) {
                    fs.unlinkSync(filePath);
                    console.log(`🗑️ Deleted old log file: ${file}`);
                }
            });
        } catch (error) {
            console.error('Failed to clean old logs:', error);
        }
    }
}

// Create singleton instance
const securityLogger = new SecurityLogger();

// Express middleware for request logging
// OPTIMIZED: Skip disk logging for common successful GET requests to save I/O
export const requestLogger = (req, res, next) => {
    // We only log to disk for mutations (POST, PUT, DELETE) or errors
    // Successful GET requests are only logged in development console
    const startTime = Date.now();
    
    res.on('finish', () => {
        const responseTime = Date.now() - startTime;
        const isMutation = !['GET', 'HEAD', 'OPTIONS'].includes(req.method);
        const isError = res.statusCode >= 400;

        if (isMutation || isError || process.env.NODE_ENV === 'development') {
            securityLogger.logAccessEvent(req, res, responseTime);
        }
    });
    
    next();
};

// Convenience functions for common security events
export const logFailedLogin = (email, ip, userAgent, reason = 'invalid_credentials') => {
    securityLogger.logSecurityEvent('FAILED_LOGIN', {
        email,
        reason,
        timestamp: new Date().toISOString()
    }, 'medium', { ip, method: 'POST', url: '/api/auth/login', headers: { 'user-agent': userAgent } });
};

export const logSuspiciousActivity = (activity, details, req, severity = 'medium') => {
    securityLogger.logSecurityEvent('SUSPICIOUS_ACTIVITY', {
        activity,
        ...details
    }, severity, req);
};

export const logUnauthorizedAccess = (resource, req) => {
    securityLogger.logSecurityEvent('UNAUTHORIZED_ACCESS', {
        resource,
        attemptedAction: req.method,
        url: req.url
    }, 'high', req);
};

export const logDataBreach = (dataType, affectedRecords, req) => {
    securityLogger.logSecurityEvent('DATA_BREACH', {
        dataType,
        affectedRecords,
        severity: 'critical'
    }, 'critical', req);
};

export const logRateLimitExceeded = (ip, endpoint, limit) => {
    securityLogger.logSecurityEvent('RATE_LIMIT_EXCEEDED', {
        endpoint,
        limit,
        timestamp: new Date().toISOString()
    }, 'medium', { ip, method: 'GET', url: endpoint });
};

export default securityLogger;
