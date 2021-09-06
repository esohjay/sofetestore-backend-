const mongoose = require("mongoose");

/*const cartSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
    },
    quantity: Number,
  },
  {
    timestamps: true,
  }
);*/

const cartSchema = new mongoose.Schema(
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
module.exports = mongoose.model("Cart", cartSchema);
