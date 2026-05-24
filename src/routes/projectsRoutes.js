const express = require("express");
const router = express.Router();
const projectsController = require("../controllers/projectsController");
const { authenticate } = require("../middleware/loginmiddleware");

router.get("/", authenticate, projectsController.getProjects);
router.get("/ownership/:ownership", authenticate, projectsController.getProjectsByOwnership);
router.get("/features", authenticate, projectsController.getFeatures);
router.post("/features", authenticate, projectsController.createFeature);
router.get("/:id", authenticate, projectsController.getProjectById);
router.post("/", authenticate, projectsController.createProject);
router.put("/:id", authenticate, projectsController.updateProject);
router.delete("/:id", authenticate, projectsController.deleteProject);
router.get("/:idproyecto/images", authenticate, projectsController.getProjectImages);
router.get("/:idproyecto/images/:idimagen", projectsController.getProjectImageById);

module.exports = router;