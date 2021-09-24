const mongoose = require("mongoose");
const mongoosePaginate = require("mongoose-paginate-v2");

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
inventorySchema.plugin(mongoosePaginate);
module.exports = mongoose.model("Inventory", inventorySchema);
