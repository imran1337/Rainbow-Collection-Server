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
    `mongodb+srv://rainbowAdmin:rainbowAdmin1337@cluster0.klaju.mongodb.net/rainbowdb?retryWrites=true&w=majority&ssl=true`,
    {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }
  )
  .catch((error) => console.log(error));

mongoose.connection.on("error", (err) => console.log(err));
mongoose.connection.once("open", () => {
  console.log("i am connected boss");
});

const productSchema = new Schema({
  name: { type: String, require: true },
  size: { type: Array, default: ["XS", "S", "M", "L", "XL", "XXL"] },
  price: { type: Number, require: true },
  imageURL: { type: String, require: true },
  createdAt: { type: Date, default: Date.now },
});
const Product = mongoose.model("Product", productSchema);

const orderSchema = new Schema({
  userName: { type: String, require: true },
  email: { type: String, require: true },
  productId: { type: String, require: true },
  createdAt: { type: Date, default: Date.now },
});
const Order = mongoose.model("Order", orderSchema);

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

app.post("/submit-order", async (req, res) => {
  try {
    const userAuthToken = req.headers.authorization;
    const { userName, email, productId } = await req.body;
    const idToken = userAuthToken.split(" ")[1];
    const verifyToken = await admin.auth().verifyIdToken(idToken);
    if (
      userAuthToken.includes("Bearer ") !== true ||
      verifyToken.email !== email
    ) {
      return res.status(401).send({ success: false, msg: "Unauthorized" });
    }

    const newOrder = new Order({ userName, email, productId });
    const response = await Order.create(newOrder);
    // console.log(response);
    res.send(response);
  } catch (error) {
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

app.post(`/get-product-details-by-id`, async (req, res) => {
  const productIdCollection = req.body;

  try {
    const response = await Product.find({
      _id: { $in: productIdCollection },
    });
    res.send(response);
  } catch (error) {
    console.log(error);
  }
});

app.listen(port, () =>
  console.log(`server started at http://localhost:${port}`)
);

/****
 * server link
 * https://nameless-lowlands-72199.herokuapp.com/
 */
