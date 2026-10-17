import jwt from "jsonwebtoken";

/** Verify the JWT sent in the Authorization header and attach its user ID. */
export const requireAuth = (req, res, next) => {
  const authorization = req.headers.authorization;

  if (!authorization || !authorization.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Authentication required" });
  }

  const token = authorization.slice("Bearer ".length).trim();

  if (!process.env.JWT_SECRET) {
    console.error("JWT_SECRET is missing from the server environment");
    return res.status(500).json({ message: "Server configuration error" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};
