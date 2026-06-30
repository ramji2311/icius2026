/**
 * Fail fast on startup when required secrets/config are missing in production.
 */
export function validateProductionEnv() {
    if (process.env.NODE_ENV !== 'production') {
        return;
    }

    const required = [
        'MONGODB_URI',
        'JWT_SECRET_ADMIN',
        'JWT_SECRET_EDITOR',
        'JWT_SECRET_AUTHOR'
    ];

    const missing = required.filter((key) => !process.env[key]?.trim());
    if (missing.length > 0) {
        console.error(
            '[FATAL] Production requires these environment variables:',
            missing.join(', ')
        );

        if (process.env.VERCEL !== '1') {
            process.exit(1);
        }
    }

    if (!process.env.FRONTEND_URL?.trim()) {
        console.warn('[WARN] FRONTEND_URL is not set - cookies and emails may use wrong URLs.');
    }

    if (!process.env.ALLOWED_ORIGINS?.trim()) {
        console.warn('[WARN] ALLOWED_ORIGINS is not set - only default localhost CORS will apply.');
    }
}
