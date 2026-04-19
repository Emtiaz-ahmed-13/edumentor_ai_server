// Temporarily bypassing Clerk auth to prevent server crash due to missing keys
const clerkAuth = (req, res, next) => {
  // Mocking auth data for development
  req.auth = { userId: "guest_user" };
  next();
};

module.exports = clerkAuth;
