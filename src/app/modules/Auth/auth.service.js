const config = require("../../../config");
const { jwtHelpers } = require("../../../helpers/jwtHelpers");
const User = require("../User/user.model");
const bcrypt = require("bcrypt");
const ApiError = require("../../errors/ApiError");

const createUser = async (payload) => {
  const result = await User.create(payload);
  const { password, ...user } = result.toObject();
  return user;
};

const loginUser = async (payload) => {
  const { email, password } = payload;
  const isUserExist = await User.findOne({ email }).select('+password');

  if (!isUserExist) {
    throw new ApiError(404, "User does not exist");
  }

  // check Password
  const isPasswordMatched = await bcrypt.compare(
    password,
    isUserExist?.password
  );

  if (!isPasswordMatched) {
    throw new ApiError(401, "Password did not match");
  }

  // create access token & refresh token
  const { password: userPassword, ...user } = isUserExist.toObject();

  const accessToken = jwtHelpers.createToken(
    { userId: user._id, role: "user" }, // Just using "user" role for now, adjust based on schema if needed
    config.jwt.secret,
    config.jwt.expires_in
  );

  const refreshToken = jwtHelpers.createToken(
    { userId: user._id, role: "user" },
    config.jwt.refresh_secret,
    config.jwt.refresh_expires_in
  );

  return {
    accessToken,
    refreshToken,
  };
};

module.exports = {
  createUser,
  loginUser,
};
