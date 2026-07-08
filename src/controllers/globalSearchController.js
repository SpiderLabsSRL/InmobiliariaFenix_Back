const globalSearchService = require("../services/globalSearchService");

const globalSearch = async (req, res) => {
  try {
    const filters = req.body;

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

const getPropertyById = async (req, res) => {
  try {
    const { propertyId } = req.params;

    const result = await globalSearchService.getPropertyById(propertyId);

    res.json({
      success: true,
      message: "Propiedad encontrada exitosamente",
      data: result,
    });
  } catch (error) {
    console.error("Error en get Property By Id:", error);
    res.status(500).json({
      success: false,
      message: "Error al buscar la propiedad",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

module.exports = {
  globalSearch,
  getPropertyById,
};