const mongoose = require("mongoose");

const SalesSchema = new mongoose.Schema(
  {
    name: String,
    sku: String,
    size: String,
    quantity: Number,
    img: String,
    price: Number,
    batch: String,
    description: String,
    date: Date,
    customerName: String,
    customerPhone: Number,
  },
  {
    timestamps: true,
  }
);
module.exports = mongoose.model("Sales", SalesSchema);
