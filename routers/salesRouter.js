const express = require("express");
const expressAsyncHandler = require("express-async-handler");
//import Product from "../../frontend/src/components/Product.js";
const Sales = require("../models/salesModel.js");
const Product = require("../models/productModels.js");
const { isAuth, isAdmin } = require("../utils.js");

const salesRouter = express.Router();

salesRouter.post(
  "/",
  isAuth,
  isAdmin,
  expressAsyncHandler(async (req, res) => {
    const {
      product,
      quantity,
      batch,
      price,
      date,
      size,
      description,
      customerName,
      customerPhone,
    } = req.body;
    const sales = new Sales({
      name: product.name,
      sku: product.sku,
      quantity,
      img: product.images[0].url,
      price,
      batch,
      description,
      date,
      size,
      customerName,
      customerPhone,
    });
    await sales.save();

    const foundProduct = await Product.findById(product._id);
    let checkSize = foundProduct.variation.find(
      (prodSize) => prodSize.value === sales.size
    );
    if (checkSize) {
      checkSize.quantity -= sales.quantity;
      foundProduct.countInStock = foundProduct.variation.reduce(
        (a, c) => a + c.quantity,
        0
      );
    }
    await foundProduct.save();

    res.send(sales);
  })
);

// Receive a GET request to show all sales
salesRouter.get(
  "/",
  isAuth,
  isAdmin,
  expressAsyncHandler(async (req, res) => {
    const sales = await Sales.find({});
    res.send(sales);
  })
);

salesRouter.get(
  "/:id",
  isAuth,
  isAdmin,
  expressAsyncHandler(async (req, res) => {
    const { id } = req.params;
    const sales = await Sales.findById(id);
    res.send(sales);
  })
);
salesRouter.get(
  "/batch/:batch",
  isAuth,
  isAdmin,
  expressAsyncHandler(async (req, res) => {
    const { batch } = req.params;
    const sales = await Sales.find({ batch: batch });
    res.send(sales);
  })
);

salesRouter.put(
  "/:id",
  isAuth,
  isAdmin,
  expressAsyncHandler(async (req, res) => {
    const { id } = req.params;

    const sales = await Sales.findByIdAndUpdate(id, { ...req.body });
    await sales.save();
    res.send(sales);
  })
);

salesRouter.delete(
  "/:id",
  isAuth,
  isAdmin,
  expressAsyncHandler(async (req, res) => {
    const { id } = req.params;
    const sales = await Sales.findByIdAndDelete(id);
    res.send(sales);
  })
);
module.exports = salesRouter;
