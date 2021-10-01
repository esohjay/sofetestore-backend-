const express = require("express");
const expressAsyncHandler = require("express-async-handler");
const Order = require("../models/orderModel.js");
const Sales = require("../models/salesModel.js");
const Product = require("../models/productModels.js");
const { isAuth, isAdmin } = require("../utils.js");
const nodemailer = require("nodemailer");
const { google } = require("googleapis");
const OAuth2 = google.auth.OAuth2;
const orderRouter = express.Router();
const oauth2Client = new OAuth2(
  process.env.CLIENT_ID, // ClientID
  process.env.CLIENT_SECRET, // Client Secret
  "https://developers.google.com/oauthplayground" // Redirect URL
);
oauth2Client.setCredentials({
  refresh_token: process.env.REFRESH_TOKEN,
});
const accessToken = oauth2Client.getAccessToken();

orderRouter.post(
  "/",
  isAuth,
  expressAsyncHandler(async (req, res) => {
    const { name, email } = req.body;
    if (req.body.items.length === 0) {
      res.status(400).send({ message: "Cart is empty" });
    } else {
      const order = new Order({
        items: req.body.items,
        shippingAddress: req.body.shippingAddress,
        shippingMethod: req.body.shippingMethod,
        itemsPrice: req.body.itemsPrice,
        shippingFee: req.body.shippingFee,
        // taxPrice: req.body.taxPrice,
        totalPrice: req.body.totalPrice,
        user: req.user._id,

        deliveryStatus: "Pending",
        isPaid: true,
        paidAt: Date.now(),
      });
      order.trackingNo = order.id.slice(14);
      order.deliveryTimeline.push({ status: "Pending", date: Date.now() });
      const createdOrder = await order.save();
      for (let order of createdOrder.items) {
        const price = order.quantity * order.product.price;
        const sales = new Sales({
          quantity: order.quantity,
          price,
          name: order.product.name,
          customerName: createdOrder.shippingAddress.fullName,
          customerPhone: createdOrder.shippingAddress.phone,
          date: Date.now(),
          size: order.size,
          batch: "Not Yet Assigned",
          img: order.product.images[0].url,
          description: `${order.quantity} of this item was sold on the website to ${createdOrder.shippingAddress.fullName}. The item was delivered to ${createdOrder.shippingAddress.address},${createdOrder.shippingAddress.city}. Order can be tracked with ${createdOrder.trackingNo} to get more details of this sale.`,
        });
        await sales.save();
      }
      for (let item of createdOrder.items) {
        const product = await Product.findById(item.productId);
        let checkSize = product.variation.find(
          (prodSize) => prodSize.value === item.size
        );
        if (checkSize) {
          checkSize.quantity -= item.quantity;
          product.countInStock = product.variation.reduce(
            (a, c) => a + c.quantity,
            0
          );
        }
        await product.save();
      }
      const smtpTransport = nodemailer.createTransport({
        service: "gmail",
        auth: {
          type: "OAuth2",
          user: process.env.EMAIL,
          clientId: process.env.CLIENT_ID,
          clientSecret: process.env.CLIENT_SECRET,
          refreshToken: process.env.REFRESH_TOKEN,
          accessToken: accessToken,
        },
        tls: {
          rejectUnauthorized: false,
        },
      });

      const output = `<h3>Dear ${name},</h3>
  <p>Your order on Sofete Store has been placed successfully and it is being processed. Your order details are listed below, you will be contacted to arrange for delivery. Thanks for your patronage.</p>
  <ul>
    <li>Receiver's Name: ${createdOrder.shippingAddress.fullName}</li>
    <li> Receiver's Email: ${email}</li>
    <li>Phone: ${createdOrder.shippingAddress.phone}</li>
    <li>Address: ${createdOrder.shippingAddress.address}</li>
    <li>Shipping Method: ${createdOrder.shippingMethod}</li>
    <li>Tracking Number: ${createdOrder.trackingNo}</li>
    <li>Total Amount Paid: ${createdOrder.totalPrice}</li>
  </ul>
  <p>For further enquiry, you can text/call/Whatsapp us on +2348079588943 or send us an email on sofetecontact@gmail.com.</p>`;

      const buyerMsg = {
        to: `${email},sofetecontact@gmail.com`,

        from: process.env.EMAIL,
        subject: "Order Successfully created",
        html: output,
      };

      await smtpTransport.sendMail(buyerMsg, (error, response) => {
        error ? console.log(error) : console.log(response);
        smtpTransport.close();
      });
      res
        .status(201)
        .send({ message: "New Order Created", order: createdOrder });
    }
  })
);
orderRouter.get(
  "/:id",

  expressAsyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.id);
    if (order) {
      res.send(order);
    } else {
      res.status(404).send({ message: "Order Not Found" });
    }
  })
);

orderRouter.get(
  "/:id/track",

  expressAsyncHandler(async (req, res) => {
    const order = await Order.findOne({ trackingNo: req.params.id });
    if (order) {
      res.send(order);
    } else {
      res.status(404).send({ message: "Order Not Found" });
    }
  })
);
orderRouter.get(
  "/",
  isAuth,
  expressAsyncHandler(async (req, res) => {
    const options = {
      sort: { createdAt: -1 },
      limit: 20,
      page: req.query.page,
    };
    const orders = await Order.paginate({ user: req.user._id }, options);
    res.send(orders);
  })
);
orderRouter.get(
  "/order/all",
  isAuth,
  isAdmin,
  expressAsyncHandler(async (req, res) => {
    const options = {
      sort: { createdAt: -1 },
      populate: "user",
      limit: 20,
      page: req.query.page,
    };
    const orders = await Order.paginate({}, options);
    res.send(orders);
  })
);
orderRouter.delete(
  "/:id",
  isAuth,
  isAdmin,
  expressAsyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.id);
    if (order) {
      const deleteOrder = await order.remove();
      res.send({ message: "Order Deleted", order: deleteOrder });
    } else {
      res.status(404).send({ message: "Order Not Found" });
    }
  })
);

orderRouter.put(
  "/:id/deliver",
  isAuth,
  isAdmin,
  expressAsyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.id);
    const { status } = req.body;

    if (order) {
      order.deliveryStatus = status;
      order.deliveryTimeline.push({ status: status, date: Date.now() });
      if (status === "Delivered") {
        order.isDelivered = true;
        order.deliveredAt = Date.now();
      }
      const updatedOrder = await order.save();
      res.send({ message: "Order Delivered", order: updatedOrder });
    } else {
      res.status(404).send({ message: "Order Not Found" });
    }
  })
);
module.exports = orderRouter;
