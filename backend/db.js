// db.js

const mongoose = require("mongoose");
const config = require("./config");

const dbURI = config.MONGO_URI;

function connectDB() {
  mongoose.connect(dbURI)
    .then(() => console.log("MongoDB Verbindung erfolgreich hergestellt"))
    .catch(err => {
      console.error("MongoDB Verbindungsfehler:", err);
      setTimeout(connectDB, 5000);
    });
}

mongoose.connection.on("connected", () => console.log(`MongoDB verbunden mit: ${dbURI}`));
mongoose.connection.on("error", err => console.error("MongoDB Fehler:", err));
mongoose.connection.on("disconnected", () => {
  console.warn("MongoDB getrennt. Versuche erneut zu verbinden...");
  connectDB();
});

connectDB();
module.exports = mongoose;
