const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const cookie = require("cookie-parser");
require("dotenv").config();
const app = express();
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cookie());

mongoose.connect(process.env.MONGO_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
let db = mongoose.connection;

db.once("open", function () {
  console.log("connected");
});

db.on("error", function (err) {
  console.log(err);
});

const data = require("./models/user");
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;

app.get("/", (req, res) => {
  res.render("home");
});

app.post("/", (req, res) => {
  let phn = req.body.phn;
  phn = "+91" + phn;
  console.log(phn);
  res.redirect("/otp/" + phn);
});

app.get("/otp/:phn", (req, res) => {
  let phn = req.params.phn;
  let otp = Math.random().toString(36).substring(2, 7);
  otp = otp;
  /*
  save otp and phn number as cookie
  */
  const token = jwt.sign({ phn: phn, otp: otp }, "secretkey");
  console.log(token);
  res.cookie("jwt", token, { maxAge: 60000, httpOnly: true });
  /*
  send otp to user through sms
  */
  const client = require("twilio")(accountSid, authToken);
  client.messages
    .create({
      body: "Your otp is " + otp + " otp will expire in 60 seconds",
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phn,
    })
    .then((message) => console.log(message.sid));

  console.log(phn + " " + otp);
  res.render("otp", { phn: phn });
});

app.post("/otp/:phn", (req, res) => {
  let phn = req.params.phn;
  let otp = req.body.otp;
  /*
  check otp and phn from cookie
  */
  const bearertoken = req.cookies.jwt;
  console.log(bearertoken);
  if (!bearertoken) {
    res.redirect("/wronginput");
  } else {
    jwt.verify(bearertoken, "secretkey", (err, decoded) => {
      if (err) {
        console.log(err);
        res.redirect("/error");
      } else {
        let dataphn = decoded.phn;
        let dataotp = decoded.otp;
        console.log(dataphn + " " + dataotp);
        if (phn != dataphn || dataotp != otp) {
          res.redirect("/wronginput");
        }

        const month = [
          "Jan",
          "Feb",
          "Mar",
          "Apr",
          "May",
          "June",
          "July",
          "Aug",
          "Sep",
          "Oct",
          "Nov",
          "Dec",
        ];
        let wnum = Math.random().toString(36).substring(2, 7);
        const d = new Date();
        wnum =
          d.getFullYear().toString() +
          month[d.getMonth()] +
          d.getDate().toString() +
          "/" +
          d.getHours().toString() +
          ":" +
          d.getMinutes().toString() +
          "/" +
          wnum;
        const client = require("twilio")(accountSid, authToken);
        client.messages
          .create({
            body: "Your witness id : " + wnum,
            from: process.env.TWILIO_PHONE_NUMBER,
            to: phn,
          })
          .then((message) => console.log(message.sid));

        console.log(phn + " " + otp + " " + wnum);

        let da = new data();
        da.phn = phn;
        da.otp = otp;
        da.w_num = wnum;
        da.save((err) => {
          if (err) console.log(errr);
          else {
            res.redirect("/");
          }
        });
      }
    });
  }
});

app.get("/error", (req, res) => {
  res.render("error");
});

app.get("/wronginput", (req, res) => {
  res.render("wronginput");
});

app.listen("3000", (err) => {
  if (err) {
    console.log(err);
  } else {
    console.log("listening at 3000");
  }
});
