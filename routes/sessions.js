var express = require("express");
var router = express.Router();
const mongoose = require("mongoose");
require("../models/connection");
const Session = require("../models/sessions.js");
const { checkBody } = require("../modules/checkBody");
const { generateDates } = require("../modules/generateDates.js");
const auth = require("../middleware/auth.js");
const cron = require("node-cron");

router.get("/", (req, res) => {
  Session.find({}).then((sessions) => {
    res.json({ result: true, sessions: sessions });
  });
});

// Route Post pour récupérer les sessions d'un utilisateur spécifique
router.post("/user-sessions", auth, (req, res) => {
  const { userId } = req.body; // Récupère userId

  // Vérifie si userId est fourni
  if (!userId) {
    return res.status(400).json({ result: false, error: "userId is required" });
  }

  // Recherche les sessions de l'utilisateur
  Session.find({ userId: userId })
    .then((sessions) => {
      // console.log(sessions);
      res.json({ result: true, sessions: sessions });
    })
    .catch((error) => {
      console.error("Error fetching sessions:", error);
      res.status(500).json({ result: false, error: "Internal server error" });
    });
});

router.post("/create/:selectOption", async (req, res) => {
  if (!checkBody(req.body, ["userId", "title", "selectedDate"])) {
    return res.json({ result: false, error: "Missing or empty fields" });
  }

  const selectOption = req.params.selectOption;
  const {
    userId,
    title,
    selectedDate,
    // selectOption: bodySelectOption,
    selectPeriodicity,
    startTime,
    endTime,
    description,
    numberOfCycles,
    workDuration,
    breakDuration,
    status,
  } = req.body;

  if (selectOption === "Once") {
    Session.findOne({
      title: title,
      selectedDate: selectedDate,
    }).then((existingSession) => {
      if (existingSession) {
        return res.json({ result: false, error: "Session already exists" });
      } else {
        const sessionData = {
          userId: userId,
          title: title,
          selectOption: selectOption,
          selectedDate: selectedDate,
          selectPeriodicity: selectPeriodicity,
          startTime: startTime,
          endTime: endTime,
          description: description,

          numberOfCycles: numberOfCycles,
          workDuration: workDuration,
          breakDuration: breakDuration,

          status: status,
        };

        const session = new Session(sessionData);
        session.save().then((newSession) => {
          // console.log("Session saved:", newSession)
          console.log(
            "this is the new pomodoro params",
            workDuration,
            breakDuration,
            numberOfCycles
          );
          res.json({ result: true, session: newSession });
        });
      }
    });
  } else if (selectOption === "Routine") {
    const dates = generateDates(selectedDate, selectPeriodicity, 30);
    console.log(dates);
    if (dates.length === 0) {
      return res.json({ result: false, error: "Invalid periodicity" });
    }

    let savedSessions = [];

    for (let date of dates) {
      try {
        const existingSession = await Session.findOne({
          title,
          selectedDate: date,
        });
        if (!existingSession) {
          const sessionData = {
            userId,
            title,
            selectOption,
            selectedDate: date,
            selectPeriodicity,
            startTime,
            endTime,
            description,
            status,

            numberOfCycles: numberOfCycles,
            workDuration: workDuration,
            breakDuration: breakDuration,
          };
          const session = new Session(sessionData);
          const savedSession = await session.save();
          savedSessions.push(savedSession);
        }
      } catch (error) {
        console.error("Error saving session:", error);
      }
    }
    console.log(
      "this is the new pomodoro params",
      workDuration,
      breakDuration,
      numberOfCycles
    );
    res.json({
      result: true,
      sessionsCreated: savedSessions.length,
      sessions: savedSessions,
    });
  }
});

router.delete("/", (req, res) => {
  console.log("this is req.body.id to delete", req.body.id);
  Session.findByIdAndDelete(req.body.id).then((session) => {
    if (!session) {
      return res.json({ result: false, error: "Session not found" });
    }
    res.json({ result: true, message: "Session deleted successfully" });
  });
});

router.put("/create/:selectOption", auth, (req, res) => {
  const {
    _id,
    title,
    selectedDate,
    startTime,
    endTime,
    description,
    selectOption,
    selectPeriodicity,
    status,
    numberOfCycles,
    workDuration,
    breakDuration,
  } = req.body;

  const filter = {
    _id: _id,
  };

  const updateData = {
    title,
    selectedDate,
    startTime,
    endTime,
    description,
    selectOption,
    selectPeriodicity,
    status,
    numberOfCycles,
    workDuration,
    breakDuration,
  };

  console.log("Filter:", filter);

  Session.findOneAndUpdate(filter, updateData, { new: true }).then(
    (updatedSession) => {
      if (!updatedSession) {
        return res.json({ result: false, error: "Session not found" });
      }
      res.json({ result: true, session: updatedSession });
    }
  );
});
// nom de route à changer
router.put("/markasdone/:id", async (req, res) => {
  try {
    const sessionId = req.params.id;

    // Trouver la session par ID et mettre à jour la propriété 'done' à true
    const updatedSession = await Session.findByIdAndUpdate(
      sessionId,
      { status: "Terminée" },
      { new: true } // Cette option retourne le document mis à jour
    );

    if (!updatedSession) {
      return res.json({ result: false, error: "Session not found" });
    }

    res.json({ result: true, session: updatedSession });
  } catch (error) {
    console.error("Error marking session as done:", error);
    res.json({
      result: false,
      error: "An error occurred while updating the session",
    });
  }
});

router.put("/markasInProgress/:id", async (req, res) => {
  try {
    const sessionId = req.params.id;

    // Trouver la session par ID et mettre à jour la propriété 'done' à true
    const updatedSession = await Session.findByIdAndUpdate(
      sessionId,
      { status: "En cours" },
      { new: true} // Cette option retourne le document mis à jour
    );

    if (!updatedSession) {
      return res.json({ result: false, error: "Session not found" });
    }

    res.json({ result: true, session: updatedSession });
  } catch (error) {
    console.error("Error marking session as done:", error);
    res.json({
      result: false,
      error: "An error occurred while updating the session",
    });
  }
});

router.put("/markasMissed", async (req, res) => {
  try {
    const sessionId = req.params.id;
    // Trouver la session par ID et mettre à jour la propriété 'done' à true
    const updatedSession = await Session.findByIdAndUpdate(
      sessionId,
      { status: "Manquée" },
      { new: true } // Cette option retourne le document mis à jour
    );

    if (!updatedSession) {
      return res.json({ result: false, error: "Session not found" });
    }

    res.json({ result: true, session: updatedSession });
  } catch (error) {
    console.error("Error marking session as done:", error);
    res.json({
      result: false,
      error: "An error occurred while updating the session",
    });
  }
});

//Cron Job
const markMissedAndAbandonedSessions = async () => {
  try {
    const now = new Date();
    const today = new Date(now.setHours(0, 0, 0, 0)); // On considère uniquement la date sans l'heure

    // Marquer comme "Manquée" les sessions "Planifiée" dont selectedDate est strictement inférieure à aujourd'hui

    const missedSessions = await Session.updateMany(
      {
        status: "Planifiée",

        selectedDate: { $lt: today },
      },
      { status: "Manquée" }
    );

    // Marquer comme "Abandonnée" les sessions "En cours" dont selectedDate est strictement inférieure à aujourd'hui

    const abandonedSessions = await Session.updateMany(
      {
        status: "En cours",

        selectedDate: { $lt: today },
      },
      { status: "Abandonnée" }
    );

    const missedCount = missedSessions.modifiedCount || 0;
    const abandonedCount = abandonedSessions.modifiedCount || 0;

    if (missedCount > 0 || abandonedCount > 0) {
      console.log(
        `${missedCount} session(s) marquée(s) comme manquée(s) et ${abandonedCount} session(s) marquée(s) comme abandonnée(s).`
      );
    } else {
      console.log("Aucune session à marquer comme manquée ou abandonnée.");
    }
  } catch (error) {
    console.error("Erreur lors de la mise à jour des sessions :", error);
  }
};

// Définir un cron job pour exécuter la mise à jour des sessions toutes les minutes
cron.schedule("* * * * *", markMissedAndAbandonedSessions);

module.exports = router;
