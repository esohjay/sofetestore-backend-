const express = require("express");
const expressAsyncHandler = require("express-async-handler");
//import Product from "../../frontend/src/components/Product.js";
const Wishlist = require("../models/wishlistModel.js");
const Product = require("../models/productModels.js");
//import { isAuth } from "../utils.js";

const wishlistRouter = express.Router();

wishlistRouter.post(
  "/:id",
  expressAsyncHandler(async (req, res) => {
    const { id } = req.params;
    const { size, wishlistId } = req.body;

    if (wishlistId === "empty") {
      const wishlist = new Wishlist({
        items: [{ productId: id, quantity: 1, size: size }],
      });
      //req.session.wishlistId = wishlist._id;
      await wishlist.save();
      res.status(201).send({ idWishlist: wishlist._id, wishlistId });
    } else {
      //const idWishlist = req.session.wishlistId;
      const wishlist = await Wishlist.findById({ _id: wishlistId });
      const existingItem = wishlist.items.find(
        (item) => item.productId === id && item.size === size
      );
      if (existingItem) {
        // increment quantity and save cart
        existingItem.quantity++;
      } else {
        // add new product id to items array
        wishlist.items.push({
          productId: id,
          quantity: 1,
          size: size,
          myProduct: id,
        });
      }
      await wishlist.save();
      res.status(201).send({ idWishlist: wishlistId });
    }
  })
);

// Receive a GET request to show all items in wishlist
wishlistRouter.get("/wishlistitems/:id", async (req, res) => {
  const { id } = req.params;
  if (id === "empty") {
    res.send({ message: "Your Wishlist is Empty", myWishlistItems: [] });
  } else {
    const wishlistItems = await Wishlist.findOne({
      _id: id,
    });
    const wishlistId = wishlistItems.id;
    for (let item of wishlistItems.items) {
      const product = await Product.findById(item.productId);
      if (product) {
        let varValue = product.variation.find(
          (prodVar) => prodVar.value === item.size
        );
        const newProduct = {
          name: product.name,
          price: product.price,
          qty: product.countInStock,
          images: product.images,
          id: product._id,
          variation: varValue.quantity,
        };
        item.product = newProduct;
      }
    }
    res.send({
      myWishlistItems: wishlistItems.items,
      wishlistId,
    });
  }
});

// Receive a GET request to show all items in wishlist
wishlistRouter.get(
  "/findwishlist/:wishlist",
  expressAsyncHandler(async (req, res) => {
    const { wishlist } = req.params;
    if (wishlist.match(/^[0-9a-fA-F]{24}$/)) {
      const wishlistItems = await Wishlist.findOne({ _id: wishlist });
      if (!wishlistItems) {
        res.send({ myWishlistItems: "No item" });
      } else {
        for (let item of wishlistItems.items) {
          const product = await Product.findById(item.productId);
          if (product) {
            const newProduct = {
              name: product.name,
              price: product.price,
              qty: product.countInStock,
              images: product.images,
              id: product._id,
            };
            item.product = newProduct;
          }
        }

        res.send({
          myWishlistItems: wishlistItems.items,
        });
      }
    } else {
      res.send({ myWishlistItems: "No item" });
    }
  })
);

//clear all wishlist items
wishlistRouter.put(
  "/:id",
  expressAsyncHandler(async (req, res) => {
    const { id } = req.params;
    if (id) {
      const wishlistItems = await Wishlist.findByIdAndUpdate(id, {
        items: [],
      });
      const emptyWishlist = await wishlistItems.save();
      res.status(200).send({ message: "Cart items removed ", emptyWishlist });
    }
  })
);

wishlistRouter.put(
  "/update/:id",
  expressAsyncHandler(async (req, res) => {
    const { id } = req.params;
    const { size, qty, wishlistId } = req.body;
    //find out the user's wishlist
    const wishlist = await Wishlist.findById(wishlistId);
    //determine the particular particular product the user is trying to update from the list of products in the wishlist
    let existingItem = wishlist.items.find(
      (item) => item.productId === id && item.size === size
    );
    //get the product dtails from database
    const product = await Product.findById(id);
    //get the size of the product
    let varValue = product.variation.find((item) => item.value === size);
    // const removedItem = cart.items.filter((item) => item.productId !== id)

    //if user type the quantity of product
    if (qty >= 1) {
      //check if the quantity the user want to order is not greater than the available quantity
      if (qty <= varValue.quantity) {
        //if its lesser, user is good to go
        existingItem.quantity = qty;
      } else {
        //if its more than available, make the quantity to be the quantity available in stock
        existingItem.quantity = varValue.quantity;
      }

      // await cart.updateOne({item: existingItem});
      await wishlist.save();
    }
    //if user click the + btn, qty value is 0.5 so we know we have to increment
    if (qty === 0.5) {
      // increase quantity and save cart
      existingItem.quantity++;

      await wishlist.save();
    }
    //if user click the - btn, qty value is 0.3 so we know we have to decrement
    if (qty === 0.3) {
      // decrease quantity and save cart
      existingItem.quantity--;

      await wishlist.save();
    }
    if (qty === 0) {
      let prodArr = [];
      for (let item of wishlist.items) {
        //check if product id matches any of the products in the cart
        if (
          (item.productId === id && item.size !== size) ||
          (item.productId !== id && item.size !== size) ||
          (item.productId !== id && item.size === size)
        ) {
          //Push any product id that does not match the id we want to delete into prdArr
          const wantedProduct = {
            productId: item.productId,
            quantity: item.quantity,
            size: item.size,
          };
          prodArr.push(wantedProduct);
        }
      }
      //change the value of cart.items to the newly created array i.e prodArr and save
      wishlist.items = prodArr;

      await wishlist.save();
    }

    res.status(201).send({
      wishlist,
      qty,
      size,
      existingItem,
      ab: existingItem.quantity,
    });
  })
);
module.exports = wishlistRouter;
