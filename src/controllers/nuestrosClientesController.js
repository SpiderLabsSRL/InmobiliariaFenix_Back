const nuestrosClientesService = require("../services/nuestrosClientesService");

const getClientes = async (req, res) => {
  try {
    const clientes = await nuestrosClientesService.getClientes();

    res.json({
      success: true,
      data: clientes,
      message: "Testimonios obtenidos exitosamente",
    });
  } catch (error) {
    console.error("Error en getClientes controller:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener testimonios",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

const getFeaturedClientes = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 4;

    const clientes = await nuestrosClientesService.getFeaturedClientes(limit);

    res.json({
      success: true,
      data: clientes,
      message: "Testimonios destacados obtenidos exitosamente",
    });
  } catch (error) {
    console.error("Error en getFeaturedClientes controller:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener testimonios destacados",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

const createCliente = async (req, res) => {
  try {
    const { title, videoUrl } = req.body;

    if (!title || !videoUrl) {
      return res.status(400).json({
        success: false,
        message: "Título y URL del video son requeridos",
      });
    }

    if (title.trim().length < 3) {
      return res.status(400).json({
        success: false,
        message: "El título debe tener al menos 3 caracteres",
      });
    }

    if (title.trim().length > 255) {
      return res.status(400).json({
        success: false,
        message: "El título no debe exceder los 255 caracteres",
      });
    }

    if (!nuestrosClientesService.isValidVideoUrl(videoUrl)) {
      return res.status(400).json({
        success: false,
        message: "La URL debe ser de YouTube o TikTok válida",
      });
    }

    const newCliente = await nuestrosClientesService.createCliente({
      title: title.trim(),
      videoUrl: videoUrl.trim(),
    });

    res.status(201).json({
      success: true,
      data: newCliente,
      message: "Testimonio creado exitosamente",
    });
  } catch (error) {
    console.error("Error en createCliente controller:", error);
    
    // Si es un error de validación, enviar 400
    if (error.message.includes("URL") || error.message.includes("válida")) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    res.status(500).json({
      success: false,
      message: "Error al crear testimonio",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

const updateCliente = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, videoUrl } = req.body;

    if (!title && !videoUrl) {
      return res.status(400).json({
        success: false,
        message: "Se requiere al menos un campo para actualizar",
      });
    }

    if (title && title.trim().length < 3) {
      return res.status(400).json({
        success: false,
        message: "El título debe tener al menos 3 caracteres",
      });
    }

    if (title && title.trim().length > 255) {
      return res.status(400).json({
        success: false,
        message: "El título no debe exceder los 255 caracteres",
      });
    }

    if (videoUrl && !nuestrosClientesService.isValidVideoUrl(videoUrl)) {
      return res.status(400).json({
        success: false,
        message: "La URL debe ser de YouTube o TikTok válida",
      });
    }

    const updatedCliente = await nuestrosClientesService.updateCliente(id, {
      title: title ? title.trim() : undefined,
      videoUrl: videoUrl ? videoUrl.trim() : undefined,
    });

    res.json({
      success: true,
      data: updatedCliente,
      message: "Testimonio actualizado exitosamente",
    });
  } catch (error) {
    console.error("Error en updateCliente controller:", error);

    if (error.message.includes("URL") || error.message.includes("válida")) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    if (error.message.includes("no encontrado")) {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    res.status(500).json({
      success: false,
      message: "Error al actualizar testimonio",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

const deleteCliente = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await nuestrosClientesService.deleteCliente(id);

    res.json({
      success: true,
      message: "Testimonio eliminado exitosamente",
    });
  } catch (error) {
    console.error("Error en deleteCliente controller:", error);

    if (error.message.includes("no encontrado")) {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    res.status(500).json({
      success: false,
      message: "Error al eliminar testimonio",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

module.exports = {
  getClientes,
  getFeaturedClientes,
  createCliente,
  updateCliente,
  deleteCliente,
};