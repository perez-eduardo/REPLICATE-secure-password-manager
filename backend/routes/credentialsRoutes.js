const express = require("express");
const router = express.Router();
const Credential = require("../models/Credential");
const authMiddleware = require("../middleware/authMiddleware");
const mongoose = require("mongoose");

// Protect all routes
router.use(authMiddleware);

// CREATE
router.post("/", async (req, res) => {
  try {
    const { title, website, category, encryptedData } = req.body;

    if (!title || !encryptedData) {
      return res.status(400).json({
        error: "title and encryptedData are required",
      });
    }

    const credential = await Credential.create({
      userId: req.user._id,
      title,
      website,
      category,
      encryptedData,
    });

    res.status(201).json(credential);

  } catch (err) {
    console.error(err);

    if (err.name === "ValidationError") {
      return res.status(400).json({ error: err.message });
    }

    res.status(500).json({ error: "Failed to create credential" });
  }
});

// GET ALL
router.get("/", async (req, res) => {
  try {
    const credentials = await Credential.find({
      userId: req.user._id,
    });

    res.json(credentials);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch credentials" });
  }
});

// GET ONE
router.get("/:id", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({ error: "Not found" });
    }

    const credential = await Credential.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!credential) {
      return res.status(404).json({ error: "Not found" });
    }

    res.json(credential);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch credential" });
  }
});

// UPDATE
router.put("/:id", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({ error: "Not found" });
    }

    const update = {};

    for (const key of ["title", "website", "category", "encryptedData"]) {
      if (req.body[key] !== undefined) {
        update[key] = req.body[key];
      }
    }

    if (Object.keys(update).length === 0) {
      return res.status(400).json({ error: "No fields to update" });
    }

    const updated = await Credential.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      update,
      { new: true, runValidators: true }
    );

    if (!updated) {
      return res.status(404).json({ error: "Not found" });
    }

    res.json(updated);

  } catch (err) {
  console.error(err);

  if (err.name === "ValidationError") {
    return res.status(400).json({ error: err.message });
  }

  res.status(500).json({ error: "Failed to update credential" });
}
});
// DELETE
router.delete("/:id", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({ error: "Not found" });
    }

    const deleted = await Credential.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!deleted) {
      return res.status(404).json({ error: "Not found" });
    }

    res.json({ message: "Deleted successfully" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete credential" });
  }
});

module.exports = router; 
