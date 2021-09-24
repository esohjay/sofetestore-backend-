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
    const batch = req.query.batch || "";
    const origin = req.query.origin || "";
    const costMin =
      req.query.costMin && Number(req.query.costMin) !== 0
        ? Number(req.query.costMin)
        : 0;
    const costMax =
      req.query.costMax && Number(req.query.costMax) !== 0
        ? Number(req.query.costMax)
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
    const costFilter =
      costMin && costMax ? { cost: { $gte: costMin, $lte: costMax } } : {};
    const dateFilter =
      dateMin && dateMax ? { date: { $gte: dateMin, $lte: dateMax } } : {};
    const originFilter = origin ? { origin } : {};
    const options = {
      sort: { createdAt: -1 },
      populate: "proudcts",
      limit: 2,
      page: req.query.page,
    };
    const inventory = await Inventory.paginate({
      ...batchFilter,
      ...costFilter,
      ...dateFilter,
      ...originFilter,
    });
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
