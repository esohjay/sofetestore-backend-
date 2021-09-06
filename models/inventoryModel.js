const mongoose = require("mongoose");

const SalesSchema = new mongoose.Schema({
  varType: String,
  value: String,
  quantity: Number,
});

const inventorySchema = new mongoose.Schema(
  {
    batch: { type: String, required: true, unique: true },
    quantity: Number,
    cost: Number,
    origin: String,
    date: Date,
    description: String,
    sales: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Sales",
      },
    ],
  },
  {
    timestamps: true,
  }
);
module.exports = mongoose.model("Inventory", inventorySchema);
