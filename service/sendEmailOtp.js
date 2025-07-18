const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "binitaacharya2003@gmail.com",
    pass: "wkrf xgup pojh nrlc",
  },
});




const sendEmailOtp = (email, otp) => {
  const mailOptions = {
    from: "binitaacharya2003@gmail.com",
    to: email,
    subject: "Password Reset OTP",
    text: `Your OTP for password reset is ${otp}`,
  };

  return new Promise((resolve, reject) => {
    transporter.sendMail(mailOptions, function (error, info) {
      if (error) {
        console.log(error);
        reject(false);
      } else {
        console.log("Email sent: " + info.response);
        resolve(true);
      }
    });
  });
};
const sendRegisterOtp = async (email, otp) => {
  const mailOptions = {
    from: "binitaacharya2003@gmail.com",
    to: email,
    subject: "Registration OTP",
    text: `Your OTP is: ${otp}`,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`OTP sent to ${email}`);
    return true;
  } catch (error) {
    console.error("Error in sending OTP:", error);
    throw new Error("Failed to send OTP");
  }
};

module.exports = { sendEmailOtp, sendRegisterOtp };
