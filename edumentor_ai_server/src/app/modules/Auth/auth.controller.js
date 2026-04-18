const sendResponse = require("../../utils/sendResponse");
const authService = require("./auth.service");

const createUser = async (req, res, next) => {
  try {
    const result = await authService.createUser(req.body);
    sendResponse(res, {
      statusCode: 201,
      success: true,
      message: "User created successfully!",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const loginUser = async (req, res, next) => {
  try {
    const result = await authService.loginUser(req.body);
    const { refreshToken, accessToken } = result;

    // set refresh token into cookie
    const cookieOptions = {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
    };
    res.cookie("refreshToken", refreshToken, cookieOptions);

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "User logged in successfully !",
      data: {
        accessToken,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createUser,
  loginUser,
};
