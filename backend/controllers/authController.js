const speakeasy = require("speakeasy");
const qrcode = require("qrcode");

exports.setupMFA = async (req, res) => {
    const secret = speakeasy.generateSecret({ length: 20 });

    //save secre.baase32 to use in DB
    req.user.mfaSecret = secret.base32;
    await req.user.save();

    const qrCode = await qrcode.toDataURL(secret.otpauth_url);

    res.json({ qrCode});
};

// verify MFA token
exports.verifyMFA = (req, res) => {
    const { token } = req.body;

    const verified = speakeasy.totp.verify({
        secret: req.user.mfaSecret,
        encoding: "base32",
        token,
        window: 1, // allow 1 step before and after
    });

    if (!verified) {
        return res.status(400).json({ message: "Invalid MFA token" });
    }

    res.json({ message: "MFA verified" });
};


// Login flow
if (user.mfaEnabled) {
    // after password check, require MFA token
    return res.json({ requireMFA: true });
}
