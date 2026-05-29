const { query } = require("../../db");
const propertyService = require("../services/PropertyManagementService");

const getProjects = async (filters = {}) => {
  try {
    let sql = `
      SELECT 
        p.idproyecto,
        p.nombre_proyecto,
        p.tipo_proyecto,
        p.ubicacion,
        p.descripcion,
        p.estado,
        p.fecha_inicio,
        p.fecha_fin,
        p.unidades_totales,
        p.unidades_vendidas,
        p.precio,
        p.enlace_video_proyecto,
        (
          SELECT json_agg(DISTINCT c.nombre)
          FROM proyecto_caracteristicas pc
          JOIN caracteristicas c ON pc.idcaracteristica = c.idcaracteristica
          WHERE pc.idproyecto = p.idproyecto
        ) as features,
        (
          SELECT json_agg(
            CONCAT('/projects/', p.idproyecto, '/images/', i.idimagen)
            ORDER BY i.orden
          )
          FROM imagen_inmueble i
          WHERE i.idproyecto = p.idproyecto
        ) as images
      FROM proyecto p
      WHERE eliminado = 'false'
    `;
    
    const params = [];
    let paramCounter = 1;
    
    if (filters.tipo_proyecto) {
      sql += ` AND p.tipo_proyecto = $${paramCounter}`;
      params.push(filters.tipo_proyecto);
      paramCounter++;
    }
    
    if (filters.estado) {
      sql += ` AND p.estado = $${paramCounter}`;
      params.push(filters.estado);
      paramCounter++;
    }
    
    sql += ` ORDER BY p.idproyecto DESC`;
    
    const result = await query(sql, params);
    
    // Transformar los datos al formato esperado por el frontend
    const projects = result.rows.map(row => ({
      id: row.idproyecto.toString(),
      name: row.nombre_proyecto,
      description: row.descripcion || '',
      ownership: row.tipo_proyecto = 'propio' ? 'own' : 'third',
      status: row.estado,
      location: row.ubicacion,
      startDate: row.fecha_inicio ? row.fecha_inicio.toISOString().split('T')[0] : null,
      endDate: row.fecha_fin ? row.fecha_fin.toISOString().split('T')[0] : null,
      totalUnits: row.unidades_totales,
      soldUnits: row.unidades_vendidas,
      images: row.images || [],
      features: row.features || [],
      priceFrom: parseFloat(row.precio),
      video_link: row.enlace_video_proyecto,
    }));
    
    return projects;
  } catch (error) {
    console.error("Error en getProjects:", error);
    throw error;
  }
};

const getProjectById = async (id) => {
  try {
    const sql = `
      SELECT 
        p.idproyecto,
        p.nombre_proyecto,
        p.tipo_proyecto,
        p.ubicacion,
        p.descripcion,
        p.estado,
        p.fecha_inicio,
        p.fecha_fin,
        p.unidades_totales,
        p.unidades_vendidas,
        p.precio,
        p.enlace_video_proyecto,
        (
          SELECT json_agg(DISTINCT c.nombre)
          FROM proyecto_caracteristicas pc
          JOIN caracteristicas c ON pc.idcaracteristica = c.idcaracteristica
          WHERE pc.idproyecto = p.idproyecto
        ) as features,
        (
          SELECT json_agg(
            CONCAT('/projects/', p.idproyecto, '/images/', i.idimagen)
            ORDER BY i.orden
          )
          FROM imagen_inmueble i
          WHERE i.idproyecto = p.idproyecto
        ) as images
      FROM proyecto p
      WHERE p.idproyecto = $1 AND eliminado = 'false'
    `;
    
    const result = await query(sql, [id]);
    
    if (result.rows.length === 0) {
      throw new Error("Proyecto no encontrado");
    }
    
    const row = result.rows[0];
    
    const project = {
      id: row.idproyecto.toString(),
      name: row.nombre_proyecto,
      description: row.descripcion || '',
      status: row.estado,
      ownership: row.tipo_proyecto = 'propio' ? 'own' : 'third',
      location: row.ubicacion,
      startDate: row.fecha_inicio ? row.fecha_inicio.toISOString().split('T')[0] : null,
      endDate: row.fecha_fin ? row.fecha_fin.toISOString().split('T')[0] : null,
      totalUnits: row.unidades_totales,
      soldUnits: row.unidades_vendidas,
      images: row.images || [],
      features: row.features || [],
      priceFrom: parseFloat(row.precio),
      video_link: row.enlace_video_proyecto,
    };
    
    return project;
  } catch (error) {
    console.error("Error en getProjectById:", error);
    throw error;
  }
};

const createProject = async (projectData) => {
  try {
    const {
      name,
      description,
      status,
      location,
      startDate,
      endDate,
      totalUnits,
      soldUnits = 0,
      priceFrom,
      features = [],
      images = [],
      video_link,
    } = projectData;
    
    const tipo_proyecto = projectData.ownership === 'own' ? 'propio' : 'terceros';
    
    const insertProjectSql = `
      INSERT INTO proyecto (
        nombre_proyecto,
        tipo_proyecto,
        ubicacion,
        descripcion,
        estado,
        fecha_inicio,
        fecha_fin,
        unidades_totales,
        unidades_vendidas,
        precio,
        enlace_video_proyecto
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING idproyecto
    `;
    
    const projectResult = await query(insertProjectSql, [
      name,
      tipo_proyecto,
      location,
      description || null,
      status,
      startDate || null,
      endDate || null,
      totalUnits,
      soldUnits,
      priceFrom,
      video_link
    ]);
    
    const projectId = projectResult.rows[0].idproyecto;
    
    if (features && features.length > 0) {
      const featureIds = await getOrCreateFeatures(features);

      const valuesPlaceholders = featureIds
        .map((_, index) => `($1, $${index + 2})`)
        .join(',');

      const insertRelationsSql = `
        INSERT INTO proyecto_caracteristicas (idproyecto, idcaracteristica) 
        VALUES ${valuesPlaceholders}
      `;

      await query(insertRelationsSql, [projectId, ...featureIds]);
    }
    
    if (images && images.length > 0) {
      const compressedImages = await Promise.all(
        images.map(async (imageString, index) => {
          let buffer;
          if (imageString.startsWith('data:image')) {
            const base64Data = imageString.split(',')[1];
            buffer = Buffer.from(base64Data, 'base64');
          } 

          const compressedBuffer = await propertyService.compressImage(buffer, `imagen_${index}`);
          return compressedBuffer;
        })
      );

      const valueSets = compressedImages.map((_, index) => {
        const offset = index * 4;
        return `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4})`;
      });

      const values = [];
      compressedImages.forEach((imageFile, index) => {
        values.push(
          projectId,
          imageFile,
          index === 0,
          index
        );
      });

      const queryImagen = `
        INSERT INTO imagen_inmueble (idproyecto, imagen, es_principal, orden)
        VALUES ${valueSets.join(', ')}
        RETURNING idimagen, es_principal, orden
      `;
      
      await query(queryImagen, values);
    }
    
    return await getProjectById(projectId);
  } catch (error) {
    console.error("Error en createProject:", error);
    throw error;
  }
};

const updateProject = async (id, projectData) => {
  try {
    const {
      name,
      description,
      status,
      location,
      startDate,
      endDate,
      totalUnits,
      soldUnits,
      priceFrom,
      features,
      images = [],
      video_link,
    } = projectData;
    
    const updates = [];
    const params = [];
    let paramCounter = 1;
    
    if (name !== undefined) {
      updates.push(`nombre_proyecto = $${paramCounter++}`);
      params.push(name);
    }
    
    if (description !== undefined) {
      updates.push(`descripcion = $${paramCounter++}`);
      params.push(description);
    }
    
    if (status !== undefined) {
      updates.push(`estado = $${paramCounter++}`);
      params.push(status);
    }
    
    if (location !== undefined) {
      updates.push(`ubicacion = $${paramCounter++}`);
      params.push(location);
    }
    
    if (startDate !== undefined) {
      updates.push(`fecha_inicio = $${paramCounter++}`);
      params.push(startDate);
    }
    
    if (endDate !== undefined) {
      updates.push(`fecha_fin = $${paramCounter++}`);
      params.push(endDate);
    }
    
    if (totalUnits !== undefined) {
      updates.push(`unidades_totales = $${paramCounter++}`);
      params.push(totalUnits);
    }
    
    if (soldUnits !== undefined) {
      updates.push(`unidades_vendidas = $${paramCounter++}`);
      params.push(soldUnits);
    }
    
    if (priceFrom !== undefined) {
      updates.push(`precio = $${paramCounter++}`);
      params.push(priceFrom);
    }

    if (video_link !== undefined) {
      updates.push(`enlace_video_proyecto = $${paramCounter++}`);
      params.push(video_link);
    }
    
    if (updates.length > 0) {
      params.push(id);
      const updateSql = `
        UPDATE proyecto 
        SET ${updates.join(', ')}
        WHERE idproyecto = $${paramCounter}
      `;
      
      await query(updateSql, params);
    }
    
    if (features !== undefined && Array.isArray(features) && features.length > 0) {
      await query('DELETE FROM proyecto_caracteristicas WHERE idproyecto = $1', [id]);
      
      const featureIds = await getOrCreateFeatures(features);

      const valuesPlaceholders = featureIds
        .map((_, index) => `($1, $${index + 2})`)
        .join(',');

      const insertRelationsSql = `
        INSERT INTO proyecto_caracteristicas (idproyecto, idcaracteristica) 
        VALUES ${valuesPlaceholders}
      `;

      await query(insertRelationsSql, [id, ...featureIds]);
    }
    
    if (images && images.length > 0) {
      const existingImagesQuery = `
        SELECT idimagen, orden 
        FROM imagen_inmueble 
        WHERE idproyecto = $1
        ORDER BY orden
      `;
      const existingImagesResult = await query(existingImagesQuery, [id]);
      const existingImages = existingImagesResult.rows;

      const imagesToKeep = [];
      const newImagesToInsert = [];

      for (let index = 0; index < images.length; index++) {
        const imageString = images[index];
        
        if (imageString.startsWith('/projects/')) {
          const match = imageString.match(/\/projects\/\d+\/images\/(\d+)/);
          if (match) {
            const idimagen = parseInt(match[1]);
            imagesToKeep.push({ idimagen, newOrder: index });
          }
        } else if (imageString.startsWith('data:image')) {
          newImagesToInsert.push({ imageData: imageString, order: index });
        }
      }

      const keptImageIds = imagesToKeep.map(img => img.idimagen);
      const imagesToDelete = existingImages
        .filter(img => !keptImageIds.includes(img.idimagen))
        .map(img => img.idimagen);

      if (imagesToDelete.length > 0) {
        const deleteQuery = `
          DELETE FROM imagen_inmueble 
          WHERE idimagen = ANY($1)
        `;
        await query(deleteQuery, [imagesToDelete]);
      }

      if (imagesToKeep.length > 0) {
        const updateCases = imagesToKeep.map((img, idx) => {
          return `WHEN ${img.idimagen} THEN ${img.newOrder}`;
        }).join(' ');

        const updateEsPrincipalCases = imagesToKeep.map((img, idx) => {
          return `WHEN ${img.idimagen} THEN ${img.newOrder === 0}`;
        }).join(' ');

        const ids = imagesToKeep.map(img => img.idimagen);

        const updateQuery = `
          UPDATE imagen_inmueble 
          SET 
            orden = CASE idimagen ${updateCases} END,
            es_principal = CASE idimagen ${updateEsPrincipalCases} END
          WHERE idimagen = ANY($1)
        `;
        
        await query(updateQuery, [ids]);
      }

      if (newImagesToInsert.length > 0) {
        const compressedImages = await Promise.all(
          newImagesToInsert.map(async (imgData) => {
            const base64Data = imgData.imageData.split(',')[1];
            const buffer = Buffer.from(base64Data, 'base64');
            const compressedBuffer = await propertyService.compressImage(
              buffer, 
              `imagen_${imgData.order}`
            );
            return { compressedBuffer, order: imgData.order };
          })
        );

        const valueSets = compressedImages.map((_, index) => {
          const offset = index * 4;
          return `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4})`;
        });

        const values = [];
        compressedImages.forEach((imgData) => {
          values.push(
            id,
            imgData.compressedBuffer,
            imgData.order === 0,
            imgData.order
          );
        });

        const insertQuery = `
          INSERT INTO imagen_inmueble (idproyecto, imagen, es_principal, orden)
          VALUES ${valueSets.join(', ')}
          RETURNING idimagen, es_principal, orden
        `;
        
        await query(insertQuery, values);
      }

      const resetPrincipalQuery = `
        UPDATE imagen_inmueble 
        SET es_principal = (orden = 0)
        WHERE idproyecto = $1
      `;
      await query(resetPrincipalQuery, [id]);
    }

    return await getProjectById(id);
  } catch (error) {
    console.error("Error en updateProject:", error);
    throw error;
  }
};

const deleteProject = async (id) => {
  try {
    const sql = 'UPDATE proyecto set eliminado = $1 WHERE idproyecto = $2';
    await query(sql, [true, id]);
    return { success: true };
  } catch (error) {
    console.error("Error en deleteProject:", error);
    throw error;
  }
};

const getProjectImages = async (projectId) => {
  try {
    const sql = `
      SELECT 
        idimagen,
        idproyecto,
        es_principal,
        orden,
        encode(imagen, 'base64') as imagen_base64
      FROM imagen_inmueble
      WHERE idproyecto = $1
      ORDER BY orden ASC, idimagen ASC
    `;
    
    const result = await query(sql, [projectId]);
    
    return result.rows.map(row => ({
      idimagen: row.idimagen,
      idproyecto: row.idproyecto,
      es_principal: row.es_principal,
      orden: row.orden,
      imagen: row.imagen_base64
    }));
  } catch (error) {
    console.error("Error en getProjectImages:", error);
    throw error;
  }
};

const getProjectImageById = async (projectId, imageId) => {
  try {
    const sql = `
      SELECT 
        imagen
      FROM imagen_inmueble
      WHERE idproyecto = $1 AND idimagen = $2
    `;
    
    const result = await query(sql, [projectId, imageId]);
    
    if (result.rows.length === 0) {
      throw new Error("Imagen no encontrada");
    }
    
    return {
      imagen: result.rows[0].imagen
    };
  } catch (error) {
    console.error("Error en getProjectImageById:", error);
    throw error;
  }
};

const getFeatures = async () => {
  try {
    const sql = `
      SELECT nombre 
      FROM caracteristicas 
      ORDER BY nombre ASC
    `;
    
    const result = await query(sql);
    return result.rows.map(row => row.nombre);
  } catch (error) {
    console.error("Error en getFeatures:", error);
    throw error;
  }
};

const getOrCreateFeatures = async (featureNames) => {
  try {
    if (!featureNames || featureNames.length === 0) return [];
    
    const uniqueFeatures = [...new Map(
      featureNames.map(name => [name.toLowerCase(), name])
    ).values()];
    
    const placeholders = uniqueFeatures.map((_, i) => `LOWER($${i+1})`).join(',');
    const findSql = `
      SELECT idcaracteristica, nombre 
      FROM caracteristicas 
      WHERE LOWER(nombre) IN (${placeholders})
    `;
    
    const findResult = await query(findSql, uniqueFeatures.map(f => f.toLowerCase()));
    
    const existingMap = new Map();
    findResult.rows.forEach(row => {
      existingMap.set(row.nombre.toLowerCase(), row.idcaracteristica);
    });
    
    const featuresToCreate = uniqueFeatures.filter(
      feature => !existingMap.has(feature.toLowerCase())
    );
    
    const results = [];
    
    if (featuresToCreate.length > 0) {
      const valuesPlaceholders = featuresToCreate
        .map((_, i) => `($${i+1})`)
        .join(',');
      
      const insertSql = `
        INSERT INTO caracteristicas (nombre)
        VALUES ${valuesPlaceholders}
        RETURNING idcaracteristica, nombre
      `;
      
      const insertResult = await query(insertSql, featuresToCreate);
      
      insertResult.rows.forEach(row => {
        existingMap.set(row.nombre.toLowerCase(), row.idcaracteristica);
      });
    }
    
    return featureNames.map(name => existingMap.get(name.toLowerCase()));
    
  } catch (error) {
    console.error("Error en getOrCreateFeatures:", error);
    throw error;
  }
};

const createFeature = async (featureName) => {
  try {
    // Verificar si ya existe (case-insensitive)
    const checkSql = `
      SELECT idcaracteristica, nombre 
      FROM caracteristicas 
      WHERE LOWER(nombre) = LOWER($1)
    `;
    
    const checkResult = await query(checkSql, [featureName]);
    
    if (checkResult.rows.length > 0) {
      throw new Error(`La característica "${checkResult.rows[0].nombre}" ya existe`);
    }
    
    // Insertar nueva característica
    const insertSql = `
      INSERT INTO caracteristicas (nombre)
      VALUES ($1)
      RETURNING idcaracteristica, nombre
    `;
    
    const insertResult = await query(insertSql, [featureName]);
    
    return insertResult.rows[0].nombre;
  } catch (error) {
    console.error("Error en createFeature:", error);
    throw error;
  }
};

module.exports = {
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
  getProjectImages,
  getProjectImageById,
  getFeatures,
  createFeature,
  getOrCreateFeatures
};