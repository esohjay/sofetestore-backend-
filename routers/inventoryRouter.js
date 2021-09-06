const express = require("express");
const expressAsyncHandler = require("express-async-handler");

const Inventory = require("../models/inventoryModel.js");
const Product = require("../models/productModels.js");
const Sales = require("../models/salesModel.js");

const { isAdmin, isAuth } = require("../utils.js");

const inventoryRouter = express.Router();

inventoryRouter.post(
  "/",
  isAuth,
  isAdmin,
  expressAsyncHandler(async (req, res) => {
    const { batch, cost, description, origin, quantity, date } = req.body;
    const batchExist = await Inventory.findOne({ batch: batch });
    if (batchExist) {
      res.status(401).send({ message: "Batch alreaady exists" });
    } else {
      const inventory = new Inventory({
        batch,
        cost,
        description,
        origin,
        quantity,
        date,
      });
      const newInventory = await inventory.save();
      res.send(newInventory);
    }
  })
);

inventoryRouter.get(
  "/",
  isAuth,
  isAdmin,
  expressAsyncHandler(async (req, res) => {
    const inventory = await Inventory.find({}).populate("products");
    res.send(inventory);
  })
);

inventoryRouter.get(
  "/:id",
  isAuth,
  isAdmin,
  expressAsyncHandler(async (req, res) => {
    const { id } = req.params;
    const inventory = await Inventory.findById(id).populate("sales");
    const products = await Product.find({});
    const sales = await Sales.find({ batch: inventory.batch });
    if (!inventory || !products) {
      res
        .status(401)
        .send({ message: "Batch does not exist or no product available" });
    } else {
      const qtySold = sales.reduce((a, c) => a + c.quantity, 0);
      const totalPrice = sales.reduce((a, c) => a + c.price, 0);
      const remProduct = inventory.quantity - qtySold;
      const netProfit = totalPrice - inventory.cost;
      const analysis = { qtySold, totalPrice, remProduct, netProfit };
      res.send({ inventory, products, sales, analysis });
    }
  })
);

inventoryRouter.put(
  "/addsales/:id",
  isAuth,
  expressAsyncHandler(async (req, res) => {
    const { id } = req.params;
    const {
      product,
      quantity,
      batch,
      price,
      description,
      customerName,
      customerPhone,
      date,
    } = req.body;
    const inventory = await Inventory.findById(id);
    const sales = new Sales({
      name: product.name,
      sku: product.sku,
      quantity,
      img: product.images[0].url,
      price,
      batch,
      description,
      customerName,
      customerPhone,
      date,
    });
    inventory.sales.push(sales);

    const newSales = await sales.save();
    const newInventory = await inventory.save();
    res.send({ newSales, newInventory });
  })
);

inventoryRouter.put(
  "/:id",
  expressAsyncHandler(async (req, res) => {
    const { id } = req.params;

    const inventory = await Inventory.findByIdAndUpdate(id, { ...req.body });
    await inventory.save();
    res.send(inventory);
  })
);

inventoryRouter.delete(
  "/:id",
  isAuth,
  isAdmin,
  expressAsyncHandler(async (req, res) => {
    const { id } = req.params;
    const inventory = await Inventory.findByIdAndDelete(id);
    res.send(inventory);
  })
);

module.exports = inventoryRouter;
