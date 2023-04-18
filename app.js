const express = require("express");
const mongoose = require("mongoose");
require("./db/conn");
const bodyParser = require("body-parser");
const Student = require("./model/Students");
const Blog = require("./model/Blog");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const fs = require("fs");
const bcrypt = require("bcryptjs");
const app = express();
const auth = require("./middleware/auth");
const multer = require("multer");
const nodemailer = require("nodemailer");
const config = require("./Config/config");
const randomString = require("randomstring");

const myEmail = "unnat.patel@aspiresoftserv.in";
const myPassword = "upatel@012023";
const transporter = nodemailer.createTransport({
  service: "Yandex",
  auth: {
    user: myEmail,
    pass: myPassword,
  },
});

app.use(bodyParser.json());

app.use(cors());

app.use("/images", express.static("images"));

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,PATCH");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");
  next();
});

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "images");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "_" + file.originalname);
  },
});
const upload = multer({ storage: storage });

app.put("/student/:productId", upload.single("url"), auth, async (req, res) => {
  try {
    const product = {
      title: req.body.title,
      description: req.body.description,
      category: req.body.category,
      author: req.body.author,
      url: req.file.filename,
      admin: req.body.admin,
    };
    // console.log(product.url);

    const updatedProduct = await Student.findByIdAndUpdate(
      { _id: req.params.productId },
      product
    );
    res.json(updatedProduct);
  } catch (error) {
    res.json({ message: error });
  }
});

app.post("/student", upload.single("url"), async (req, res) => {
  // /this is add post
  console.log(req.body);
  const title = req.body.title;
  const description = req.body.description;
  const category = req.body.category;
  const author = req.body.author;
  const admin = req.body.admin;
  const url = req.file.filename;

  const user = new Student({
    title: title,
    description: description,
    category: category,
    author: author,
    admin: admin,
    url: url,
  });
  await user.save();
  res.json(user);
});

app.post("/sendPassword", async (req, res) => {
  // const fromEmail = "unnat.patel@aspiresoftserv.in";
  const email = req.body.email;
  // console.log(email);
  const userFind = await Blog.findOne({ email: email });
  // console.log(userFind);
  if (userFind) {
    const mailOptions = {
      from: "unnat.patel@aspiresoftserv.in",
      to: email,
      subject: "Sending Email For password Reset",
      text: `Click here to change password http://localhost:3000/new-password/${userFind._id}`,
    };
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log("error", error);
        res.status(401).json({ status: 401, message: "email not send" });
      } else {
        console.log("Email sent", info.response);
        res
          .status(201)
          .json({ status: 201, message: "Email sent Successfully" });
      }
    });
  } else {
    return res.status(404).send({ msg: "Invalid Email" });
  }
});

app.post("/blog", async (req, res) => {
  const user = new Blog(req.body);
  await user.save();
  res.json(user);
});

app.get("/student", async (req, res) => {
  try {
    const student = await Student.find();
    res.json(student);
  } catch (error) {
    res.json({ message: error });
  }
});

app.get("/blog", auth, async (req, res) => {
  try {
    // console.log("come here");
    const blog = await Blog.find();
    res.json(blog);
  } catch (error) {
    console.log(error);
    res.json({ message: error });
  }
});

app.get("/blog/:userId", auth, async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.userId);
    res.json(blog);
  } catch (error) {
    console.log(error);
    res.json({ message: error });
  }
});

app.put("/blog/:userId", async (req, res) => {
  // console.log(req.body);
  try {
    const updatedProduct = await Blog.findByIdAndUpdate(
      req.params.userId,
      req.body
    );
    res.json(updatedProduct);
  } catch (error) {
    res.json({ message: error });
  }
});

app.put("/password-changer/:id", async (req, res) => {
  let { id, password } = req.body;
  const blog = await Blog.findById(id);
  blog.pass = password;

  try {
    const updatedProduct = await Blog.findByIdAndUpdate(id, blog);
    res.json(updatedProduct);
  } catch (error) {
    res.json({ message: error });
  }
});

app.get("/student/:productId", auth, async (req, res) => {
  try {
    const student = await Student.findById(req.params.productId);
    res.json(student);
  } catch (error) {
    return res
      .status(500)
      .send({ msg: "Blog details not found", token_status: false });
  }
});

app.delete("/student/:productId", auth, async (req, res) => {
  try {
    const removeProduct = await Student.findByIdAndDelete(req.params.productId);
    res.json(removeProduct);
  } catch (error) {
    res.json({ message: error });
  }
});

app.post("/login", async (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;
  try {
    const loadedUser = await Blog.findOne({ email: email });
    if (!loadedUser) {
      return res.status(404).send({ msg: "User Not Found" });
    }

    if (password !== loadedUser.pass) {
      return res.status(404).send({ msg: "Invalid Credential" });
    }

    const token = jwt.sign(
      {
        email: loadedUser.email,
        userId: loadedUser._id.toString(),
      },
      config.secret_jwt,
      { expiresIn: "10m" }
    );

    res.status(200).json({
      msg: "User Loggedin successfully",
      token: token,
      user: loadedUser,
    });
  } catch (error) {
    res.status(500).send({ msg: error.message, secret_allow: true });
  }
});

const refresh = (id) => {
  try {
    const secret_token = config.secret_jwt;
    const newSecretJwt = randomString.generate();
    fs.readFile("Config/config.js", "utf-8", (err, data) => {
      if (err) throw err;
      const newValue = data.replace(
        new RegExp(secret_token, "g"),
        newSecretJwt
      );
      fs.writeFile("Config/config.js", newValue, "utf-8", (err, data) => {
        if (err) throw err;
        console.log(" rewrite token done");
      });
    });
    const token = jwt.sign({ _id: id }, newSecretJwt, {
      expiresIn: "2h",
    });
    return token;
  } catch (error) {
    console.log(error);
    res.status(502).send({ msg: error });
  }
};

app.post("/refresh-token", async (req, res, next) => {
  const _id = req.body._id;
  console.log(req.body);
  try {
    const loadedUser = await Blog.findOne({ _id: _id });

    if (!loadedUser) {
      return res.status(404).send({ msg: "User Not Found" });
    }

    // console.log(loadedUser);
    const tokenData = await refresh(loadedUser._id);
    // console.log(tokenData);

    res.status(200).json({
      msg: "Token Refreshed successfully",
      token: tokenData,
      user: loadedUser,
    });
  } catch (error) {
    return res.status(501).send({ msg: error });
  }
});

app.listen(5000, () => {
  console.log("listen on port 5000");
});
