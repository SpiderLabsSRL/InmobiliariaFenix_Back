const { query } = require("../../db");

const searchAll = async (filters) => {
  try {
    let propertiesQuery = `
      SELECT
        i.idinmueble as id,
        i.titulo as title,
        i.descripcion as description,
        i.precio_capatacion_s as price,
        i.precio_captacion_i as "idealPrice",
        i.operacion as type,
        i.tipo_propiedad as "propertyType",
        i.condicion as condition,
        i.direccion as address,
        i.m2_construccion as "sqMeters",
        i.m2_terreno as "sqMetersLand",
        i.nro_pisos as "numberOfFloors",
        i.nro_habitaciones as bedrooms,
        i.nro_baños as bathrooms,
        i.nro_estacionamiento as "parkingSpots",
        i.ascensor as "hasElevator",
        i.garaje as "hasGarage",
        i.terraza as "hasTerrace",
        i.piscina as "hasPool",
        i.año_construccion as "yearBuilt",
        i.latitud as lat,
        i.longitud as lng,
        i.estado as status,
        i.observacion as observations,
        i.fecha_creacion as "capturedDate",
        i.enlace_video as "enlace_video",
        i.porcentajeComision as "porcentajeComision",
        i.nombre_propietario as "nombre_propietario",
        i.celular_propietario as "celular_propietario",
        i.idmunicipio as "idmunicipio",
        i.precio_metro_construccion as "precio_m2_construccion",
        i.porcentajeDepreciacion as "porcentaje_depreciacion",
        i.porcentaje_venta as "porcentaje_venta",
        i.porcentaje_captacion as "porcentaje_captacion",
        i.es_exclusivo as "es_exclusivo",
        a.nombre as "agentName",
        a.idagente as "agentId",
        m.nombre as city,
        p.nombre as province,
        d.nombre as department,
        (
          SELECT json_agg(
            CONCAT('/inmuebles/', i.idinmueble, '/images/', ii.idimagen, '?t=', EXTRACT(EPOCH FROM NOW()))
          )
          FROM imagen_inmueble ii 
          WHERE ii.idinmueble = i.idinmueble
        ) as images
      FROM inmueble i
      LEFT JOIN agente a ON i.idagente = a.idagente
      LEFT JOIN municipio m ON i.idmunicipio = m.idmunicipio
      LEFT JOIN provincia p ON m.idprovincia = p.idprovincia
      LEFT JOIN departamento d ON p.iddepartamento = d.iddepartamento
      WHERE i.estado = 'activo' OR i.estado = 'reservado'
    `;

    const queryParams = [];

    if (filters.search || filters.department || filters.province || filters.type || filters.municipality ||
        filters.propertyType || filters.priceMin !== undefined || filters.priceMax !== undefined ||
        filters.sqMin !== undefined || filters.sqMax !== undefined ||
        filters.bedroomsMin !== undefined || filters.bathroomsMin !== undefined ||
        filters.hasGarage || filters.hasPool || filters.hasTerrace || filters.hasElevator) {
      
      let paramCounter = 1;
      
      // Búsqueda por texto
      if (filters.search) {
        propertiesQuery += ` AND (
          i.titulo ILIKE $${paramCounter} OR 
          i.descripcion ILIKE $${paramCounter} OR 
          i.direccion ILIKE $${paramCounter} OR
          m.nombre ILIKE $${paramCounter} OR
          p.nombre ILIKE $${paramCounter} OR
          d.nombre ILIKE $${paramCounter}
        )`;
        queryParams.push(`%${filters.search}%`);
        paramCounter++;
      }
      
      if (filters.municipality) {
        propertiesQuery += ` AND m.nombre ILIKE $${paramCounter}`;
        queryParams.push(`%${filters.municipality}%`);
        paramCounter++;
      }

      if (filters.province) {
        propertiesQuery += ` AND p.nombre ILIKE $${paramCounter}`;
        queryParams.push(`%${filters.province}%`);
        paramCounter++;
      }

      if (filters.department) {
        propertiesQuery += ` AND m.nombre ILIKE $${paramCounter}`;
        queryParams.push(`%${filters.department}%`);
        paramCounter++;
      }
      
      // Filtro por tipo de operación
      if (filters.type) {
        propertiesQuery += ` AND i.operacion = $${paramCounter}`;
        queryParams.push(filters.type);
        paramCounter++;
      }
      
      // Filtro por tipo de propiedad
      if (filters.propertyType) {
        propertiesQuery += ` AND i.tipo_propiedad = $${paramCounter}`;
        queryParams.push(filters.propertyType.toLowerCase());
        paramCounter++;
      }
      
      // Filtro por precio mínimo
      if (filters.priceMin !== undefined && filters.priceMin !== '') {
        propertiesQuery += ` AND i.precio_captacion_i >= $${paramCounter}`;
        queryParams.push(Number(filters.priceMin));
        paramCounter++;
      }
      
      // Filtro por precio máximo
      if (filters.priceMax !== undefined && filters.priceMax !== '') {
        propertiesQuery += ` AND i.precio_captacion_i <= $${paramCounter}`;
        queryParams.push(Number(filters.priceMax));
        paramCounter++;
      }
      
      // Filtro por metros cuadrados mínimo
      if (filters.sqMin !== undefined && filters.sqMin !== '') {
        propertiesQuery += ` AND i.m2_construccion >= $${paramCounter}`;
        queryParams.push(Number(filters.sqMin));
        paramCounter++;
      }
      
      // Filtro por metros cuadrados máximo
      if (filters.sqMax !== undefined && filters.sqMax !== '') {
        propertiesQuery += ` AND i.m2_construccion <= $${paramCounter}`;
        queryParams.push(Number(filters.sqMax));
        paramCounter++;
      }
      
      // Filtro por número de habitaciones mínimo
      if (filters.bedroomsMin !== undefined && filters.bedroomsMin !== '') {
        propertiesQuery += ` AND i.nro_habitaciones >= $${paramCounter}`;
        queryParams.push(Number(filters.bedroomsMin));
        paramCounter++;
      }
      
      // Filtro por número de baños mínimo
      if (filters.bathroomsMin !== undefined && filters.bathroomsMin !== '') {
        propertiesQuery += ` AND i.nro_baños >= $${paramCounter}`;
        queryParams.push(Number(filters.bathroomsMin));
        paramCounter++;
      }
      
      // Filtro por garaje
      if (filters.hasGarage) {
        propertiesQuery += ` AND i.garaje = true`;
      }
      
      // Filtro por piscina
      if (filters.hasPool) {
        propertiesQuery += ` AND i.piscina = true`;
      }
      
      // Filtro por terraza
      if (filters.hasTerrace) {
        propertiesQuery += ` AND i.terraza = true`;
      }
      
      // Filtro por ascensor
      if (filters.hasElevator) {
        propertiesQuery += ` AND i.ascensor = true`;
      }
      
    }
    propertiesQuery += ` GROUP BY i.idinmueble, a.nombre, a.idagente, m.nombre, p.nombre, d.nombre LIMIT 20`
    const propertiesResult = await query(propertiesQuery, queryParams);

    return propertiesResult.rows;
    
  } catch (error) {
    console.error("Error en globalSearchService:", error);
    throw error;
  }
};

const getPropertyById = async (propertyId) => {
  try {
    let propertyQuery = `
      SELECT
        i.idinmueble as id,
        i.titulo as title,
        i.descripcion as description,
        i.precio_capatacion_s as price,
        i.precio_captacion_i as "idealPrice",
        i.operacion as type,
        i.tipo_propiedad as "propertyType",
        i.condicion as condition,
        i.direccion as address,
        i.m2_construccion as "sqMeters",
        i.m2_terreno as "sqMetersLand",
        i.nro_pisos as "numberOfFloors",
        i.nro_habitaciones as bedrooms,
        i.nro_baños as bathrooms,
        i.nro_estacionamiento as "parkingSpots",
        i.ascensor as "hasElevator",
        i.garaje as "hasGarage",
        i.terraza as "hasTerrace",
        i.piscina as "hasPool",
        i.año_construccion as "yearBuilt",
        i.latitud as lat,
        i.longitud as lng,
        i.estado as status,
        i.observacion as observations,
        i.fecha_creacion as "capturedDate",
        i.enlace_video as "enlace_video",
        i.porcentajeComision as "porcentajeComision",
        i.nombre_propietario as "nombre_propietario",
        i.celular_propietario as "celular_propietario",
        i.idmunicipio as "idmunicipio",
        i.precio_metro_construccion as "precio_m2_construccion",
        i.porcentajeDepreciacion as "porcentaje_depreciacion",
        i.porcentaje_venta as "porcentaje_venta",
        i.porcentaje_captacion as "porcentaje_captacion",
        i.es_exclusivo as "es_exclusivo",
        a.nombre as "agentName",
        a.idagente as "agentId",
        m.nombre as city,
        p.nombre as province,
        d.nombre as department,
        (
          SELECT json_agg(
            CONCAT('/inmuebles/', i.idinmueble, '/images/', ii.idimagen, '?t=', EXTRACT(EPOCH FROM NOW()))
          )
          FROM imagen_inmueble ii 
          WHERE ii.idinmueble = i.idinmueble
        ) as images
      FROM inmueble i
      LEFT JOIN agente a ON i.idagente = a.idagente
      LEFT JOIN municipio m ON i.idmunicipio = m.idmunicipio
      LEFT JOIN provincia p ON m.idprovincia = p.idprovincia
      LEFT JOIN departamento d ON p.iddepartamento = d.iddepartamento
      WHERE (i.estado = 'activo' OR i.estado = 'reservado') AND i.idinmueble = $1
      GROUP BY i.idinmueble, a.nombre, a.idagente, m.nombre, p.nombre, d.nombre LIMIT 1
    `;
    const propertyResult = await query(propertyQuery, [propertyId]);

    return propertyResult.rows[0];
  } catch (error) {
    console.error("Error en globalSearchService:", error);
    throw error;
  }
}

module.exports = {
  searchAll,
  getPropertyById,
};