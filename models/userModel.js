const mongoose = require("mongoose");
const mongoosePaginate = require("mongoose-paginate-v2");
const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    phone: { type: Number, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    isAdmin: { type: Boolean, default: false, required: true },
    isSeller: { type: Boolean, default: false, required: true },
  },
  {
    timestamps: true,
  }
);
userSchema.plugin(mongoosePaginate);
module.exports = mongoose.model("User", userSchema);
