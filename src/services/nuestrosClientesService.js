const { query } = require("../../db");

const getYouTubeVideoId = (url) => {
  if (!url || url.trim() === "") return null;
  
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&?#]+)/,
    /youtube\.com\/embed\/([^/?]+)/,
    /youtube\.com\/v\/([^/?]+)/,
    /youtube\.com\/shorts\/([^/?]+)/
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      const cleanId = match[1].split('?')[0].split('&')[0];
      return cleanId;
    }
  }
  return null;
};

const getTikTokVideoId = (url) => {
  if (!url || url.trim() === "") return null;
  
  const patterns = [
    /tiktok\.com\/@[\w.-]+\/video\/(\d+)/,
    /tiktok\.com\/v\/(\d+)/,
    /tiktok\.com\/t\/([A-Za-z0-9]+)/
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  return null;
};

const isValidVideoUrl = (url) => {
  if (!url || url.trim() === "") return false;
  const youtubeId = getYouTubeVideoId(url);
  const tiktokId = getTikTokVideoId(url);
  return !!(youtubeId || tiktokId);
};

const getVideoType = (url) => {
  if (!url || url.trim() === "") return null;
  const youtubeId = getYouTubeVideoId(url);
  if (youtubeId) return 'youtube';
  const tiktokId = getTikTokVideoId(url);
  if (tiktokId) return 'tiktok';
  return null;
};

const getClientes = async () => {
  try {
    const result = await query(
      `SELECT 
        idpublicidad,
        titulo,
        enlace
      FROM publicidad
      ORDER BY idpublicidad DESC`
    );

    const clientes = result.rows.map(row => ({
      id: row.idpublicidad.toString(),
      title: row.titulo,
      videoUrl: row.enlace,
      createdAt: new Date().toISOString()
    }));

    return clientes;
  } catch (error) {
    console.error("Error en getClientes service:", error);
    throw error;
  }
};

/**
 * Obtener testimonios destacados (para el home)
 */
const getFeaturedClientes = async (limit = 4) => {
  try {
    const result = await query(
      `SELECT 
        idpublicidad,
        titulo,
        enlace
      FROM publicidad
      ORDER BY idpublicidad DESC
      LIMIT $1`,
      [limit]
    );

    const clientes = result.rows.map(row => ({
      id: row.idpublicidad.toString(),
      title: row.titulo,
      videoUrl: row.enlace,
      createdAt: new Date().toISOString()
    }));

    return clientes;
  } catch (error) {
    console.error("Error en getFeaturedClientes service:", error);
    throw error;
  }
};

/**
 * Crear un nuevo testimonio de cliente
 */
const createCliente = async (data) => {
  try {
    const { title, videoUrl } = data;

    if (!isValidVideoUrl(videoUrl)) {
      throw new Error("La URL debe ser de YouTube o TikTok válida");
    }

    const result = await query(
      `INSERT INTO publicidad (titulo, enlace)
      VALUES ($1, $2)
      RETURNING 
        idpublicidad,
        titulo,
        enlace`,
      [title.trim(), videoUrl.trim()]
    );

    const row = result.rows[0];

    const newCliente = {
      id: row.idpublicidad.toString(),
      title: row.titulo,
      videoUrl: row.enlace,
      createdAt: new Date().toISOString()
    };

    return newCliente;
  } catch (error) {
    console.error("Error en createCliente service:", error);
    throw error;
  }
};

/**
 * Actualizar un testimonio de cliente
 */
const updateCliente = async (id, data) => {
  try {
    const { title, videoUrl } = data;

    const existingResult = await query(
      `SELECT idpublicidad, titulo, enlace 
      FROM publicidad 
      WHERE idpublicidad = $1`,
      [id]
    );

    if (existingResult.rows.length === 0) {
      throw new Error("Testimonio no encontrado");
    }

    const current = existingResult.rows[0];

    if (videoUrl && !isValidVideoUrl(videoUrl)) {
      throw new Error("La URL debe ser de YouTube o TikTok válida");
    }

    let updateFields = [];
    let params = [];
    let paramCounter = 1;

    if (title !== undefined) {
      updateFields.push(`titulo = $${paramCounter}`);
      params.push(title.trim());
      paramCounter++;
    }

    if (videoUrl !== undefined) {
      updateFields.push(`enlace = $${paramCounter}`);
      params.push(videoUrl.trim());
      paramCounter++;
    }

    if (updateFields.length === 0) {
      throw new Error("No hay campos para actualizar");
    }

    params.push(id);
    const updateQuery = `
      UPDATE publicidad 
      SET ${updateFields.join(", ")}
      WHERE idpublicidad = $${paramCounter}
      RETURNING 
        idpublicidad,
        titulo,
        enlace
    `;

    const result = await query(updateQuery, params);

    const row = result.rows[0];

    const updatedCliente = {
      id: row.idpublicidad.toString(),
      title: row.titulo,
      videoUrl: row.enlace,
      createdAt: new Date().toISOString()
    };

    return updatedCliente;
  } catch (error) {
    console.error("Error en updateCliente service:", error);
    throw error;
  }
};

const deleteCliente = async (id) => {
  try {
    const checkResult = await query(
      `SELECT idpublicidad FROM publicidad 
      WHERE idpublicidad = $1`,
      [id]
    );

    if (checkResult.rows.length === 0) {
      throw new Error("Testimonio no encontrado");
    }

    await query(
      `DELETE from publicidad 
      WHERE idpublicidad = $1`,
      [id]
    );

    return { success: true };
  } catch (error) {
    console.error("Error en deleteCliente service:", error);
    throw error;
  }
};

module.exports = {
  getClientes,
  getFeaturedClientes,
  createCliente,
  updateCliente,
  deleteCliente,

  isValidVideoUrl,
  getVideoType,
  getYouTubeVideoId,
  getTikTokVideoId
};