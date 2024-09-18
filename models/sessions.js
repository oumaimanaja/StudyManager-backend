// models/sessions.js
const mongoose = require("mongoose");

const sessionSchema = mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "users",
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  selectOption: String,
  selectedDate: {
    type: Date,
    required: true,
  },
  selectPeriodicity: String,
  startTime: {
    type: Date,
    required: true,
  },
  endTime: {
    type: Date,
    required: true,
  },

  numberOfCycles: {
    type: Number,
    required: true,
  },
  workDuration: {
    type: Number,
    required: true,
  },
  breakDuration: {
    type: Number,
    required: true,
  },

  description: String,
  status: {
    type: String,
    enum: ["Planifiée", "Manquée", "En cours", "Terminée", "Abandonnée"],
    default: "Planifiée",
  },
});
const Session = mongoose.model("sessions", sessionSchema);

module.exports = Session;
