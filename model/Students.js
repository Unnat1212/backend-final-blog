const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  title: String,
  description: String,
  author: String,
  category: String,
  url: String,
  admin: String,
});

const student = mongoose.model("Product", productSchema);
module.exports = student;
