const mongoose = require("mongoose");

mongoose
  .connect(
    "mongodb+srv://Unnat:Unnat%40321@cluster0.vcuwllk.mongodb.net/?retryWrites=true&w=majority"
  )
  .then(() => {
    console.log("MongoDb connecion Successfully");
  })
  .catch((error) => {
    console.log("No Connection", error);
  });
