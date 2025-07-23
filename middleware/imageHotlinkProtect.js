const ProtectImage = (req, res, next) => {
  const referer = req.headers.referer;
  const allowedReferer = "https://localhost:3000"; 

  if (!referer || referer.startsWith(allowedReferer)) {
    return next();
  } else {
    return res.status(403).send("Hotlinking is not allowed.");
  }
};

module.exports = ProtectImage;
