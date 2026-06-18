const express = require("express");
const otpController = require("../controllers/otpController");

const router = express.Router();

// Public endpoints used during registration (no auth yet). Protected by the
// global rate limiter plus per-record attempt/resend caps in the controller.
router.post("/request", otpController.requestOtp);
router.post("/resend", otpController.resendOtp);
router.post("/verify", otpController.verifyOtp);

module.exports = router;
