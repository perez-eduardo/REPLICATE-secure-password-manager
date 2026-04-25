const speakeasy = require("speakeasy");
const qrcode = require("qrcode");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

// SETUP MFA
exports.setupMFA = async (req, res) => {
  try {
    const { userId } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const secret = speakeasy.generateSecret({ length: 20 });

    user.mfaSecret = secret.base32;
    await user.save();

    const otpauth = speakeasy.otpauthURL({
      secret: secret.base32,
      label: user.email,
      issuer: "SecurePasswordManager",
      encoding: "base32"
    });

    const qrCode = await qrcode.toDataURL(otpauth);

    res.json({ qrCode });

  } catch (err) {
    console.error("ERROR IN setupMFA:", err);
    res.status(500).json({ message: err.message });
  }
};


// VERIFY MFA
exports.verifyMFA = async (req, res) => {
  try {
    const { token, userId } = req.body;

    const user = await User.findById(userId);

    if (!user || !user.mfaSecret) {
      return res.status(400).json({ message: "MFA not set up" });
    }

    const verified = speakeasy.totp.verify({
      secret: user.mfaSecret,
      encoding: "base32",
      token,
      window: 1,
    });

    if (!verified) {
      return res.status(400).json({ message: "Invalid MFA token" });
    }

    const jwtToken = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.json({ token: jwtToken });

  } catch (err) {
    console.error("ERROR IN verifyMFA:", err);
    res.status(500).json({ message: "Error verifying MFA" });
  }
};