require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const app = express();
const port = process.env.PORT || 5000;
const { Schema } = mongoose;
const admin = require("firebase-admin");
const serviceAccount = require("./rainbow-collection-firebase-adminsdk-bcsqw-2062d3695b.json");

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

mongoose
  .connect(
    `mongodb+srv://${process.env.MONGODB_USER}:${process.env.MONGODB_PASSWORD}@cluster0.klaju.mongodb.net/rainbowdb?retryWrites=true&w=majority&ssl=true`,
    {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useFindAndModify: false,
    }
  )
  .catch((error) => console.log(error));

mongoose.connection.on("error", (err) => console.log(err));
mongoose.connection.once("open", () => {
  console.log("i am connected boss");
});

const productSchema = new Schema({
  name: { type: String, require: true },
  size: { type: Array },
  price: { type: Number, require: true },
  imageURL: { type: String, require: true },
  createdAt: { type: Date, default: Date.now },
});
const Product = mongoose.model("Product", productSchema);

const orderSchema = new Schema({
  name: { type: String, require: true },
  email: { type: String, require: true },
  products: { type: Array, require: true },
  quantity: { type: Number, require: true },
  createdAt: { type: Date, default: Date.now },
});
const Order = mongoose.model("Order", orderSchema);

const cartSchema = new Schema({
  userName: { type: String, require: true },
  email: { type: String, require: true },
  productId: { type: String, require: true },
  createdAt: { type: Date, default: Date.now },
});
const Cart = mongoose.model("Cart", cartSchema);

app.get("/", (req, res) => res.send(`YAY server working!`));

app.post(`/add-product`, async (req, res) => {
  const { name, size, price, imageURL } = await req.body;
  const newProduct = new Product({ name, size, price, imageURL });

  try {
    const response = await Product.create(newProduct);
    res.send(response);
  } catch (error) {
    console.log(error);
    res.send(error);
  }
});

app.get(`/get-product`, async (req, res) => {
  try {
    const response = await Product.find();
    res.send(response);
  } catch (error) {
    console.log(error);
    res.send(error);
  }
});

app.delete(`/remove-product`, async (req, res) => {
  try {
    const { _id } = req.body;
    const response = await Product.findByIdAndDelete({ _id });
    if (response._id) {
      res.send({
        success: "true",
        msg: `${response.name} deleted successfully`,
      });
    }
  } catch (error) {
    console.log(error);
    res.send(error);
  }
});

app.post("/add-to-cart", async (req, res) => {
  try {
    const userAuthToken = req.headers.authorization;
    // console.log(userAuthToken)
    const { userName, email, productId } = await req.body;
    const idToken = userAuthToken.split(" ")[1];
    const verifyToken = await admin.auth().verifyIdToken(idToken);
    if (
      userAuthToken.includes("Bearer ") !== true ||
      verifyToken.email !== email
    ) {
      return res
        .status(401)
        .send({ success: false, msg: "Something went wrong" });
    }

    const newCart = new Cart({ userName, email, productId });
    const response = await Cart.create(newCart);
    // console.log(response);
    res.send({ success: true, msg: "Product Added" });
  } catch (error) {
    console.log(error);
  }
});

app.post("/submit-order", async (req, res) => {
  try {
    const userAuthToken = req.headers.authorization;
    const { name, email, products, quantity, totalPrice } = await req.body;
    const idToken = userAuthToken.split(" ")[1];
    const verifyToken = await admin.auth().verifyIdToken(idToken);
    if (
      userAuthToken.includes("Bearer ") !== true ||
      verifyToken.email !== email
    ) {
      return res
        .status(401)
        .send({ success: false, msg: "Something went wrong" });
    }

    const newOrder = new Order({ name, email, products, quantity, totalPrice });
    const response = await Order.create(newOrder);
    const deleteCartProduct = await Cart.deleteMany({ email });
    // console.log(response);
    res.send({ success: true, msg: "Order Submited" });
  } catch (error) {
    console.log(error);
  }
});

app.get("/get-cart-products", async (req, res) => {
  const userAuthToken = req.headers.authorization;
  const idToken = userAuthToken.split(" ")[1];
  if (userAuthToken.includes("Bearer ") !== true) {
    return res.status(401).send({ success: false, msg: "Unauthorized" });
  }

  try {
    const verifyToken = await admin.auth().verifyIdToken(idToken);
    const response = await Cart.find({ email: verifyToken.email });
    // console.log(response);
    res.send(response);
  } catch (error) {
    res.send(error);
    console.log(error);
  }
});

app.get("/get-orders", async (req, res) => {
  const userAuthToken = req.headers.authorization;
  const idToken = userAuthToken.split(" ")[1];
  if (userAuthToken.includes("Bearer ") !== true) {
    return res.status(401).send({ success: false, msg: "Unauthorized" });
  }

  try {
    const verifyToken = await admin.auth().verifyIdToken(idToken);
    const response = await Order.find({ email: verifyToken.email });
    // console.log(response);
    res.send(response);
  } catch (error) {
    res.send(error);
    console.log(error);
  }
});

app.post("/delete-cart-product", async (req, res) => {
  const userAuthToken = req.headers.authorization;
  const { _id, email } = await req.body;
  // console.log(req.body);
  const idToken = userAuthToken.split(" ")[1];
  const verifyToken = await admin.auth().verifyIdToken(idToken);
  if (
    userAuthToken.includes("Bearer ") !== true ||
    verifyToken.email !== email
  ) {
    return res.status(401).send({ success: false, msg: "Unauthorized" });
  }

  try {
    const response = await Cart.find({ _id });
    // console.log(response);
    res.send(response);
  } catch (error) {
    res.send(error);
    console.log(error);
  }
});

app.post(`/get-product-details-by-id`, async (req, res) => {
  const productIdCollection = req.body;
  console.log(productIdCollection);
  try {
    const response = await Product.find({
      _id: { $in: productIdCollection },
    });
    res.send(response);
    // console.log(response);
  } catch (error) {
    console.log(error);
  }
});

app.get(`/get-single-product-details-by-id/:_id`, async (req, res) => {
  const { _id } = req.params;
  // console.log(req.params);
  try {
    const response = await Product.find({ _id });
    res.send(response[0]);
    // console.log(response[0]);
  } catch (error) {
    console.log(error);
  }
});

app.patch("/edit-product-by-id/:_id", async (req, res) => {
  try {
    console.log(req.body);
    const { _id } = req.params;
    const response = await Product.findByIdAndUpdate(
      { _id },
      { $set: req.body }
    );
    res.send({ success: true, msg: "Product Updated" });
  } catch (error) {
    console.log(error);
    res.send(error);
  }
});

app.listen(port, () =>
  console.log(`server started at http://localhost:${port}`)
);