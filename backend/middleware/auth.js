import jwt from "jsonwebtoken";

const authUser = async (req, res, next) => {
  try {
    const { token } = req.headers;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Not authorized. Login again.",
      });
    }

    const tokenDecode = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    // Store authenticated user ID
    req.userId = tokenDecode.id;

    next();

  } catch (error) {
    console.error("Auth error:", {name:error.name, message:error.message, stack: error.stack?.substring(0,200)});

    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
};

export default authUser;
