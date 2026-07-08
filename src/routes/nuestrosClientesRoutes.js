const express = require("express");
const router = express.Router();
const nuestrosClientesController = require("../controllers/nuestrosClientesController");
const { authenticate } = require("../middleware/loginmiddleware");

router.get("/featured", nuestrosClientesController.getFeaturedClientes);

router.get("/", authenticate, nuestrosClientesController.getClientes);
router.post("/", authenticate, nuestrosClientesController.createCliente);
router.put("/:id", authenticate, nuestrosClientesController.updateCliente);
router.delete("/:id", authenticate, nuestrosClientesController.deleteCliente);

module.exports = router;