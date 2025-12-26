import { HelmetOptions } from 'helmet';

export const helmetConfig: HelmetOptions = {
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"], // Only allow resources from the same origin
      styleSrc: ["'self'", 'https:', "'unsafe-inline'"], // Allows styles from self, HTTPS sources, and inline styles
      scriptSrc: ["'self'", 'https:'], // Allows scripts from self and HTTPS sources
      imgSrc: ["'self'", 'data:', 'https:'], // Allow images from self, data URIs (for inline images), and HTTPS
      connectSrc: ["'self'", 'https:', 'wss:'], // Only allow connections to self, secure APIs, and WebSockets
      objectSrc: ["'none'"], // Prevents loading Flash, Silverlight, etc. (Mitigates plugin-based attacks)
      baseUri: ["'none'"], // Prevents base tag manipulation (Avoids open redirection attacks)
      frameAncestors: ["'self'"], // Prevents embedding in iframes from external sites (Better clickjacking protection)
      formAction: ["'self'"], // Ensures forms can only be submitted to your own origin
      upgradeInsecureRequests: [], // Forces HTTP -> HTTPS automatically if possible
    },
  },
  frameguard: {
    action: 'deny', // prevents any iframe embedding
  },
  referrerPolicy: { policy: 'no-referrer' }, // Prevents leaking referrer data completely
  hsts: {
    maxAge: 60 * 60 * 24 * 365, // 1 year
    includeSubDomains: true, // Apply to subdomains
    preload: true, // Allow preloading for strict enforcement
  },
  hidePoweredBy: false, // Keep X-Powered-By header false so we can override it manually to obscure tech stack
  noSniff: true, // Prevents MIME-type sniffing
  ieNoOpen: true, // Prevents old IE security vulnerabilities
  dnsPrefetchControl: { allow: false }, // Prevents DNS prefetching to reduce exposure
  permittedCrossDomainPolicies: { permittedPolicies: 'none' }, // Blocks Adobe Flash/PDF cross-domain requests
};
