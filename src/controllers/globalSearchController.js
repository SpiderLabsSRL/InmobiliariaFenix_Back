const globalSearchService = require("../services/globalSearchService");

const globalSearch = async (req, res) => {
  try {
    const filters = req.body;

    console.log("Filtros de búsqueda global:", filters);

    const results = await globalSearchService.searchAll(filters);

    res.json({
      success: true,
      message: "Búsqueda global completada exitosamente",
      data: results,
    });
  } catch (error) {
    console.error("Error en globalSearch:", error);
    res.status(500).json({
      success: false,
      message: "Error en la búsqueda global",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

module.exports = {
  globalSearch,
};