const mongoose = require("mongoose");

const userSchema = mongoose.Schema({
  username: String,
  email: String,
  password: String,
  token: String,
  settings: {
    profilePicture: { type: String, default: "none" },
    theme: { type: String, default: "light" },
    notificationsEnabled: { type: Boolean, default: "true" },
  },
});

const User = mongoose.model("users", userSchema);

module.exports = User;
