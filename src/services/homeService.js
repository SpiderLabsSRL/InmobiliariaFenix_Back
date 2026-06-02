const { query } = require("../../db");

const getPropertyById = async (id) => {
  try {
    const result = await query(
      `SELECT 
        i.idinmueble,
        i.titulo,
        i.descripcion,
        i.operacion,
        i.tipo_propiedad,
        i.condicion,
        i.direccion,
        i.m2_terreno,
        i.m2_construccion,
        i.nro_pisos,
        i.nro_habitaciones,
        i.nro_baños,
        i.nro_estacionamiento,
        i.precio_capatacion_m,
        i.precio_capatacion_s,
        i.precio_captacion_i,
        i.ascensor,
        i.garaje,
        i.terraza,
        i.piscina,
        i.año_construccion,
        i.longitud,
        i.latitud,
        i.estado,
        i.observacion,
        i.fecha_creacion,
        i.enlace_video,
        i.porcentajeComision,
        i.nombre_propietario,
        i.celular_propietario,
        i.nombre_contacto_secundario,
        i.celular_contacto_secundario,
        i.porcentajeDepreciacion,
        i.porcentaje_venta,
        i.porcentaje_captacion,
        i.es_exclusivo,
        d.nombre as departamento,
        p.nombre as provincia,
        m.nombre as municipio,
        a.idagente,
        a.nombre as agente_nombre,
        a.apellido as agente_apellido,
        a.email as agente_email,
        a.telefono as agente_telefono,
        a.ci as agente_ci,
        a.especializacion as agente_especializacion,
        a.rol as agente_rol,
        a.porcentajeComision as agente_porcentaje_comision,
        (
          SELECT json_agg(
            CONCAT('/inmuebles/', i.idinmueble, '/images/', ii.idimagen)
            ORDER BY ii.orden
          )
          FROM imagen_inmueble ii
          WHERE ii.idinmueble = i.idinmueble
        ) as images
      FROM inmueble i
      LEFT JOIN municipio m ON i.idmunicipio = m.idmunicipio
      LEFT JOIN provincia p ON m.idprovincia = p.idprovincia
      LEFT JOIN departamento d ON p.iddepartamento = d.iddepartamento
      LEFT JOIN agente a ON i.idagente = a.idagente
      WHERE i.idinmueble = $1 AND i.estado != 'eliminado'`,
      [id]
    );

    if (result.rows.length === 0) {
      return null;
    }

    const property = result.rows[0];

    // Transformar a formato esperado por el frontend
    return {
      id: property.idinmueble.toString(),
      title: property.titulo,
      description: property.descripcion,
      price: property.precio_capatacion_s || property.precio_capatacion_m || 0,
      idealPrice: property.precio_captacion_i,
      priceScale: {
        minimum: property.precio_capatacion_m || 0,
        suggested: property.precio_capatacion_s || 0,
        ideal: property.precio_captacion_i || 0
      },
      type: property.operacion,
      propertyType: property.tipo_propiedad,
      department: property.departamento,
      province: property.provincia,
      municipality: property.municipio,
      city: property.municipio,
      zone: property.provincia,
      address: property.direccion,
      sqMeters: property.m2_construccion,
      sqMetersLand: property.m2_terreno,
      bedrooms: property.nro_habitaciones,
      bathrooms: property.nro_baños,
      parkingSpots: property.nro_estacionamiento,
      numberOfFloors: property.nro_pisos,
      hasElevator: property.ascensor,
      hasGarage: property.garaje,
      hasTerrace: property.terraza,
      hasPool: property.piscina,
      energyCert: "pendiente",
      yearBuilt: property.año_construccion,
      condition: property.condicion === 'segunda mano' ? 'segunda_mano' : property.condicion,
      images: property.images || [],
      featured: property.es_exclusivo || false,
      lat: property.latitud,
      lng: property.longitud,
      status: property.estado,
      capturedDate: property.fecha_creacion,
      agentId: property.idagente ? property.idagente.toString() : null,
      agentName: property.agente_nombre && property.agente_apellido 
        ? `${property.agente_nombre} ${property.agente_apellido}` 
        : null,
      agentEmail: property.agente_email,
      captureExchangeRate: 6.96,
      variableExchangeRate: 6.96,
      observations: property.observacion,
      enlace_video: property.enlace_video,
      nombre_propietario: property.nombre_propietario,
      celular_propietario: property.celular_propietario,
      idmunicipio: property.idmunicipio,
      porcentajeComision: property.porcentajeComision,
      porcentajeCaptacion: property.porcentaje_captacion,
      porcentajeVenta: property.porcentaje_venta,
      precio_m2_construccion: property.precio_capatacion_s / property.m2_construccion,
      porcentaje_depreciacion: property.porcentajedepreciacion,
      esExclusivo: property.es_exclusivo,
      nombre_contacto_secundario: property.nombre_contacto_secundario,
      celular_contacto_secundario: property.celular_contacto_secundario
    };
  } catch (error) {
    console.error("Error en getPropertyById:", error);
    throw error;
  }
};

const getFeaturedProperties = async (limit = 6) => {
  try {
    const result = await query(
      `SELECT 
        i.idinmueble,
        i.titulo,
        i.descripcion,
        i.operacion,
        i.tipo_propiedad,
        i.direccion,
        i.m2_construccion,
        i.nro_habitaciones,
        i.nro_baños,
        i.precio_capatacion_s,
        i.latitud,
        i.longitud,
        i.es_exclusivo,
        m.nombre as municipio,
        (
          SELECT imagen 
          FROM imagen_inmueble 
          WHERE idinmueble = i.idinmueble 
          AND es_principal = true 
          LIMIT 1
        ) as foto_principal
      FROM inmueble i
      LEFT JOIN municipio m ON i.idmunicipio = m.idmunicipio
      WHERE i.estado = 'activo'
      ORDER BY i.fecha_creacion DESC
      LIMIT $1`,
      [limit]
    );

    return result.rows.map(row => ({
      id: row.idinmueble.toString(),
      title: row.titulo,
      description: row.descripcion,
      price: row.precio_capatacion_s || 0,
      type: row.operacion,
      propertyType: row.tipo_propiedad,
      city: row.municipio,
      address: row.direccion,
      sqMeters: row.m2_construccion,
      bedrooms: row.nro_habitaciones,
      bathrooms: row.nro_baños,
      images: row.foto_principal ? [row.foto_principal.toString('base64')] : [],
      featured: row.es_exclusivo,
      lat: row.latitud,
      lng: row.longitud,
      capturedDate: new Date().toISOString()
    }));
  } catch (error) {
    console.error("Error en getFeaturedProperties:", error);
    throw error;
  }
};

const getProjects = async (city = null, status = null) => {
  try {
    let queryText = `
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
        p.enlace_video_proyecto,
        p.precio,
        (
          SELECT json_agg(
            CONCAT('/projects/', p.idproyecto, '/images/', i.idimagen)
            ORDER BY i.orden
          )
          FROM imagen_inmueble i
          WHERE i.idproyecto = p.idproyecto
        ) as images
      FROM proyecto p
      WHERE p.eliminado = false
    `;
    
    const queryParams = [];
    let paramIndex = 1;

    if (status) {
      queryText += ` AND p.estado = $${paramIndex}`;
      queryParams.push(status);
      paramIndex++;
    }

    queryText += ` ORDER BY p.fecha_inicio DESC`;

    const result = await query(queryText, queryParams);

    // Obtener características para cada proyecto
    const projects = [];
    for (const row of result.rows) {
      const featuresResult = await query(
        `SELECT c.nombre 
         FROM proyecto_caracteristicas pc
         JOIN caracteristicas c ON pc.idcaracteristica = c.idcaracteristica
         WHERE pc.idproyecto = $1`,
        [row.idproyecto]
      );

      projects.push({
        id: row.idproyecto.toString(),
        name: row.nombre_proyecto,
        description: row.descripcion,
        status: row.estado,
        location: row.ubicacion,
        city: row.municipio,
        startDate: row.fecha_inicio,
        endDate: row.fecha_fin,
        totalUnits: row.unidades_totales,
        soldUnits: row.unidades_vendidas,
        images: row.images || [],
        features: featuresResult.rows.map(f => f.nombre),
        priceFrom: row.precio,
        video_link: row.enlace_video_proyecto,
        ownership: row.tipo_proyecto === 'propio' ? 'own' : 'third'
      });
    }

    return projects;
  } catch (error) {
    console.error("Error en getProjects:", error);
    throw error;
  }
};

const getProjectById = async (id) => {
  try {
    const result = await query(
      `SELECT 
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
        p.enlace_video_proyecto,
        p.precio,
        m.nombre as municipio,
        m.latitud,
        m.longitud
      FROM proyecto p
      LEFT JOIN municipio m ON p.ubicacion::integer = m.idmunicipio
      WHERE p.idproyecto = $1 AND p.eliminado = false`,
      [id]
    );

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];

    // Obtener todas las imágenes del proyecto
    const imagesResult = await query(
      `SELECT imagen, orden 
       FROM imagen_inmueble 
       WHERE idproyecto = $1 
       ORDER BY orden ASC`,
      [id]
    );

    const images = imagesResult.rows.map(row => 
      row.imagen ? row.imagen.toString('base64') : null
    ).filter(img => img !== null);

    // Obtener características
    const featuresResult = await query(
      `SELECT c.nombre 
       FROM proyecto_caracteristicas pc
       JOIN caracteristicas c ON pc.idcaracteristica = c.idcaracteristica
       WHERE pc.idproyecto = $1`,
      [id]
    );

    return {
      id: row.idproyecto.toString(),
      name: row.nombre_proyecto,
      description: row.descripcion,
      status: row.estado,
      location: row.ubicacion,
      city: row.municipio,
      startDate: row.fecha_inicio,
      endDate: row.fecha_fin,
      totalUnits: row.unidades_totales,
      soldUnits: row.unidades_vendidas,
      images: images,
      features: featuresResult.rows.map(f => f.nombre),
      priceFrom: row.precio,
      lat: row.latitud,
      lng: row.longitud,
      video_link: row.enlace_video_proyecto,
      ownership: row.tipo_proyecto === 'propio' ? 'own' : 'third'
    };
  } catch (error) {
    console.error("Error en getProjectById:", error);
    throw error;
  }
};

const getLatestProperties = async (limit = 6) => {
  try {
    const result = await query(
      `SELECT 
        i.idinmueble,
        i.titulo,
        i.descripcion,
        i.operacion,
        i.tipo_propiedad,
        i.direccion,
        i.m2_construccion,
        i.nro_habitaciones,
        i.nro_baños,
        i.precio_capatacion_s,
        i.latitud,
        i.longitud,
        i.fecha_creacion,
        m.nombre as municipio,
        (
          SELECT imagen 
          FROM imagen_inmueble 
          WHERE idinmueble = i.idinmueble 
          ORDER BY es_principal DESC, orden ASC 
          LIMIT 1
        ) as foto_principal
      FROM inmueble i
      LEFT JOIN municipio m ON i.idmunicipio = m.idmunicipio
      WHERE i.estado = 'activo'
      ORDER BY i.fecha_creacion DESC
      LIMIT $1`,
      [limit]
    );

    return result.rows.map(row => ({
      id: row.idinmueble.toString(),
      title: row.titulo,
      description: row.descripcion,
      price: row.precio_capatacion_s || 0,
      type: row.operacion,
      propertyType: row.tipo_propiedad,
      city: row.municipio,
      address: row.direccion,
      sqMeters: row.m2_construccion,
      bedrooms: row.nro_habitaciones,
      bathrooms: row.nro_baños,
      images: row.foto_principal ? [row.foto_principal.toString('base64')] : [],
      featured: false,
      lat: row.latitud,
      lng: row.longitud,
      capturedDate: row.fecha_creacion
    }));
  } catch (error) {
    console.error("Error en getLatestProperties:", error);
    throw error;
  }
};

const getTotalPropertiesCount = async () => {
  try {
    const result = await query(
      `SELECT COUNT(*) as total 
       FROM inmueble 
       WHERE estado = 'activo'`
    );

    return parseInt(result.rows[0].total);
  } catch (error) {
    console.error("Error en getTotalPropertiesCount:", error);
    throw error;
  }
};

const searchProperties = async (params) => {
  try {
    let queryText = `
      SELECT 
        i.idinmueble,
        i.titulo,
        i.descripcion,
        i.operacion,
        i.tipo_propiedad,
        i.direccion,
        i.m2_construccion,
        i.nro_habitaciones,
        i.nro_baños,
        i.nro_estacionamiento,
        i.precio_capatacion_s,
        i.latitud,
        i.longitud,
        i.es_exclusivo,
        m.nombre as municipio,
        (
          SELECT imagen 
          FROM imagen_inmueble 
          WHERE idinmueble = i.idinmueble 
          AND es_principal = true 
          LIMIT 1
        ) as foto_principal
      FROM inmueble i
      LEFT JOIN municipio m ON i.idmunicipio = m.idmunicipio
      WHERE i.estado = 'activo'
    `;
    
    const queryParams = [];
    let paramIndex = 1;

    if (params.city) {
      queryText += ` AND m.nombre ILIKE $${paramIndex}`;
      queryParams.push(`%${params.city}%`);
      paramIndex++;
    }

    if (params.zone) {
      queryText += ` AND m.nombre ILIKE $${paramIndex}`;
      queryParams.push(`%${params.zone}%`);
      paramIndex++;
    }

    if (params.operationType) {
      queryText += ` AND i.operacion = $${paramIndex}`;
      queryParams.push(params.operationType);
      paramIndex++;
    }

    if (params.propertyType) {
      queryText += ` AND i.tipo_propiedad = $${paramIndex}`;
      queryParams.push(params.propertyType);
      paramIndex++;
    }

    if (params.maxPrice) {
      queryText += ` AND i.precio_capatacion_s <= $${paramIndex}`;
      queryParams.push(params.maxPrice);
      paramIndex++;
    }

    if (params.minPrice) {
      queryText += ` AND i.precio_capatacion_s >= $${paramIndex}`;
      queryParams.push(params.minPrice);
      paramIndex++;
    }

    if (params.bedrooms) {
      queryText += ` AND i.nro_habitaciones >= $${paramIndex}`;
      queryParams.push(params.bedrooms);
      paramIndex++;
    }

    if (params.bathrooms) {
      queryText += ` AND i.nro_baños >= $${paramIndex}`;
      queryParams.push(params.bathrooms);
      paramIndex++;
    }

    if (params.minSqm) {
      queryText += ` AND i.m2_construccion >= $${paramIndex}`;
      queryParams.push(params.minSqm);
      paramIndex++;
    }

    queryText += ` ORDER BY i.fecha_creacion DESC`;

    if (params.limit && params.limit > 0) {
      queryText += ` LIMIT $${paramIndex}`;
      queryParams.push(params.limit);
    }

    const result = await query(queryText, queryParams);

    return result.rows.map(row => ({
      id: row.idinmueble.toString(),
      title: row.titulo,
      description: row.descripcion,
      price: row.precio_capatacion_s || 0,
      type: row.operacion,
      propertyType: row.tipo_propiedad,
      city: row.municipio,
      address: row.direccion,
      sqMeters: row.m2_construccion,
      bedrooms: row.nro_habitaciones,
      bathrooms: row.nro_baños,
      parkingSpots: row.nro_estacionamiento,
      images: row.foto_principal ? [row.foto_principal.toString('base64')] : [],
      featured: row.es_exclusivo,
      lat: row.latitud,
      lng: row.longitud
    }));
  } catch (error) {
    console.error("Error en searchProperties:", error);
    throw error;
  }
};

const getCities = async () => {
  try {
    const result = await query(
      `SELECT nombre
       FROM departamento
       ORDER BY nombre`
    );

    return result.rows.map(row => row.nombre);
  } catch (error) {
    console.error("Error en getCities:", error);
    throw error;
  }
};

const getZonesByCity = async (city) => {
  try {
    if (!city) {
      return [];
    }

    const result = await query(
      `SELECT m.nombre as zona
       FROM municipio m
       JOIN provincia p ON p.idprovincia = m.idprovincia
       JOIN departamento d ON p.iddepartamento = p.iddepartamento
       WHERE d.nombre ILIKE $1
       ORDER BY m.nombre`,
      [`%${city}%`]
    );

    return result.rows.map(row => row.zona);
  } catch (error) {
    console.error("Error en getZonesByCity:", error);
    throw error;
  }
};

const getAgentByPropertyId = async (propertyId) => {
  try {
    const result = await query(
      `SELECT 
        a.idagente,
        a.nombre,
        a.apellido,
        a.email,
        a.telefono,
        a.ci,
        a.direccion,
        a.especializacion,
        a.rol,
        a.estado,
        a.foto,
        a.porcentajeComision,
        a.idgrupo,
        g.nombre as grupo_nombre
      FROM agente a
      INNER JOIN inmueble i ON i.idagente = a.idagente
      LEFT JOIN grupo g ON a.idgrupo = g.idgrupo
      WHERE i.idinmueble = $1 AND a.estado = 'activo'`,
      [propertyId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    const agent = result.rows[0];

    // Obtener redes sociales del agente
    const socialResult = await query(
      `SELECT ts.nombre, rsa.url
       FROM red_social_agente rsa
       JOIN tipo_red_social ts ON rsa.idtipo_red_social = ts.idtipo_red_social
       WHERE rsa.idagente = $1`,
      [agent.idagente]
    );

    // Obtener cantidad de propiedades del agente
    const propertiesResult = await query(
      `SELECT COUNT(*) as total
       FROM inmueble
       WHERE idagente = $1 AND estado = 'activo'`,
      [agent.idagente]
    );

    const socialNetworks = {};
    socialResult.rows.forEach(row => {
      const networkName = row.nombre.toLowerCase();
      socialNetworks[networkName] = row.url;
    });

    return {
      id: agent.idagente,
      name: agent.nombre,
      lastName: agent.apellido,
      email: agent.email,
      phone: agent.telefono,
      photo: agent.foto ? agent.foto.toString('base64') : null,
      specialization: agent.especializacion,
      propertiesCount: parseInt(propertiesResult.rows[0].total),
      role: agent.rol,
      active: agent.estado === 'activo',
      ci: agent.ci,
      address: agent.direccion,
      joinDate: new Date().toISOString(),
      capturedProperties: [],
      groupId: agent.idgrupo,
      groupName: agent.grupo_nombre,
      porcentajeComision: agent.porcentajecomision,
      redesSociales: socialResult.rows.map(row => ({
        nombre: row.nombre,
        url: row.url
      })),
      facebook: socialNetworks.facebook,
      instagram: socialNetworks.instagram,
      tiktok: socialNetworks.tiktok,
      youtube: socialNetworks.youtube
    };
  } catch (error) {
    console.error("Error en getAgentByPropertyId:", error);
    throw error;
  }
};

const getPropertyCoordinates = async (propertyId) => {
  try {
    const result = await query(
      `SELECT 
        i.latitud,
        i.longitud,
        i.direccion,
        m.nombre as municipio,
        p.nombre as provincia,
        d.nombre as departamento
      FROM inmueble i
      LEFT JOIN municipio m ON i.idmunicipio = m.idmunicipio
      LEFT JOIN provincia p ON m.idprovincia = p.idprovincia
      LEFT JOIN departamento d ON p.iddepartamento = d.iddepartamento
      WHERE i.idinmueble = $1 AND i.estado != 'eliminado'`,
      [propertyId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    const fullAddress = `${row.direccion}, ${row.municipio || ''}, ${row.provincia || ''}, ${row.departamento || ''}`;

    return {
      lat: row.latitud,
      lng: row.longitud,
      address: fullAddress
    };
  } catch (error) {
    console.error("Error en getPropertyCoordinates:", error);
    throw error;
  }
};

const getAgentById = async (agentId) => {
  try {
    const result = await query(
      `SELECT 
        a.idagente,
        a.nombre,
        a.apellido,
        a.email,
        a.telefono,
        a.ci,
        a.direccion,
        a.especializacion,
        a.rol,
        a.estado,
        a.foto,
        a.porcentajeComision,
        a.idgrupo,
        g.nombre as grupo_nombre
      FROM agente a
      LEFT JOIN grupo g ON a.idgrupo = g.idgrupo
      WHERE a.idagente = $1 AND a.estado != 'eliminado'`,
      [agentId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    const agent = result.rows[0];

    // Obtener redes sociales
    const socialResult = await query(
      `SELECT ts.nombre, rsa.url
       FROM red_social_agente rsa
       JOIN tipo_red_social ts ON rsa.idtipo_red_social = ts.idtipo_red_social
       WHERE rsa.idagente = $1`,
      [agentId]
    );

    // Obtener propiedades del agente
    const propertiesResult = await query(
      `SELECT i.idinmueble
       FROM inmueble i
       WHERE i.idagente = $1 AND i.estado = 'activo'
       LIMIT 10`,
      [agentId]
    );

    const socialNetworks = {};
    socialResult.rows.forEach(row => {
      const networkName = row.nombre.toLowerCase();
      socialNetworks[networkName] = row.url;
    });

    return {
      id: agent.idagente,
      name: agent.nombre,
      lastName: agent.apellido,
      email: agent.email,
      phone: agent.telefono,
      photo: agent.foto ? agent.foto.toString('base64') : null,
      specialization: agent.especializacion,
      propertiesCount: propertiesResult.rows.length,
      role: agent.rol,
      active: agent.estado === 'activo',
      ci: agent.ci,
      address: agent.direccion,
      joinDate: new Date().toISOString(),
      capturedProperties: propertiesResult.rows.map(row => row.idinmueble.toString()),
      groupId: agent.idgrupo,
      groupName: agent.grupo_nombre,
      porcentajeComision: agent.porcentajecomision,
      redesSociales: socialResult.rows.map(row => ({
        nombre: row.nombre,
        url: row.url
      })),
      facebook: socialNetworks.facebook,
      instagram: socialNetworks.instagram,
      tiktok: socialNetworks.tiktok,
      youtube: socialNetworks.youtube
    };
  } catch (error) {
    console.error("Error en getAgentById:", error);
    throw error;
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