# Security Documentation

## Overview

This document outlines the security measures implemented in the ICIUS 2026 Research Paper Management System. The application follows industry best practices for web application security.

## 🔐 Security Features Implemented

### 1. Authentication & Authorization
- **JWT-based authentication** with role-specific secrets
- **Password hashing** using bcrypt with salt rounds
- **Email verification** for account activation
- **Role-based access control** (Admin, Editor, Reviewer, Author)
- **Secure session management** with HTTP-only cookies
- **Progressive delay** for failed login attempts

### 2. Input Validation & Sanitization
- **Express-validator** for comprehensive input validation
- **MongoDB injection protection** using express-mongo-sanitize
- **XSS protection** with xss-clean middleware
- **HTML sanitization** for rich text content
- **File upload validation** with type and size restrictions
- **Filename sanitization** to prevent directory traversal

### 3. Rate Limiting & DDoS Protection
- **General API rate limiting** (100 requests per 15 minutes)
- **Strict auth rate limiting** (5 attempts per 15 minutes)
- **Password reset limiting** (3 attempts per hour)
- **File upload limiting** (10 uploads per hour)
- **Admin route protection** with stricter limits
- **Progressive delays** for repeated failed attempts

### 4. Security Headers
- **Helmet.js** for comprehensive security headers
- **Content Security Policy** (CSP) configuration
- **X-Frame-Options** to prevent clickjacking
- **X-Content-Type-Options** to prevent MIME sniffing
- **Strict-Transport-Security** for HTTPS enforcement
- **Referrer Policy** for privacy protection

### 5. Database Security
- **SSL/TLS connections** in production
- **Connection pooling** with limited connections
- **Query sanitization** against NoSQL injection
- **Secure MongoDB configuration** with authentication
- **Connection timeouts** and retry mechanisms

### 6. File Upload Security
- **File type validation** (PDF, DOC, DOCX only)
- **File size limits** (10MB for papers, 5MB for reviews)
- **Filename sanitization** and dangerous pattern detection
- **Memory storage** with immediate processing
- **Virus scanning** capability (configurable)

### 7. CORS Configuration
- **Origin validation** against allowed domains
- **Credential support** for authenticated requests
- **Method and header restrictions**
- **Production-ready** CORS settings

### 8. Logging & Monitoring
- **Security event logging** with detailed context
- **Access logging** with IP tracking
- **Error logging** with stack traces
- **External monitoring** integration (webhook support)
- **Log rotation** and cleanup automation

## 🛡️ Security Middleware Stack

```javascript
// Applied in order:
1. Rate Limiting (general)
2. Security Logging
3. Request Logging
4. Body Parsing (with limits)
5. Cookie Parsing
6. MongoDB Sanitization
7. HTTP Parameter Pollution Protection
8. Security Headers (Helmet)
9. XSS Protection
10. Route-specific Rate Limiting
```

## 🔧 Environment Variables Security

### Required Security Variables
```bash
# JWT Secrets (generate with: openssl rand -hex 32)
JWT_SECRET_ADMIN=your_64_char_hex_string
JWT_SECRET_EDITOR=your_64_char_hex_string
JWT_SECRET_AUTHOR=your_64_char_hex_string

# CORS Configuration
ALLOWED_ORIGINS=https://yourdomain.com,https://admin.yourdomain.com

# Database Security
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/db?ssl=true

# Security Monitoring (optional)
SECURITY_WEBHOOK_URL=https://your-monitoring-service.com/webhook
```

### Optional Security Variables
```bash
# CSRF Protection
CSRF_SECRET=your_base64_secret

# Session Security
SESSION_SECRET=your_hex_secret

# File Upload Security
MAX_FILE_SIZE=10485760
ALLOWED_FILE_TYPES=pdf,doc,docx
SCAN_UPLOADS=true

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## 🚀 Security Scripts

### Run Security Audit
```bash
npm run security-audit
```

### Generate Secure Secrets
```bash
npm run security-audit-generate
```

### Development with Security
```bash
npm run dev  # Includes security middleware
```

## 📊 Security Monitoring

### Log Files
- `logs/security.log` - Security events and incidents
- `logs/access.log` - HTTP access requests
- `logs/error.log` - Application errors

### Security Events Tracked
- Failed login attempts
- Suspicious file uploads
- Rate limit violations
- Unauthorized access attempts
- SQL/NoSQL injection attempts
- XSS attack patterns
- Directory traversal attempts

### Alert Integration
Configure `SECURITY_WEBHOOK_URL` to receive real-time security alerts:
```javascript
// Example webhook payload:
{
  "timestamp": "2024-01-01T00:00:00.000Z",
  "type": "SECURITY",
  "event": "FAILED_LOGIN",
  "severity": "MEDIUM",
  "details": {
    "email": "user@example.com",
    "reason": "invalid_credentials"
  },
  "request": {
    "ip": "192.168.1.1",
    "method": "POST",
    "url": "/api/auth/login",
    "userAgent": "Mozilla/5.0..."
  }
}
```

## 🔍 Security Best Practices

### For Developers
1. **Never commit `.env` files** to version control
2. **Use strong, unique secrets** for all JWT tokens
3. **Validate all inputs** using the provided middleware
4. **Log security events** for audit trails
5. **Review security logs** regularly
6. **Keep dependencies updated** with `npm audit`

### For Deployment
1. **Use HTTPS in production** with valid certificates
2. **Configure firewall rules** to restrict access
3. **Enable database SSL/TLS** connections
4. **Set up monitoring** for security events
5. **Regular security audits** using the provided script
6. **Backup security logs** for compliance

### For Operations
1. **Monitor rate limit violations** for potential attacks
2. **Review failed login patterns** for brute force attempts
3. **Watch for suspicious file uploads**
4. **Track unusual access patterns**
5. **Set up alerts** for critical security events
6. **Regular log rotation** to manage disk space

## 🚨 Incident Response

### Immediate Actions
1. **Review security logs** for recent events
2. **Check for unauthorized access** attempts
3. **Verify file uploads** for malicious content
4. **Monitor database connections** for anomalies
5. **Update passwords** if compromise suspected

### Escalation Procedures
1. **Critical events** trigger immediate alerts
2. **High-severity events** require investigation within 1 hour
3. **Medium events** should be reviewed daily
4. **Low events** can be reviewed weekly

## 📋 Security Checklist

### Pre-deployment
- [ ] Run `npm run security-audit`
- [ ] Generate new JWT secrets
- [ ] Configure CORS origins
- [ ] Set up security monitoring
- [ ] Test rate limiting
- [ ] Verify file upload security
- [ ] Check SSL/TLS configuration

### Post-deployment
- [ ] Monitor security logs
- [ ] Test authentication flows
- [ ] Verify rate limiting effectiveness
- [ ] Check security headers
- [ ] Validate CORS configuration
- [ ] Review error logs for issues

## 🔐 Password Requirements

- **Minimum length**: 8 characters
- **Maximum length**: 128 characters
- **Required characters**: At least one lowercase, one uppercase, and one number
- **Recommended**: Include special characters
- **Forbidden**: Common patterns, sequential numbers, repeated characters

## 📁 File Upload Security

### Allowed File Types
- **PDF documents** (.pdf)
- **Word documents** (.doc, .docx)

### Size Limits
- **Paper submissions**: 10MB
- **Review files**: 5MB
- **Final documents**: 15MB
- **Images**: 5MB

### Security Checks
- File type validation
- MIME type verification
- Filename sanitization
- Dangerous pattern detection
- Size limit enforcement

## 🌐 Network Security

### CORS Configuration
- Strict origin validation
- Credential support for authenticated requests
- Method restrictions
- Header validation

### Rate Limiting
- IP-based limiting
- Endpoint-specific limits
- Progressive delays
- Automatic cleanup

### SSL/TLS
- HTTPS enforcement in production
- Secure cookie settings
- HSTS headers
- Certificate validation

## 📞 Support

For security-related issues:
1. Check the security logs first
2. Run the security audit script
3. Review this documentation
4. Contact the security team for critical issues

---

**Last Updated**: January 2024
**Version**: 2.0.0
**Security Level**: Enterprise
