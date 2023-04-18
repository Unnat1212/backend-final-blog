const mongoose = require("mongoose");

const blogSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  phoneNumber: String,
  email: String,
  pass: String,
  cpassword: String,
  role: String,
});
// verifytoken: String,

const blog = mongoose.model("User", blogSchema);
module.exports = blog;
