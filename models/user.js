let mongoose = require("mongoose");

let dataschema = mongoose.Schema({
  phn: {
    type: String,
  },
  otp: {
    type: String,
  },
  w_num: {
    type: String,
  },
});

let data = (module.exports = mongoose.model("data", dataschema));
