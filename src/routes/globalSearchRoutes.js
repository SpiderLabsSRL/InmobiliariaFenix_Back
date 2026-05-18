const express = require("express");
const router = express.Router();
const globalSearchController = require("../controllers/globalSearchController");
const { authenticate } = require("../middleware/loginmiddleware");

router.post("/", authenticate, globalSearchController.globalSearch);
router.get("/:propertyId", globalSearchController.getPropertyById);

module.exports = router;