const express = require("express");
const router = express.Router();
const homeController = require("../controllers/homeController");

router.get("/properties/:id", homeController.getPropertyById);
router.get("/featured-properties", homeController.getFeaturedProperties);
router.get("/projects", homeController.getProjects);
router.get("/projects/:id", homeController.getProjectById);
router.get("/latest-properties", homeController.getLatestProperties);
router.get("/properties/count", homeController.getTotalPropertiesCount);
router.get("/search", homeController.searchProperties);
router.get("/cities", homeController.getCities);
router.get("/zones", homeController.getZonesByCity);
router.get("/properties/:id/agent", homeController.getAgentByPropertyId);
router.get("/properties/:id/coordinates", homeController.getPropertyCoordinates);
router.get("/agentes/:id", homeController.getAgentById);

module.exports = router;