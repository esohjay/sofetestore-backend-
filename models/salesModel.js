const mongoose = require("mongoose");
const mongoosePaginate = require("mongoose-paginate-v2");
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
SalesSchema.plugin(mongoosePaginate);
module.exports = mongoose.model("Sales", SalesSchema);
