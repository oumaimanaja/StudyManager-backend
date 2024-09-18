require('dotenv').config();
require('./models/connection');

const express = require('express');
const fileUpload = require('express-fileupload');
const app = express();

app.use(fileUpload({
  limits: { fileSize: 10 * 1024 * 1024 },
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

require("./models/connection");

var indexRouter = require("./routes/index");
var usersRouter = require("./routes/users");
const sessionsRouter = require('./routes/sessions');



const cloudinary = require('cloudinary').v2;
cloudinary.config({
    cloudinary_url: process.env.CLOUDINARY_URL
  });

const cors = require('cors');
app.use(cors({
  origin: '*',
}));

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

app.use("/", indexRouter);
app.use("/users", usersRouter);
app.use("/sessions", sessionsRouter);

module.exports = app;