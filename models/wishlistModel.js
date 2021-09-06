const mongoose = require("mongoose");

const wishlistSchema = new mongoose.Schema(
  {
    items: [
      {
        productId: String,
        product: {
          name: String,
          price: Number,
          qty: Number,
          images: Array,
          id: String,
          variation: Number,
        },

        quantity: Number,
        size: String,
      },
    ],
  },
  {
    timestamps: true,
  }
);
module.exports = mongoose.model("Wishlist", wishlistSchema);
