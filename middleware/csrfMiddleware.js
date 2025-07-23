
const csrf = require('csurf');
const cookieParser = require('cookie-parser');

module.exports = (app) => {
  app.use(cookieParser());
  const csrfProtection = csrf({ cookie: { httpOnly: true, secure: process.env.NODE_ENV === 'production' } });

  app.use(csrfProtection);


};
