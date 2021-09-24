const express = require("express");
const expressAsyncHandler = require("express-async-handler");
//import { searchAndFilter } from "../logic.js";
const data = require("../data.js");
const Product = require("../models/productModels.js");
const Review = require("../models/reviewModel.js");
const { isAuth } = require("../utils.js");
const multer = require("multer");
const { storage, cloudinary } = require("../cloudinary");

const productRouter = express.Router();

const upload = multer({ storage });
productRouter.get(
  "/",
  expressAsyncHandler(async (req, res) => {
    const name = req.query.name || "";
    const nameSku = req.query.nameSku || "";
    const category = req.query.category || "";
    const tag = req.query.tag || "";
    const order = req.query.order || "";
    const page = req.query.page;
    const min =
      req.query.priceMin && Number(req.query.priceMin) !== 0
        ? Number(req.query.priceMin)
        : 0;
    const max =
      req.query.priceMax && Number(req.query.priceMax) !== 0
        ? Number(req.query.priceMax)
        : 0;
    const rating =
      req.query.avRating && Number(req.query.avRating) !== 0
        ? Number(req.query.avRating)
        : 0;

    const nameFilter = name ? { name: { $regex: name, $options: "i" } } : {};
    const nameSkuFilter = nameSku
      ? {
          $or: [
            { name: { $regex: nameSku, $options: "i" } },
            { sku: { $regex: nameSku, $options: "i" } },
          ],
        }
      : {};
    const categoryFilter = category ? { category } : {};
    const tagFilter = tag ? { tag } : {};
    const priceFilter = min && max ? { price: { $gte: min, $lte: max } } : {};
    const ratingFilter = rating ? { rating: { $gte: rating } } : {};
    const sortOrder =
      order === "lowest"
        ? { price: 1 }
        : order === "highest"
        ? { price: -1 }
        : order === "toprated"
        ? { rating: -1 }
        : { _id: -1 };
    const options = {
      page: page,
      limit: 2,
      sort: sortOrder || { createdAt: -1 },
    };
    const products = await Product.paginate(
      {
        ...nameFilter,
        ...nameSkuFilter,
        ...priceFilter,
        ...categoryFilter,
        ...tagFilter,
        ...ratingFilter,
      },
      options
    );

    res.send(products);
  })
);

productRouter.get(
  "/:id",
  expressAsyncHandler(async (req, res) => {
    const product = await Product.findById(req.params.id).populate("reviews");
    if (product) {
      res.send(product);
    } else {
      res.status(404).send({ message: "Product Not Found", user: req.user });
    }
  })
);

productRouter.post(
  "/",

  expressAsyncHandler(async (req, res) => {
    const product = new Product({
      origin: req.body.origin,
      name: req.body.name,
      category: req.body.category,
      description: req.body.description,
      price: req.body.price,
      sku: req.body.sku,
      size: req.body.size,
      tag: req.body.tag,
    });

    const createdProduct = await product.save();
    res.send(createdProduct);
  })
);
productRouter.post(
  "/:id/variation",

  expressAsyncHandler(async (req, res) => {
    const id = req.body._id;
    const product = await Product.findById(id);
    product.variation.push(req.body.variations);
    product.countInStock = product.variation.reduce(
      (a, c) => a + c.quantity,
      0
    );
    product.save();

    res.send({ product, body: req.body });
  })
);

// edit product
productRouter.put(
  "/:id",
  expressAsyncHandler(async (req, res) => {
    const { id } = req.params;

    const product = await Product.findById(id);
    if (!req.body.variation) {
      await product.updateOne({ ...req.body });
    } else {
      product.variation.push(req.body.variation);
      product.countInStock = product.variation.reduce(
        (a, c) => a + c.quantity,
        0
      );
    }

    const updatedProduct = await product.save();
    res.send(updatedProduct);
  })
);
// manage image
productRouter.put(
  "/:id/manageimages",
  expressAsyncHandler(async (req, res) => {
    const { id } = req.params;
    const img = req.body.images;
    const toBeDeletedImg = req.body.toBeDeleted;
    const product = await Product.findById(id);
    if (img) {
      const imgs = img.map((f) => ({
        url: f.url,
        filename: f.filename,
      }));
      product.images.push(...imgs);
      await product.save();
    }
    if (req.body.toBeDeleted) {
      for (let filename of req.body.toBeDeleted) {
        try {
          await cloudinary.uploader.destroy(filename);
        } catch (err) {
          res.send(err);
        }
      }
      await product.updateOne({
        $pull: { images: { filename: { $in: toBeDeletedImg } } },
      });
      // await product.save();
    }
    // const updatedProduct = await product.save();
    res.send(product);
  })
);
productRouter.put(
  "/variationupdate/:id",
  expressAsyncHandler(async (req, res) => {
    const { id, varId, qty } = req.body;
    //find product that needs update
    const product = await Product.findById(id);
    //get the variation value that needs update
    let variationItem = product.variation.find((item) => item.id === varId);

    //if user input value instead of clicking the - or + btn,
    if (qty >= 1 || qty === 0) {
      variationItem.quantity = qty;
      product.countInStock = product.variation.reduce(
        (a, c) => a + c.quantity,
        0
      );
      await product.save();
    }
    //if user click the + btn, qty value is 0.5 so we know we have to increment
    if (qty === 0.5) {
      variationItem.quantity++;
      product.countInStock = product.variation.reduce(
        (a, c) => a + c.quantity,
        0
      );
      await product.save();
    }
    //if user click the + btn, qty value is 0.5 so we know we have to increment
    if (qty === 0.3) {
      variationItem.quantity--;
      product.countInStock = product.variation.reduce(
        (a, c) => a + c.quantity,
        0
      );
      await product.save();
    }
    //if user click the delete btn, qty value is 0.5 so we know we want to remove it
    if (qty === 0.1) {
      //get the variation value that needs to be deleted
      await product.updateOne({
        $pull: { variation: { _id: { $in: varId } } },
      });

      product.countInStock = product.variation.reduce(
        (a, c) => a + c.quantity,
        0
      );
      await product.save();
    }
    await product.save();
    res.send(product);
  })
);

productRouter.put(
  "/:id/hotdeal",
  expressAsyncHandler(async (req, res) => {
    const { id } = req.params;

    const product = await Product.findByIdAndUpdate(id);
    if (product.hotDeal === true) {
      product.hotDeal = false;
    } else {
      product.hotDeal = true;
    }
    product.save();

    res.send(product);
  })
);

productRouter.delete(
  "/:id",
  expressAsyncHandler(async (req, res) => {
    const { id } = req.params;
    const product = await Product.findByIdAndDelete(id);

    res.status(200).send({ message: "Product deleted ", product });
  })
);
productRouter.post(
  "/:id/reviews",
  isAuth,
  expressAsyncHandler(async (req, res) => {
    const productId = req.params.id;
    const product = await Product.findById(productId).populate("reviews");
    if (product) {
      if (product.reviews.find((x) => x.name === req.user.name)) {
        return res
          .status(400)
          .send({ message: "You already submitted a review" });
      }
      const review = new Review({
        name: req.user.name,
        rating: Number(req.body.rating),
        comment: req.body.comment,
      });
      product.reviews.push(review);
      product.numReviews = product.reviews.length;
      product.rating =
        product.reviews.reduce((a, c) => c.rating + a, 0) /
        product.reviews.length;
      await review.save();
      const updatedProduct = await product.save();

      res.status(201).send({
        message: "Review Created",
        reviewId: updatedProduct.reviews[updatedProduct.reviews.length - 1],
        review: review,
      });
    } else {
      res.status(404).send({ message: "Product Not Found" });
    }
  })
);
productRouter.post("/uploads", upload.array("file"), (req, res) => {
  const myFiles = {};
  for (let file of req.files) {
    myFiles.url = file.path;
    myFiles.filename = file.filename;
  }
  res.send(myFiles);
});

module.exports = productRouter;
