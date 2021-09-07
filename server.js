const express = require("express");
require("dotenv").config();
//const dotenv = require("dotenv");
const session = require("express-session");
const mongoose = require("mongoose");
const mongoSanitize = require("express-mongo-sanitize");
const MongoStore = require("connect-mongo");
const userRouter = require("./routers/userRouter.js");
const productRouter = require("./routers/productRouter.js");
const orderRouter = require("./routers/orderRouter.js");
const cartRouter = require("./routers/cartRouter.js");
const inventoryRouter = require("./routers/inventoryRouter.js");
const wishlistRouter = require("./routers/wishlistRouter.js");
const enquiryRouter = require("./routers/enquiryRouter.js");
const salesRouter = require("./routers/salesRouter.js");
const path = require("path");
const cors = require("cors");

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  cors({
    origin: ["https://sofetestore.herokuapp.com"],
  })
);
mongoose.connect(
  process.env.MONGODB_URL || "mongodb://localhost/sofete-store",
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
    useFindAndModify: false,
  }
);
app.use(mongoSanitize());
const secret = process.env.SECRET || "coded";
const store = MongoStore.create({
  mongoUrl: process.env.MONGODB_URL || "mongodb://localhost/sofete-store",
  secret,
  touchAfter: 24 * 60 * 60,
});
store.on("error", function (e) {
  console.log("session error", e);
});

const sessionConfig = {
  store,
  secret,
  resave: false,
  saveUninitialized: true,
  cookie: {
    httpOnly: true,
    //secure: true,
    expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
    maxAge: 1000 * 60 * 60 * 24 * 7,
  },
};
app.use(session(sessionConfig));
app.use("/api/products", productRouter);
app.use("/api/cart", cartRouter);
app.use("/api/wishlist", wishlistRouter);
app.use("/api/enquiry", enquiryRouter);
app.use("/api/users", userRouter);
app.use("/api/inventory", inventoryRouter);
app.use("/api/orders", orderRouter);
app.use("/api/sales", salesRouter);

app.get("/", (req, res) => {
  res.send("Server is ready");
});

app.use((err, req, res, next) => {
  res.status(500).send({ message: err.message });
});

const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`Serve at http://localhost:${port}`);
});
