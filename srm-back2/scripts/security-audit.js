#!/usr/bin/env node

import crypto from 'crypto';
import dotenv from 'dotenv';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

// Security audit utility
class SecurityAuditor {
    constructor() {
        this.issues = [];
        this.warnings = [];
        this.passed = [];
    }

    // Check JWT secrets strength
    checkJWTSecrets() {
        console.log('🔍 Checking JWT secrets...');
        
        const secrets = [
            { name: 'JWT_SECRET_ADMIN', value: process.env.JWT_SECRET_ADMIN },
            { name: 'JWT_SECRET_EDITOR', value: process.env.JWT_SECRET_EDITOR },
            { name: 'JWT_SECRET_AUTHOR', value: process.env.JWT_SECRET_AUTHOR }
        ];

        secrets.forEach(secret => {
            if (!secret.value) {
                this.issues.push(`❌ ${secret.name} is missing`);
            } else if (secret.value.length < 32) {
                this.issues.push(`❌ ${secret.name} is too short (${secret.value.length} chars, minimum 32)`);
            } else if (secret.value.length < 64) {
                this.warnings.push(`⚠️ ${secret.name} could be stronger (${secret.value.length} chars, recommend 64+)`);
            } else {
                this.passed.push(` ${secret.name} is strong (${secret.value.length} chars)`);
            }

            // Check for common patterns
            const commonPatterns = ['secret', 'password', '123', 'test', 'demo', 'jwt'];
            if (secret.value && commonPatterns.some(pattern => secret.value.toLowerCase().includes(pattern))) {
                this.issues.push(`❌ ${secret.name} contains common patterns`);
            }
        });
    }

    // Check database connection security
    checkDatabaseSecurity() {
        console.log('🔍 Checking database configuration...');
        
        if (!process.env.MONGODB_URI) {
            this.issues.push('❌ MONGODB_URI is missing');
            return;
        }

        // Check if using SSL in production
        if (process.env.NODE_ENV === 'production') {
            if (!process.env.MONGODB_URI.includes('ssl=true') && !process.env.MONGODB_URI.includes('tls=true')) {
                this.warnings.push('⚠️ Database connection should use SSL/TLS in production');
            }
        }

        // Check for weak authentication
        if (process.env.MONGODB_URI.includes('admin:admin') || 
            process.env.MONGODB_URI.includes('root:root') ||
            process.env.MONGODB_URI.includes('user:password')) {
            this.issues.push('❌ Database credentials appear to be default/weak');
        }

        this.passed.push(' Database URI is configured');
    }

    // Check CORS configuration
    checkCORSConfiguration() {
        console.log('🔍 Checking CORS configuration...');
        
        if (!process.env.ALLOWED_ORIGINS) {
            this.warnings.push('⚠️ ALLOWED_ORIGINS not set, using default localhost');
            return;
        }

        const origins = process.env.ALLOWED_ORIGINS.split(',');
        
        // Check for wildcard origins
        if (origins.includes('*') || origins.includes('*.*')) {
            this.issues.push('❌ CORS allows any origin (*) - security risk');
        }

        // Check for localhost in production
        if (process.env.NODE_ENV === 'production') {
            const localhostOrigins = origins.filter(origin => 
                origin.includes('localhost') || origin.includes('127.0.0.1')
            );
            if (localhostOrigins.length > 0) {
                this.warnings.push('⚠️ localhost origins found in production CORS');
            }
        }

        this.passed.push(` CORS configured for ${origins.length} origin(s)`);
    }

    // Check email security
    checkEmailSecurity() {
        console.log('🔍 Checking email configuration...');
        
        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
            this.warnings.push('⚠️ Email configuration missing - some features may not work');
            return;
        }

        // Check if using app-specific password
        if (process.env.EMAIL_PASS.length < 16) {
            this.warnings.push('⚠️ Email password might be regular password instead of app-specific');
        }

        this.passed.push(' Email configuration found');
    }

    // Check environment security
    checkEnvironmentSecurity() {
        console.log('🔍 Checking environment security...');
        
        if (process.env.NODE_ENV !== 'production') {
            this.warnings.push('⚠️ Not running in production mode');
        } else {
            this.passed.push(' Running in production mode');
        }

        // Check for debug mode
        if (process.env.ENABLE_DEBUG_ROUTES === 'true') {
            this.warnings.push('⚠️ Debug routes enabled in production');
        }

        // Check for exposed secrets in logs
        if (process.env.LOG_SECRETS === 'true') {
            this.issues.push('❌ Secret logging enabled - security risk');
        }
    }

    // Check file upload security
    checkFileUploadSecurity() {
        console.log('🔍 Checking file upload security...');
        
        const maxSize = parseInt(process.env.MAX_FILE_SIZE) || 10485760;
        if (maxSize > 50 * 1024 * 1024) { // 50MB
            this.warnings.push('⚠️ Large file upload size limit may be risky');
        }

        if (!process.env.ALLOWED_FILE_TYPES) {
            this.warnings.push('⚠️ No explicit allowed file types configured');
        }

        this.passed.push(` File upload size limit: ${maxSize / (1024 * 1024)}MB`);
    }

    // Generate secure secrets if needed
    generateSecureSecrets() {
        console.log('\n🔐 Generating secure secrets (if needed)...');
        
        const secrets = {
            JWT_SECRET_ADMIN: crypto.randomBytes(32).toString('hex'),
            JWT_SECRET_EDITOR: crypto.randomBytes(32).toString('hex'),
            JWT_SECRET_AUTHOR: crypto.randomBytes(32).toString('hex'),
            CSRF_SECRET: crypto.randomBytes(24).toString('base64'),
            SESSION_SECRET: crypto.randomBytes(64).toString('hex'),
            ENCRYPTION_KEY: crypto.randomBytes(32).toString('hex')
        };

        console.log('\n📝 Add these to your .env file:');
        console.log('='.repeat(50));
        Object.entries(secrets).forEach(([key, value]) => {
            console.log(`${key}=${value}`);
        });
        console.log('='.repeat(50));
    }

    // Run full audit
    async runAudit() {
        console.log('🚀 Starting Security Audit\n');
        
        this.checkJWTSecrets();
        this.checkDatabaseSecurity();
        this.checkCORSConfiguration();
        this.checkEmailSecurity();
        this.checkEnvironmentSecurity();
        this.checkFileUploadSecurity();

        // Print results
        console.log('\n📊 AUDIT RESULTS');
        console.log('='.repeat(50));

        if (this.issues.length > 0) {
            console.log('\n🚨 CRITICAL ISSUES:');
            this.issues.forEach(issue => console.log(issue));
        }

        if (this.warnings.length > 0) {
            console.log('\n⚠️ WARNINGS:');
            this.warnings.forEach(warning => console.log(warning));
        }

        if (this.passed.length > 0) {
            console.log('\n PASSED CHECKS:');
            this.passed.forEach(passed => console.log(passed));
        }

        // Summary
        console.log('\n📈 SUMMARY:');
        console.log(`Critical Issues: ${this.issues.length}`);
        console.log(`Warnings: ${this.warnings.length}`);
        console.log(`Passed: ${this.passed.length}`);

        if (this.issues.length > 0) {
            console.log('\n❌ SECURITY AUDIT FAILED - Fix critical issues before deploying to production');
            process.exit(1);
        } else if (this.warnings.length > 0) {
            console.log('\n⚠️ SECURITY AUDIT PASSED WITH WARNINGS - Review warnings for best practices');
        } else {
            console.log('\n SECURITY AUDIT PASSED - Your configuration looks secure!');
        }
    }
}

// Run audit if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
    const auditor = new SecurityAuditor();
    
    // Check if generating secrets
    if (process.argv.includes('--generate-secrets')) {
        auditor.generateSecureSecrets();
    } else {
        auditor.runAudit().catch(console.error);
    }
}

export default SecurityAuditor;
