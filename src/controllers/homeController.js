const homeService = require("../services/homeService");

const getPropertyById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "ID de propiedad es requerido"
      });
    }

    const property = await homeService.getPropertyById(id);

    if (!property) {
      return res.status(404).json({
        success: false,
        message: "Propiedad no encontrada"
      });
    }

    res.json({
      success: true,
      data: property
    });
  } catch (error) {
    console.error("Error en getPropertyById:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener la propiedad",
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
};

const getFeaturedProperties = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 6;

    const properties = await homeService.getFeaturedProperties(limit);

    res.json({
      success: true,
      data: properties
    });
  } catch (error) {
    console.error("Error en getFeaturedProperties:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener propiedades destacadas",
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
};

const getProjects = async (req, res) => {
  try {
    const { city, status } = req.query;

    const projects = await homeService.getProjects(city, status);

    res.json({
      success: true,
      data: projects
    });
  } catch (error) {
    console.error("Error en getProjects:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener proyectos",
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
};

const getProjectById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "ID de proyecto es requerido"
      });
    }

    const project = await homeService.getProjectById(id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Proyecto no encontrado"
      });
    }

    res.json({
      success: true,
      data: project
    });
  } catch (error) {
    console.error("Error en getProjectById:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener el proyecto",
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
};

const getLatestProperties = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 6;

    const properties = await homeService.getLatestProperties(limit);

    res.json({
      success: true,
      data: properties
    });
  } catch (error) {
    console.error("Error en getLatestProperties:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener propiedades recientes",
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
};

const getTotalPropertiesCount = async (req, res) => {
  try {
    const count = await homeService.getTotalPropertiesCount();

    res.json({
      success: true,
      data: count
    });
  } catch (error) {
    console.error("Error en getTotalPropertiesCount:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener el conteo de propiedades",
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
};

const searchProperties = async (req, res) => {
  try {
    const params = {
      city: req.query.city,
      zone: req.query.zone,
      operationType: req.query.operationType,
      maxPrice: req.query.maxPrice ? parseFloat(req.query.maxPrice) : undefined,
      minPrice: req.query.minPrice ? parseFloat(req.query.minPrice) : undefined,
      propertyType: req.query.propertyType,
      bedrooms: req.query.bedrooms ? parseInt(req.query.bedrooms) : undefined,
      bathrooms: req.query.bathrooms ? parseInt(req.query.bathrooms) : undefined,
      minSqm: req.query.minSqm ? parseFloat(req.query.minSqm) : undefined,
      condition: req.query.condition,
      hasGarage: req.query.hasGarage,
      hasPool: req.query.hasPool,
      hasTerrace: req.query.hasTerrace,
      hasElevator: req.query.hasElevator,
      limit: req.query.limit ? parseInt(req.query.limit) : undefined
    };

    const properties = await homeService.searchProperties(params);

    res.json({
      success: true,
      data: properties
    });
  } catch (error) {
    console.error("Error en searchProperties:", error);
    res.status(500).json({
      success: false,
      message: "Error en la búsqueda de propiedades",
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
};

const getCities = async (req, res) => {
  try {
    const cities = await homeService.getCities();

    res.json({
      success: true,
      data: cities
    });
  } catch (error) {
    console.error("Error en getCities:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener la lista de ciudades",
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
};

const getZonesByCity = async (req, res) => {
  try {
    const { city } = req.query;

    if (!city) {
      return res.status(400).json({
        success: false,
        message: "El parámetro city es requerido"
      });
    }

    const zones = await homeService.getZonesByCity(city);

    res.json({
      success: true,
      data: zones
    });
  } catch (error) {
    console.error("Error en getZonesByCity:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener las zonas",
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
};

const getAgentByPropertyId = async (req, res) => {
  try {
    const { propertyId } = req.params;

    if (!propertyId) {
      return res.status(400).json({
        success: false,
        message: "ID de propiedad es requerido"
      });
    }

    const agent = await homeService.getAgentByPropertyId(propertyId);

    if (!agent) {
      return res.status(404).json({
        success: false,
        message: "Agente no encontrado para esta propiedad"
      });
    }

    res.json({
      success: true,
      data: agent
    });
  } catch (error) {
    console.error("Error en getAgentByPropertyId:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener el agente",
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
};

const getPropertyCoordinates = async (req, res) => {
  try {
    const { propertyId } = req.params;

    if (!propertyId) {
      return res.status(400).json({
        success: false,
        message: "ID de propiedad es requerido"
      });
    }

    const coordinates = await homeService.getPropertyCoordinates(propertyId);

    if (!coordinates) {
      return res.status(404).json({
        success: false,
        message: "Coordenadas no encontradas para esta propiedad"
      });
    }

    res.json({
      success: true,
      data: coordinates
    });
  } catch (error) {
    console.error("Error en getPropertyCoordinates:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener las coordenadas",
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
};

const getAgentById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "ID de agente es requerido"
      });
    }

    const agent = await homeService.getAgentById(parseInt(id));

    if (!agent) {
      return res.status(404).json({
        success: false,
        message: "Agente no encontrado"
      });
    }

    res.json({
      success: true,
      data: agent
    });
  } catch (error) {
    console.error("Error en getAgentById:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener el agente",
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
};

module.exports = {
  getPropertyById,
  getFeaturedProperties,
  getProjects,
  getProjectById,
  getLatestProperties,
  getTotalPropertiesCount,
  searchProperties,
  getCities,
  getZonesByCity,
  getAgentByPropertyId,
  getPropertyCoordinates,
  getAgentById
};