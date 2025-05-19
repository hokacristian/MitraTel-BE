const express = require("express");
const {
  createTower,
  getAllTowers,
  getTowerById,
  getTowerCount,
  getAntennaCounts,
  getKebersihanCounts,
  getTeganganCounts,
} = require("../controllers/towerController");
const {
  authMiddleware,
  roleMiddleware,
} = require("../middlewares/authMiddleware");

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// IMPORTANT: Specific routes must come BEFORE parameterized routes
// These specific routes MUST come before the /:id route
router.get("/antenna-counts", getAntennaCounts);
router.get("/kebersihan-counts", getKebersihanCounts);
router.get("/tegangan-counts", getTeganganCounts);

// Get tower count route - also MUST be before /:id route
router.get("/count", getTowerCount);

// Get all towers
router.get("/", getAllTowers);

// Get tower by ID - this matches any /towers/:something pattern
// It should come AFTER all specific routes
router.get("/:id", getTowerById);

// Create tower - only accessible by ADMIN
router.post("/", roleMiddleware("ADMIN"), createTower);

module.exports = router;