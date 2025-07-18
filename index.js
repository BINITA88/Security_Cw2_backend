// Importing the packages (express)
const express = require("express");
const connectDatabase = require("./database/database");
const dotenv = require("dotenv");
const cors = require("cors");
const accessFromData = require("express-fileupload");
const fs = require("fs");
const path = require("path");
const https = require("https");
const helmet = require("helmet");
const csrf = require("csurf");
const cookieParser = require("cookie-parser");

// Creating an express app
const app = express();

app.use(cookieParser());

// CSRF protection middleware
const csrfProtection = csrf({ cookie: true }); // Initialize csrfProtection

// Express Json Config
app.use(express.json());

app.use(express.static("./public"));

// Helmet Configuration
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "trusted-cdn.com"],
        styleSrc: ["'self'", "fonts.googleapis.com"],
        imgSrc: ["'self'", "data:", "trusted-cdn.com"],
      },
    },
  })
);

// express fileupload
app.use(accessFromData());

// use hpp to prevent http parameter pollution
const hpp = require("hpp");
app.use(hpp());
app.use(express.urlencoded({ extended: true }));

// const csrf = require("csurf");
// const csrfProtection = csrf({ cookie: true });
// app.use(csrfProtection);

//  cors configuration
const corsOptions = {
  origin: true,
  credentials: true,
  optionSuccessStatus: 200,
};
app.use(cors(corsOptions));

// dotenv Configuration
dotenv.config();

// Connecting to database
connectDatabase();

// Defining the port
const PORT = 5000

// Making a test endpoint
// Endpoints : POST, GET, PUT , DELETE
app.get("/test", (req, res) => {
  res.send("Test API is Working!....");
});
const options = {
 key: fs.readFileSync(path.join(__dirname, '../certs/localhost-key.pem')),
  cert: fs.readFileSync(path.join(__dirname, '../certs/localhost.pem')),

};
// Configuring Routes of User
app.use("/api/user", require("./routes/userRoutes"));
app.use("/api/product", require("./routes/productRoutes"));
app.use("/api/cart", require("./routes/cartRoutes"));
app.use("/api/review", require("./routes/review&ratingRoutes"));
app.use("/api/order", require("./routes/orderRoutes"));
app.use("/api/khalti", require("./routes/paymentRoutes"));
app.use("/api/admin", require("./routes/activityRoute"));

app.get("/api/csrf-token", csrfProtection, (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
});

app.use((err, req, res, next) => {
  if (err.code === "EBADCSRFTOKEN") {
    res.status(403).json({ success: false, message: "Invalid CSRF token" });
  } else {
    next(err);
  }
});

https.createServer(options, app).listen(PORT, () => {
  console.log(`Server is running on PORT ${PORT}`);
});
module.exports = app;
