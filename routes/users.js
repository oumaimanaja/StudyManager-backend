var express = require("express");
var router = express.Router();
require("../models/connection");
const User = require("../models/users");
const uid2 = require("uid2");
const bcrypt = require("bcrypt");
const { checkBody } = require("../modules/checkBody");

const fs = require('fs');
const path = require('path');
const uniqid = require('uniqid');
const cloudinary = require('cloudinary').v2;

/* GET users listing. */
router.get("/", function (req, res, next) {
  res.send("respond with a resource");
});

//SIGN UP : CREER UN COMPTE

router.post("/signup", (req, res) => {
  if (!checkBody(req.body, ["username", "email", "password"])) {
    res.json({ result: false, error: "Missing or empty fields" });
    return;
  }

  // Check if the user has not already been registered
  User.findOne({ email: req.body.email }).then((data) => {
    if (data === null) {
      const hash = bcrypt.hashSync(req.body.password, 10);
      const token =  uid2(32);
      const newUser = new User({
        username: req.body.username,
        email: req.body.email,
        password: hash,
        token: token,
      });

      newUser.save().then(() => {
        res.json({
          result: true,
          token: newUser.token,
          username: newUser.username,
        });
      });
    } else {
      // User already exists in database
      res.json({ result: false, error: "User already exists" });
    }
  });
});

//Sign In : CONNECTION AU COMPTE

router.post("/signin", (req, res) => {
  if (!checkBody(req.body, ["email", "password"])) {
    res.json({ result: false, error: "Missing or empty fields" });
    return;
  }

  User.findOne({ email: req.body.email }).then((data) => {
    if (data && bcrypt.compareSync(req.body.password, data.password)) {
      res.json({ result: true, username: data.username, token: data.token, userId: data._id });
      console.log({ result: true, username: data.username, token: data.token, userId: data._id });
    } else {
      res.json({ result: false, error: "User not found or wrong password" });
    }
  });
});

// router.post('forgot-password'), (req,res) => {
//   const { email } = req.body;
//   const user = User.findOne({ email });
//   if (!user) {
//     res.json({ result: false, error: 'Utilisateur non trouvé.'})
//   } else {
//     res.json({ result: true, message: 'Utilisateur trouvé'})
//   }

// }

// Route pour supprimer un compte
router.post("/delete-account", (req, res) => {
  // Vérifiez que le corps de la requête contient les champs nécessaires
  if (!checkBody(req.body, ["token", "password"])) {
    return res
      .status(400)
      .json({ result: false, error: "Missing or empty fields" });
  }

  const { token, password } = req.body;

  // Trouvez l'utilisateur par le token
  User.findOne({ token: token })
    .then((user) => {
      if (!user) {
        return res.status(404).json({ result: false, error: "User not found" });
      }

      // Comparez le mot de passe fourni avec le mot de passe stocké
      if (!bcrypt.compareSync(password, user.password)) {
        return res
          .status(401)
          .json({ result: false, error: "Incorrect password" });
      }

      // Supprimez l'utilisateur
      User.deleteOne({ token: token })
        .then((result) => {
          if (result.deletedCount === 0) {
            return res
              .status(500)
              .json({ result: false, error: "Failed to delete user" });
          }

          // Répondez avec un succès
          res.json({ result: true, message: "Account deleted successfully" });
        })
        .catch((err) => {
          res.status(500).json({
            result: false,
            error: "An error occurred while deleting the account",
          });
        });
    })
    .catch((err) => {
      res.status(500).json({
        result: false,
        error: "An error occurred while finding the user",
      });
    });
});


router.post('/settings', async (req, res) => {
    console.log('Body:', req.body);
    console.log('Files:', req.files);

    if (!req.files || Object.keys(req.files).length === 0) {
        return res.json({ result: false, error: "No files were uploaded." });
    }

    const tmpDir = path.join(__dirname, '..', 'tmp');

    // Crée le répertoire tmp s'il n'existe pas
    if (!fs.existsSync(tmpDir)) {
        fs.mkdirSync(tmpDir, { recursive: true });
    }

    // Récupère les données du formulaire
    const { token, notificationsEnabled, theme } = req.body;
    let profilePictureUrl = null;

    // Traite l'image
    if (req.files.photoFromFront) {
        const photoPath = path.join(tmpDir, `${uniqid()}.jpg`);
        const resultMove = await req.files.photoFromFront.mv(photoPath);

        if (!resultMove) {
            const resultCloudinary = await cloudinary.uploader.upload(photoPath);
            profilePictureUrl = resultCloudinary.secure_url;
            fs.unlinkSync(photoPath); // Supprime l'image temporaire après l'upload
        } else {
            return res.json({ result: false, error: resultMove });
        }
    }

    // upadate de l'image
    const updateData = {
        "settings.notificationsEnabled": notificationsEnabled,
        "settings.theme": theme,
    };

    if (profilePictureUrl) {
        updateData["settings.profilePicture"] = profilePictureUrl;
    }

    User.findOneAndUpdate(
        { token: token },
        { $set: updateData },
        { new: true }
    )
    .then((updatedUser) => {
        if (!updatedUser) {
            return res.json({ error: 'User not found' });
        }
        res.json({
            result: true,
            message: 'Settings updated successfully',
            user: updatedUser.settings,
        });
    })
    .catch((err) => {
        res.json({
            result: false,
            error: 'An error occurred while updating settings',
        });
    });
});

router.post('/getSettings', (req, res) => {
  const { token } = req.body;

  if (!token) {
      return res.json({ result: false, error: "Token is missing" });
  }

  User.findOne({ token: token }).then((user) => {
      if (!user) {
          return res.json({ result: false, error: "User not found" });
      }

      res.json({
          result: true,
          settings: user.settings,
      });
  })
});



module.exports = router;