const projectsService = require("../services/projectsService");

const getProjects = async (req, res) => {
  try {
    const { status, tipo } = req.query;
    const filters = {};
    
    if (status) filters.estado = status;
    if (tipo) filters.tipo_proyecto = tipo;
    
    const projects = await projectsService.getProjects(filters);
    
    res.json({
      success: true,
      data: projects
    });
  } catch (error) {
    console.error("Error en getProjects:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener los proyectos",
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
};

const getProjectsByOwnership = async (req, res) => {
  try {
    const { ownership } = req.params;
    
    if (ownership !== 'own' && ownership !== 'third') {
      return res.status(400).json({
        success: false,
        message: "Tipo de propiedad inválido. Use 'own' o 'third'"
      });
    }
    
    const tipo_proyecto = ownership === 'own' ? 'propio' : 'terceros';
    const projects = await projectsService.getProjects({ tipo_proyecto });
    
    res.json({
      success: true,
      data: projects
    });
  } catch (error) {
    console.error("Error en getProjectsByOwnership:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener los proyectos por propiedad",
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
};

const getProjectById = async (req, res) => {
  try {
    const { id } = req.params;
    const project = await projectsService.getProjectById(id);
    
    res.json({
      success: true,
      data: project
    });
  } catch (error) {
    console.error("Error en getProjectById:", error);
    
    if (error.message === "Proyecto no encontrado") {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      message: "Error al obtener el proyecto",
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
};

const createProject = async (req, res) => {
  try {
    const projectData = req.body;
    
    // Validaciones básicas
    if (!projectData.name || !projectData.location || !projectData.totalUnits || !projectData.priceFrom) {
      return res.status(400).json({
        success: false,
        message: "Faltan campos requeridos: name, location, totalUnits, priceFrom"
      });
    }
    
    const newProject = await projectsService.createProject(projectData);
    
    res.status(201).json({
      success: true,
      message: "Proyecto creado exitosamente",
      data: newProject
    });
  } catch (error) {
    console.error("Error en createProject:", error);
    res.status(500).json({
      success: false,
      message: "Error al crear el proyecto",
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
};

const updateProject = async (req, res) => {
  try {
    const { id } = req.params;
    const projectData = req.body;
    
    // Verificar que el proyecto existe
    await projectsService.getProjectById(id);
    
    const updatedProject = await projectsService.updateProject(id, projectData);
    
    res.json({
      success: true,
      message: "Proyecto actualizado exitosamente",
      data: updatedProject
    });
  } catch (error) {
    console.error("Error en updateProject:", error);
    
    if (error.message === "Proyecto no encontrado") {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      message: "Error al actualizar el proyecto",
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
};

const deleteProject = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verificar que el proyecto existe
    await projectsService.getProjectById(id);
    
    await projectsService.deleteProject(id);
    
    res.json({
      success: true,
      message: "Proyecto eliminado exitosamente"
    });
  } catch (error) {
    console.error("Error en deleteProject:", error);
    
    if (error.message === "Proyecto no encontrado") {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      message: "Error al eliminar el proyecto",
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
};

const getProjectImages = async (req, res) => {
  try {
    const { idproyecto } = req.params;
    
    // Verificar que el proyecto existe
    await projectsService.getProjectById(idproyecto);
    
    const images = await projectsService.getProjectImages(idproyecto);
    
    res.json({
      success: true,
      data: images
    });
  } catch (error) {
    console.error("Error en getProjectImages:", error);
    
    if (error.message === "Proyecto no encontrado") {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      message: "Error al obtener las imágenes del proyecto",
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
};

const getProjectImageById = async (req, res) => {
  try {
    const { idproyecto, idimagen } = req.params;
    
    const image = await projectsService.getProjectImageById(idproyecto, idimagen);
    
    // Configurar headers para la imagen
    res.setHeader('Content-Type', 'image/jpeg');
    res.setHeader('Content-Disposition', `inline; filename="imagen_${idimagen}.jpg"`);
    
    // Enviar la imagen como buffer
    res.send(image.imagen);
  } catch (error) {
    console.error("Error en getProjectImageById:", error);
    
    if (error.message === "Imagen no encontrada") {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      message: "Error al obtener la imagen",
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
};

const getFeatures = async (req, res) => {
  try {
    const features = await projectsService.getFeatures();
    
    res.json({
      success: true,
      data: features
    });
  } catch (error) {
    console.error("Error en getFeatures:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener las características",
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
};

const createFeature = async (req, res) => {
  try {
    const { name } = req.body;
    
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: "El nombre de la característica es requerido"
      });
    }
    
    const feature = await projectsService.createFeature(name.trim());
    
    res.status(201).json({
      success: true,
      message: "Característica creada exitosamente",
      data: feature
    });
  } catch (error) {
    console.error("Error en createFeature:", error);
    
    if (error.message.includes("ya existe")) {
      return res.status(409).json({
        success: false,
        message: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      message: "Error al crear la característica",
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
};

module.exports = {
  getProjects,
  getProjectsByOwnership,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
  getProjectImages,
  getProjectImageById,
  getFeatures,
  createFeature
};