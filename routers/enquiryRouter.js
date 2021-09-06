const express = require("express");
const expressAsyncHandler = require("express-async-handler");

const Subscribe = require("../models/subscribeModel.js");
const nodemailer = require("nodemailer");
const { google } = require("googleapis");
const OAuth2 = google.auth.OAuth2;

const enquiryRouter = express.Router();

const oauth2Client = new OAuth2(
  process.env.CLIENT_ID, // ClientID
  process.env.CLIENT_SECRET, // Client Secret
  "https://developers.google.com/oauthplayground" // Redirect URL
);
oauth2Client.setCredentials({
  refresh_token: process.env.REFRESH_TOKEN,
});
const accessToken = oauth2Client.getAccessToken();

enquiryRouter.post(
  "/",
  expressAsyncHandler(async (req, res) => {
    const { message, phone, name, email } = req.body;

    const output = `
  <h3>Contact details</h3>
  <ul>
    <li>Name: ${name}</li>
    <li>Email: ${email}</li>
    <li>Phone: ${phone}</li>
  </ul>
  <h3>Message</h3>
<p>${message}</p>`;
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
    const msg = {
      to: "sofetecontact@gmail.com",
      from: process.env.EMAIL,
      subject: "New Message on Sofete Store",
      html: output,
    };
    await smtpTransport.sendMail(msg, (error, response) => {
      error ? console.log(error) : console.log(response);
      smtpTransport.close();
    });
    res.status(201).send({ message: "Message Received" });
  })
);

enquiryRouter.post(
  "/subscribe",
  expressAsyncHandler(async (req, res) => {
    const { email } = req.body;
    const subscribe = new Subscribe({ email });
    subscribe.save();
    const output = `
  <h3>Thanks For Your Subscription</h3>
  
<p>We will always keep you updated. Welcome to sofete store.</p>`;
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
    const msg = {
      to: email,
      from: process.env.EMAIL,
      subject: "Welcome on board",
      html: output,
    };
    await smtpTransport.sendMail(msg, (error, response) => {
      error ? console.log(error) : console.log(response);
      smtpTransport.close();
    });
    res.status(201).send({ message: "Message Received" });
  })
);

module.exports = enquiryRouter;
