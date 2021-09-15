const express = require("express");
const expressAsyncHandler = require("express-async-handler");
//import Product from "../../frontend/src/components/Product.js";
const Cart = require("../models/cartModel.js");
const Product = require("../models/productModels.js");
//import { isAuth } from "../utils.js";

const cartRouter = express.Router();

cartRouter.post(
  "/:id",
  expressAsyncHandler(async (req, res) => {
    const { id } = req.params;
    const { size, cartId } = req.body;

    if (!cartId) {
      const cart = new Cart({
        items: [{ productId: id, quantity: 1, size: size }],
      });
      //req.session.cartId = cart._id;
      await cart.save();
      res.status(201).send({ idCart: cart._id, cartId });
    } else {
      // const idCart = req.session.cartId;
      const cart = await Cart.findById({ _id: cartId });
      const existingItem = cart.items.find(
        (item) => item.productId === id && item.size === size
      );
      if (existingItem) {
        // increment quantity and save cart
        existingItem.quantity++;
      } else {
        // add new product id to items array
        cart.items.push({
          productId: id,
          quantity: 1,
          size: size,
          myProduct: id,
        });
      }
      await cart.save();
      res.status(201).send({ idCart: cartId });
    }
    //const idCart = req.session.cartId;
    //const cartItems = await Cart.findById(idCart).populate("product");
    //const cart = await Cart.findById({ _id: idCart });
  })
);

// Receive a GET request to show all items in cart
cartRouter.get("/cartitems/:id", async (req, res) => {
  const { id } = req.params;
  if (id === "empty") {
    res.send({ message: "Your Cart is Empty", myCartItems: [] });
  }
  if (id !== "empty") {
    const cartItems = await Cart.findOne({ _id: id }).populate("myProduct");

    for (let item of cartItems.items) {
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
      myCartItems: cartItems.items,
    });
  }
});
//clear all cart items
cartRouter.put(
  "/:id",
  expressAsyncHandler(async (req, res) => {
    const { id } = req.params;
    if (id) {
      const cartItems = await Cart.findByIdAndUpdate(id, {
        items: [],
      });
      const emptyCart = await cartItems.save();
      res
        .status(200)
        .send({ message: "Cart items removed ", cartItems, emptyCart });
    }
  })
);

cartRouter.put(
  "/update/:id",
  expressAsyncHandler(async (req, res) => {
    const { id } = req.params;
    const { size, qty, cartId } = req.body;
    //find out the user's cart
    const cart = await Cart.findById(cartId);
    //determine the particular particular product the user is trying to update  from the list of products in the cart
    let existingItem = cart.items.find(
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
      await cart.save();
    }
    //if user click the + btn, qty value is 0.5 so we know we have to increment
    if (qty === 0.5) {
      // increase quantity and save cart
      existingItem.quantity++;

      await cart.save();
    }
    //if user click the - btn, qty value is 0.3 so we know we have to decrement
    if (qty === 0.3) {
      // decrease quantity and save cart
      existingItem.quantity--;

      await cart.save();
    }
    if (qty === 0) {
      let prodArr = [];
      for (let item of cart.items) {
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
      cart.items = prodArr;

      await cart.save();
    }

    res.status(201).send({
      message: "Quantity decreased",
      cart,
      qty,
      size,
      existingItem,
      ab: existingItem.quantity,
    });
  })
);
module.exports = cartRouter;

/*cartRouter.post(
  "/:id",

  expressAsyncHandler(async (req, res) => {
    const { id } = req.params;

    const cart = new Cart({ product: id, quantity: 1 });
    await cart.save();
    res.cookie("cartId", cart._id);
    req.session.cartItems = cart._id;
    console.log(req.cookie);
    res.send(cart);
  })
);*/

/*cartRouter.put(
  "/remove/:id",
  expressAsyncHandler(async (req, res) => {
    const {id} = req.params;
    const cart = await Cart.findById(req.session.cartId);
      let prodArr = []
 for (let item of cart.items ){
   
   if(item.productId !== id){
   
     const wantedProduct = {
       productId: item.productId,
       quantity: item.quantity
     }
     prodArr.push(wantedProduct)
       
   }
 
 }
 cart.items= prodArr
 await cart.save()
   res.status(200).send({ message: "Cart items removed ", prodArr,  cart });
    
   
  })
);*/
