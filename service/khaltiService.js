// const axios = require("axios");
 
// // Function to verify Khalti Payment
// async function verifyKhaltiPayment(pidx) {
//   const headersList = {
//     "Authorization": `Key ${process.env.KHALTI_SECRET_KEY}`,
//     "Content-Type": "application/json",
//   };
 
//   const bodyContent = JSON.stringify({ pidx });
 
//   const reqOptions = {
//     url: `${process.env.KHALTI_GATEWAY_URL}/api/v2/epayment/lookup/`,
//     method: "POST",
//     headers: headersList,
//     data: bodyContent,
//   };
 
//   try {
//     const response = await axios.request(reqOptions);
//     return response.data;
//   } catch (error) {
//     console.error("Error verifying Khalti payment:", error);
//     throw error;
//   }
// }
 
// // Function to initialize Khalti Payment
// async function initializeKhaltiPayment(details) {
//   const headersList = {
//     "Authorization": `Key ${process.env.KHALTI_SECRET_KEY}`,
//     "Content-Type": "application/json",
//   };
 
//   const bodyContent = JSON.stringify(details);
 
//   const reqOptions = {
//     url: `${process.env.KHALTI_GATEWAY_URL}/api/v2/epayment/initiate/`,
//     method: "POST",
//     headers: headersList,
//     data: bodyContent,
//   };
 
//   try {
//     const response = await axios.request(reqOptions);
//     return response.data;
//   } catch (error) {
//     console.error("Error initializing Khalti payment:", error);
//     throw error;
//   }
// }
 
// module.exports = { verifyKhaltiPayment, initializeKhaltiPayment };




const axios = require("axios");

// Function to verify Khalti Payment
async function verifyKhaltiPayment(pidx) {
  const baseURL = process.env.KHALTI_BASE_URL;
  const secretKey = process.env.KHALTI_SECRET_KEY;

  if (!baseURL || !secretKey) {
    throw new Error("Missing KHALTI_BASE_URL or KHALTI_SECRET_KEY in .env");
  }

  const headersList = {
    Authorization: `Key ${secretKey}`,
    "Content-Type": "application/json",
  };

  const bodyContent = JSON.stringify({ pidx });

  const reqOptions = {
    url: `${baseURL}/api/v2/epayment/lookup/`,
    method: "POST",
    headers: headersList,
    data: bodyContent,
  };

  try {
    const response = await axios.request(reqOptions);
    return response.data;
  } catch (error) {
    console.error("Error verifying Khalti payment:", error);
    throw error;
  }
}

// Function to initialize Khalti Payment
async function initializeKhaltiPayment(details) {
  const baseURL = process.env.KHALTI_BASE_URL;
  const secretKey = process.env.KHALTI_SECRET_KEY;

  if (!baseURL || !secretKey) {
    throw new Error("Missing KHALTI_BASE_URL or KHALTI_SECRET_KEY in .env");
  }

  const headersList = {
    Authorization: `Key ${secretKey}`,
    "Content-Type": "application/json",
  };

  const bodyContent = JSON.stringify(details);

  const reqOptions = {
    url: `${baseURL}/api/v2/epayment/initiate/`,
    method: "POST",
    headers: headersList,
    data: bodyContent,
  };

  try {
    const response = await axios.request(reqOptions);
    return response.data;
  } catch (error) {
    console.error("Error initializing Khalti payment:", error);
    throw error;
  }
}

module.exports = { verifyKhaltiPayment, initializeKhaltiPayment };
