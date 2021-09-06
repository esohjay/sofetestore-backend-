const mongoose = require("mongoose");
const mongoosePaginate = require("mongoose-paginate-v2");

const ImageSchema = new mongoose.Schema({
  url: String,
  filename: String,
});
const VariationSchema = new mongoose.Schema({
  varType: String,
  value: String,
  quantity: Number,
});

ImageSchema.virtual("thumbnail").get(function () {
  return this.url.replace("/upload", "/upload/w_200");
});
const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },

    images: [ImageSchema],
    origin: String,
    category: String,
    description: String,
    price: Number,
    countInStock: { type: Number, required: true, default: 0 },
    rating: { type: Number, default: 0 },
    numReviews: { type: Number, default: 0 },
    variation: [VariationSchema],
    sku: String,
    tag: String,
    hotDeal: { type: Boolean, default: false },
    reviews: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Review",
      },
    ],
  },
  {
    timestamps: true,
  }
);
productSchema.plugin(mongoosePaginate);
module.exports = mongoose.model("Product", productSchema);
