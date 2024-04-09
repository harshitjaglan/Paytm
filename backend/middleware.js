const JWT_SECRET = require("./config.js"); // will always be there so we can verify that a user is registered and we can recognize him with this userid in database
const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(403).json({ message: "something went wrong 1" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    if (decoded.userId) {
      req.userId = decoded.userId;
      next();
    } else return res.status(403).json({ message: "something went wrong 2" });
  } catch (err) {
    return res.status(403).json({ message: "something went wrong 3" });
  }
};

module.exports = {
  authMiddleware,
};
