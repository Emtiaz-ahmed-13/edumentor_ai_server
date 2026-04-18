const { ClerkExpressRequireAuth } = require('@clerk/clerk-sdk-node');

const clerkAuth = ClerkExpressRequireAuth({
  // The SDK will automatically use CLERK_SECRET_KEY and CLERK_PUBLISHABLE_KEY from env
});

module.exports = clerkAuth;
