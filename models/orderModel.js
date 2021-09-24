const mongoose = require("mongoose");
const mongoosePaginate = require("mongoose-paginate-v2");
/*const orderSchema = new mongoose.Schema(
  {
    orderItems: [
      {
        name: { type: String, required: true },
        qty: { type: Number, required: true },
        image: { type: String, required: true },
        price: { type: Number, required: true },
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
      },
    ],
    shippingAddress: {
      fullName: { type: String, required: true },
      address: { type: String, required: true },
      city: { type: String, required: true },
      postalCode: { type: String, required: true },
      country: { type: String, required: true },
    },
    paymentMethod: { type: String, required: true },
    itemsPrice: { type: Number, required: true },
    shippingPrice: { type: Number, required: true },
    taxPrice: { type: Number, required: true },
    totalPrice: { type: Number, required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    isPaid: { type: Boolean, default: false },
    trackingNo: String,
    deliveryStatus: String,
    paidAt: { type: Date },
    isDelivered: { type: Boolean, default: false },
    deliveredAt: { type: Date },
  },
  {
    timestamps: true,
  }
);*/

const orderSchema = new mongoose.Schema(
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
        },
        quantity: Number,
        size: String,
      },
    ],
    shippingFee: Number,
    totalPrice: Number,
    itemsPrice: { type: Number },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    isPaid: { type: Boolean, default: false },
    trackingNo: String,
    deliveryStatus: String,
    deliveryTimeline: [
      {
        status: String,
        date: Date,
      },
    ],
    paidAt: Date,
    isDelivered: { type: Boolean, default: false },
    deliveredAt: Date,
    shippingMethod: String,
    shippingAddress: {
      fullName: String,
      address: String,
      city: String,
      phone: Number,
      state: String,
      landmark: String,
    },
  },
  {
    timestamps: true,
  }
);
orderSchema.plugin(mongoosePaginate);
module.exports = mongoose.model("Order", orderSchema);
