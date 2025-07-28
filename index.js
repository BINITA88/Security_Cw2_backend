// Importing the packages (express)
const express = require("express");
const connectDatabase = require("./data/database");
const dotenv = require("dotenv");
const cors = require("cors");
const accessFromData = require("express-fileupload");
const fs = require("fs");
const path = require("path");
const https = require("https");
const helmet = require("helmet");
const csrf = require("csurf");
const cookieParser = require("cookie-parser");




const app = express();

app.use(cookieParser());


const csrfProtection = csrf({ cookie: true }); 

// Express Json Config
app.use(express.json());

// app.use(express.static("./public"));

const ProtectImage = require("./middleware/imageHotlinkProtect"); 
app.use(
  "/products",
  ProtectImage,
  express.static(path.join(__dirname, "public/products"))
);


app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: [
          "'self'",
          "https://trusted-cdn.com",
          "https://cdnjs.cloudflare.com",
          "https://apis.google.com",
        ],
        styleSrc: [
          "'self'",
          "https://fonts.googleapis.com",
          "https://trusted-cdn.com",
        ],
        fontSrc: [
          "'self'",
          "https://fonts.gstatic.com",
        ],
        imgSrc: [
          "'self'",
          "data:",
          "https://trusted-cdn.com",
        ],
        connectSrc: [
          "'self'",
          "https://api.example.com",
        ],
        frameSrc: [
          "'self'",
          "https://trusted-iframe.com",
        ],
        objectSrc: ["'none'"], 
        upgradeInsecureRequests: [], 
      },
    },
  })
);

app.use(helmet.dnsPrefetchControl());
app.use(helmet.frameguard({ action: "deny" }));
app.use(helmet.hidePoweredBy());
app.use(helmet.hsts({ maxAge: 31536000, includeSubDomains: true }));
app.use(helmet.noSniff());
app.use(helmet.permittedCrossDomainPolicies());
app.use(helmet.referrerPolicy({ policy: "no-referrer" }));
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

// asasad
app.use(accessFromData());

// use hpp to prevent http parameter pollution
const hpp = require("hpp");
const { default: Stripe } = require("stripe");
app.use(hpp());
app.use(express.urlencoded({ extended: true }));


const corsOptions = {
  origin: true,
  credentials: true,
  optionSuccessStatus: 200,
  
};
app.use(cors(corsOptions));

dotenv.config();

connectDatabase();
const PORT = 5000

const options = {
 key: fs.readFileSync(path.join(__dirname, '../certs/localhost-key.pem')),
  cert: fs.readFileSync(path.join(__dirname, '../certs/localhost.pem')),

};
// const khaltiWebhook = require("./routes/khaltiWebhook");
// app.use("/api/payment", khaltiWebhook);

app.use("/api/user", require("./routes/userRoutes"));
app.use("/api/product", require("./routes/productRoutes"));
app.use("/api/cart", require("./routes/cartRoutes"));
app.use("/api/order", require("./routes/orderRoutes"));
app.use("/api/khalti", require("./routes/paymentRoutes"));
app.use("/api/admin", require("./routes/activityRoute"));
app.use("/api/stripe",  require("./routes/stripeRoutes"));
app.get("/api/Bookish-Csrf", csrfProtection, (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
});
// asad
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
