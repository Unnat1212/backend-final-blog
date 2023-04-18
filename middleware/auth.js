const jwt = require("jsonwebtoken");
const config = require("../Config/config");

module.exports = (req, res, next) => {
  const authHeader = req.get("Authorization");
  if (!authHeader) {
    const error = new Error("Not authenticated.");
    error.statusCode = 401;
    throw error;
  }
  const token = authHeader.split(" ")[1];
  let decodedToken;
  try {
    let Token = config.secret_jwt;
    decodedToken = jwt.verify(token, `${Token}`);
  } catch (err) {
    err.statusCode = 428;
    err.message = "token is expired";

    throw err;
  }
  if (!decodedToken) {
    return res
      .status(429)
      .send({ msg: "Token does not match", token_status: false });
  }
  req.userId = decodedToken.userId;
  next();
};
