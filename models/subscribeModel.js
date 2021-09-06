const mongoose = require("mongoose");

const subscribeSchema = new mongoose.Schema(
  {
    email: String,
  },
  {
    timestamps: true,
  }
);
module.exports = mongoose.model("Subscribe", subscribeSchema);
