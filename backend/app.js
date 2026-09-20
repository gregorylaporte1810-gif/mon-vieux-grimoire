require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");

const bookRoutes = require("./routes/book");
const userRoutes = require("./routes/user");
const path = require("path");

const app = express();

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("Connexion à MongoDB réussie !"))
  .catch((error) => {
    console.log("Connexion à MongoDB échouée !");
    console.error(error);
  });

// Autorise la lecture des requêtes JSON
app.use(express.json());

// Autorise le front-end à communiquer avec le back-end
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");

  res.setHeader(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content, Accept, Content-Type, Authorization"
  );

  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, PATCH, OPTIONS"
  );

  next();
});

app.use("/images", express.static(path.join(__dirname, "images")));

// Route de test
app.get("/api/test", (req, res) => {
  res.status(200).json({
    message: "Le serveur fonctionne !",
  });
});

// Routes des livres
app.use("/api/books", bookRoutes);
app.use("/api/auth", userRoutes);

module.exports = app;