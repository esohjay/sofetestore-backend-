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
    const batch = req.query.batch || "";
    const page = req.query.page;
    const nameSku = req.query.nameSku || "";
    const priceMin =
      req.query.priceMin && Number(req.query.priceMin) !== 0
        ? Number(req.query.priceMin)
        : 0;
    const priceMax =
      req.query.priceMax && Number(req.query.priceMax) !== 0
        ? Number(req.query.priceMax)
        : 0;
    const dateMin =
      req.query.dateMin && req.query.dateMin !== ""
        ? new Date(req.query.dateMin)
        : "";
    const dateMax =
      req.query.dateMax && req.query.dateMax !== ""
        ? new Date(req.query.dateMax)
        : "";
    const batchFilter = batch
      ? { batch: { $regex: batch, $options: "i" } }
      : {};
    const priceFilter =
      priceMin && priceMax ? { price: { $gte: priceMin, $lte: priceMax } } : {};
    const dateFilter =
      dateMin && dateMax ? { date: { $gte: dateMin, $lte: dateMax } } : {};
    const nameSkuFilter = nameSku
      ? {
          $or: [
            { name: { $regex: nameSku, $options: "i" } },
            { sku: { $regex: nameSku, $options: "i" } },
          ],
        }
      : {};
    const options = {
      page: page,
      limit: 20,
      sort: { createdAt: -1 },
    };
    const sales = await Sales.paginate(
      {
        ...batchFilter,
        ...priceFilter,
        ...dateFilter,
        ...nameSkuFilter,
      },
      options
    );
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
