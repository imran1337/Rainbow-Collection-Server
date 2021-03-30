require("dotenv").config();
const express = require("express");
const app = express();
const port = process.env.PORT || 5000;

app.get("/", (req, res) => res.send(`YAY server working!`));

app.listen(port, () =>
  console.log(`server started at http://localhost:${port}`)
);
