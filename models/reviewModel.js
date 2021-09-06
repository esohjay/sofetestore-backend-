const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema({
  comment: String,
  rating: Number,
  name: String,
});

module.exports = mongoose.model("Review", reviewSchema);
