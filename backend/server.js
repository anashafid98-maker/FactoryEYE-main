const express = require('express');
const sql = require('mssql');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// SQL Server Configuration - FactoryEYE Database
// Using Windows Authentication (integratedSecurity=true equivalent)
const dbConfig = {
  server: 'D-CZC929DNPY\\MSSQLSERVER01',
  database: 'FactoryEYE',
  port: 1433,
  options: {
    encrypt: true,
    trustServerCertificate: true,
    integratedSecurity: true, // Windows Authentication
    enableArithAbort: true
  },
  authentication: {
    type: 'default',
    options: {
      // For Windows Authentication, we don't need username/password
      // The application will use the current Windows user credentials
    }
  }
};

// SQL Authentication fallback
const dbConfigWithAuth = {
  server: 'D-CZC929DNPY\\MSSQLSERVER01',
  database: 'FactoryEYE',
  port: 1433,
  user: 'anashafid',
  password: 'Ana@Secure1234',
  options: {
    encrypt: true,
    trustServerCertificate: true,
    enableArithAbort: true
  }
};



// Database connection pool
let pool = null;

async function connectToDatabase() {
  try {
    // First, try to connect to master to create database if needed
    console.log('Checking if FactoryEYE database exists...');
    const masterConfig = {
      server: 'D-CZC929DNPY\\MSSQLSERVER01',
      database: 'master',
      port: 1433,
      options: {
        encrypt: true,
        trustServerCertificate: true,
        enableArithAbort: true
      }
    };
    
    // Try Windows Auth first
    try {
      const masterPool = await sql.connect({
        ...masterConfig,
        authentication: {
          type: 'default',
          options: {}
        },
        options: {
          encrypt: true,
          trustServerCertificate: true,
          integratedSecurity: true,
          enableArithAbort: true
        }
      });
      
      // Create database if not exists
      await masterPool.query(`
        IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = 'FactoryEYE')
        BEGIN
          CREATE DATABASE FactoryEYE
          PRINT 'FactoryEYE database created'
        END
      `);
      await masterPool.close();
      console.log('✅ FactoryEYE database ready');
    } catch (masterErr) {
      console.log('Trying SQL Auth for master...');
      // Try SQL Auth
      const masterPool = await sql.connect({
        ...masterConfig,
        user: 'anashafid',
        password: 'Ana@Secure1234'
      });
      
      await masterPool.query(`
        IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = 'FactoryEYE')
        BEGIN
          CREATE DATABASE FactoryEYE
          PRINT 'FactoryEYE database created'
        END
      `);
      await masterPool.close();
      console.log('✅ FactoryEYE database ready');
    }
    
    // Now connect to FactoryEYE database
    // Try Windows Authentication
    console.log('Attempting to connect to FactoryEYE database with Windows Authentication...');
    pool = await sql.connect(dbConfig);
    console.log('✅ Connected to FactoryEYE database (Windows Auth)');
    return true;
  } catch (err) {
    console.log('Windows Auth failed:', err.message);
    
    // Try SQL Authentication fallback
    try {
      console.log('Attempting to connect with SQL Authentication...');
      pool = await sql.connect(dbConfigWithAuth);
      console.log('✅ Connected to FactoryEYE database (SQL Auth)');
      return true;
    } catch (sqlErr) {
      console.log('SQL Auth failed:', sqlErr.message);
      console.log('⚠️ Running in demo mode with mock data');
      return false;
    }
  }
}

// Initialize database tables
async function initializeTables() {
  try {
    // Create Projects table
    await pool.query(`
      IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Projects')
      CREATE TABLE Projects (
        id NVARCHAR(36) PRIMARY KEY DEFAULT NEWID(),
        name NVARCHAR(255) NOT NULL,
        description NVARCHAR(MAX),
        status NVARCHAR(50) DEFAULT 'active',
        created_by NVARCHAR(100),
        created_at DATETIME DEFAULT GETDATE(),
        updated_at DATETIME DEFAULT GETDATE()
      )
    `);
    console.log('✅ Projects table ready');

    // Create Zones table
    await pool.query(`
      IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Zones')
      CREATE TABLE Zones (
        id NVARCHAR(36) PRIMARY KEY DEFAULT NEWID(),
        project_id NVARCHAR(36) NOT NULL,
        name NVARCHAR(255) NOT NULL,
        description NVARCHAR(MAX),
        location NVARCHAR(255),
        created_at DATETIME DEFAULT GETDATE(),
        updated_at DATETIME DEFAULT GETDATE()
      )
    `);
    console.log('✅ Zones table ready');

    // Create Equipment table
    await pool.query(`
      IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Equipment')
      CREATE TABLE Equipment (
        id NVARCHAR(36) PRIMARY KEY DEFAULT NEWID(),
        zone_id NVARCHAR(36) NOT NULL,
        name NVARCHAR(255) NOT NULL,
        reference NVARCHAR(100),
        type NVARCHAR(100),
        manufacturer NVARCHAR(255),
        model NVARCHAR(255),
        serial_number NVARCHAR(255),
        installation_date DATE,
        status NVARCHAR(50) DEFAULT 'operational',
        diagram_url NVARCHAR(500),
        created_at DATETIME DEFAULT GETDATE(),
        updated_at DATETIME DEFAULT GETDATE()
      )
    `);
    console.log('✅ Equipment table ready');

    // Create Sensor Installations table
    await pool.query(`
      IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'SensorInstallations')
      CREATE TABLE SensorInstallations (
        id NVARCHAR(36) PRIMARY KEY DEFAULT NEWID(),
        equipment_id NVARCHAR(36) NOT NULL,
        sensor_name NVARCHAR(255) NOT NULL,
        sensor_type NVARCHAR(100),
        measurement_type NVARCHAR(100),
        installation_point NVARCHAR(255),
        position_x FLOAT DEFAULT 0,
        position_y FLOAT DEFAULT 0,
        manufacturer NVARCHAR(255),
        model NVARCHAR(255),
        serial_number NVARCHAR(255),
        installation_date DATE,
        calibration_date DATE,
        next_calibration_date DATE,
        installed_by NVARCHAR(255),
        is_active BIT DEFAULT 1,
        status NVARCHAR(50) DEFAULT 'good',
        notes NVARCHAR(MAX),
        created_at DATETIME DEFAULT GETDATE(),
        updated_at DATETIME DEFAULT GETDATE()
      )
    `);
    console.log('✅ Sensor Installations table ready');

    console.log('✅ All database tables initialized');
  } catch (err) {
    console.error('❌ Error initializing tables:', err.message);
  }
}

// ==================== API ROUTES ====================

// Projects
app.get('/api/projects', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM Projects ORDER BY created_at DESC');
    res.json(result.recordset);
  } catch (err) {
    console.error('Error fetching projects:', err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/projects', async (req, res) => {
  try {
    const { name, description, status, created_by } = req.body;
    const result = await pool.query(`
      INSERT INTO Projects (name, description, status, created_by)
      OUTPUT INSERTED.*
      VALUES (@name, @description, @status, @created_by)
    `, {
      name: sql.NVarChar, value: name,
      description: sql.NVarChar, value: description || null,
      status: sql.NVarChar, value: status || 'active',
      created_by: sql.NVarChar, value: created_by || 'system'
    });
    res.json(result.recordset[0]);
  } catch (err) {
    console.error('Error creating project:', err);
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/projects/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, status } = req.body;
    await pool.query(`
      UPDATE Projects 
      SET name = @name, description = @description, status = @status, updated_at = GETDATE()
      WHERE id = @id
    `, {
      id: sql.NVarChar, value: id,
      name: sql.NVarChar, value: name,
      description: sql.NVarChar, value: description,
      status: sql.NVarChar, value: status
    });
    res.json({ success: true });
  } catch (err) {
    console.error('Error updating project:', err);
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/projects/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM Projects WHERE id = @id', {
      id: sql.NVarChar, value: id
    });
    res.json({ success: true });
  } catch (err) {
    console.error('Error deleting project:', err);
    res.status(500).json({ error: err.message });
  }
});

// Zones
app.get('/api/projects/:projectId/zones', async (req, res) => {
  try {
    const { projectId } = req.params;
    const result = await pool.query('SELECT * FROM Zones WHERE project_id = @projectId ORDER BY created_at', {
      projectId: sql.NVarChar, value: projectId
    });
    res.json(result.recordset);
  } catch (err) {
    console.error('Error fetching zones:', err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/zones', async (req, res) => {
  try {
    const { project_id, name, description, location } = req.body;
    const result = await pool.query(`
      INSERT INTO Zones (project_id, name, description, location)
      OUTPUT INSERTED.*
      VALUES (@project_id, @name, @description, @location)
    `, {
      project_id: sql.NVarChar, value: project_id,
      name: sql.NVarChar, value: name,
      description: sql.NVarChar, value: description || null,
      location: sql.NVarChar, value: location || null
    });
    res.json(result.recordset[0]);
  } catch (err) {
    console.error('Error creating zone:', err);
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/zones/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM Zones WHERE id = @id', {
      id: sql.NVarChar, value: id
    });
    res.json({ success: true });
  } catch (err) {
    console.error('Error deleting zone:', err);
    res.status(500).json({ error: err.message });
  }
});

// Equipment
app.get('/api/zones/:zoneId/equipment', async (req, res) => {
  try {
    const { zoneId } = req.params;
    const result = await pool.query('SELECT * FROM Equipment WHERE zone_id = @zoneId ORDER BY created_at', {
      zoneId: sql.NVarChar, value: zoneId
    });
    res.json(result.recordset);
  } catch (err) {
    console.error('Error fetching equipment:', err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/equipment', async (req, res) => {
  try {
    const { zone_id, name, reference, type, manufacturer, model, serial_number, installation_date, status, diagram_url } = req.body;
    const result = await pool.query(`
      INSERT INTO Equipment (zone_id, name, reference, type, manufacturer, model, serial_number, installation_date, status, diagram_url)
      OUTPUT INSERTED.*
      VALUES (@zone_id, @name, @reference, @type, @manufacturer, @model, @serial_number, @installation_date, @status, @diagram_url)
    `, {
      zone_id: sql.NVarChar, value: zone_id,
      name: sql.NVarChar, value: name,
      reference: sql.NVarChar, value: reference || null,
      type: sql.NVarChar, value: type || null,
      manufacturer: sql.NVarChar, value: manufacturer || null,
      model: sql.NVarChar, value: model || null,
      serial_number: sql.NVarChar, value: serial_number || null,
      installation_date: sql.Date, value: installation_date || null,
      status: sql.NVarChar, value: status || 'operational',
      diagram_url: sql.NVarChar, value: diagram_url || null
    });
    res.json(result.recordset[0]);
  } catch (err) {
    console.error('Error creating equipment:', err);
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/equipment/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, reference, type, manufacturer, model, serial_number, installation_date, status, diagram_url } = req.body;
    await pool.query(`
      UPDATE Equipment 
      SET name = @name, reference = @reference, type = @type, manufacturer = @manufacturer, 
          model = @model, serial_number = @serial_number, installation_date = @installation_date, 
          status = @status, diagram_url = @diagram_url, updated_at = GETDATE()
      WHERE id = @id
    `, {
      id: sql.NVarChar, value: id,
      name: sql.NVarChar, value: name,
      reference: sql.NVarChar, value: reference,
      type: sql.NVarChar, value: type,
      manufacturer: sql.NVarChar, value: manufacturer,
      model: sql.NVarChar, value: model,
      serial_number: sql.NVarChar, value: serial_number,
      installation_date: sql.Date, value: installation_date,
      status: sql.NVarChar, value: status,
      diagram_url: sql.NVarChar, value: diagram_url
    });
    res.json({ success: true });
  } catch (err) {
    console.error('Error updating equipment:', err);
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/equipment/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM Equipment WHERE id = @id', {
      id: sql.NVarChar, value: id
    });
    res.json({ success: true });
  } catch (err) {
    console.error('Error deleting equipment:', err);
    res.status(500).json({ error: err.message });
  }
});

// Sensor Installations
app.get('/api/equipment/:equipmentId/sensors', async (req, res) => {
  try {
    const { equipmentId } = req.params;
    const result = await pool.query('SELECT * FROM SensorInstallations WHERE equipment_id = @equipmentId ORDER BY created_at', {
      equipmentId: sql.NVarChar, value: equipmentId
    });
    res.json(result.recordset);
  } catch (err) {
    console.error('Error fetching sensors:', err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/sensors', async (req, res) => {
  try {
    const { equipment_id, sensor_name, sensor_type, measurement_type, installation_point, position_x, position_y, 
            manufacturer, model, serial_number, installation_date, calibration_date, next_calibration_date, 
            installed_by, is_active, status, notes } = req.body;
    
    const result = await pool.query(`
      INSERT INTO SensorInstallations 
      (equipment_id, sensor_name, sensor_type, measurement_type, installation_point, position_x, position_y,
       manufacturer, model, serial_number, installation_date, calibration_date, next_calibration_date,
       installed_by, is_active, status, notes)
      OUTPUT INSERTED.*
      VALUES (@equipment_id, @sensor_name, @sensor_type, @measurement_type, @installation_point, @position_x, @position_y,
              @manufacturer, @model, @serial_number, @installation_date, @calibration_date, @next_calibration_date,
              @installed_by, @is_active, @status, @notes)
    `, {
      equipment_id: sql.NVarChar, value: equipment_id,
      sensor_name: sql.NVarChar, value: sensor_name,
      sensor_type: sql.NVarChar, value: sensor_type || null,
      measurement_type: sql.NVarChar, value: measurement_type || null,
      installation_point: sql.NVarChar, value: installation_point || null,
      position_x: sql.Float, value: position_x || 0,
      position_y: sql.Float, value: position_y || 0,
      manufacturer: sql.NVarChar, value: manufacturer || null,
      model: sql.NVarChar, value: model || null,
      serial_number: sql.NVarChar, value: serial_number || null,
      installation_date: sql.Date, value: installation_date || null,
      calibration_date: sql.Date, value: calibration_date || null,
      next_calibration_date: sql.Date, value: next_calibration_date || null,
      installed_by: sql.NVarChar, value: installed_by || null,
      is_active: sql.Bit, value: is_active !== false,
      status: sql.NVarChar, value: status || 'good',
      notes: sql.NVarChar, value: notes || null
    });
    res.json(result.recordset[0]);
  } catch (err) {
    console.error('Error creating sensor:', err);
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/sensors/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { sensor_name, sensor_type, measurement_type, installation_point, position_x, position_y, 
            manufacturer, model, serial_number, installation_date, calibration_date, next_calibration_date, 
            installed_by, is_active, status, notes } = req.body;
    
    await pool.query(`
      UPDATE SensorInstallations 
      SET sensor_name = @sensor_name, sensor_type = @sensor_type, measurement_type = @measurement_type,
          installation_point = @installation_point, position_x = @position_x, position_y = @position_y,
          manufacturer = @manufacturer, model = @model, serial_number = @serial_number,
          installation_date = @installation_date, calibration_date = @calibration_date,
          next_calibration_date = @next_calibration_date, installed_by = @installed_by,
          is_active = @is_active, status = @status, notes = @notes, updated_at = GETDATE()
      WHERE id = @id
    `, {
      id: sql.NVarChar, value: id,
      sensor_name: sql.NVarChar, value: sensor_name,
      sensor_type: sql.NVarChar, value: sensor_type,
      measurement_type: sql.NVarChar, value: measurement_type,
      installation_point: sql.NVarChar, value: installation_point,
      position_x: sql.Float, value: position_x,
      position_y: sql.Float, value: position_y,
      manufacturer: sql.NVarChar, value: manufacturer,
      model: sql.NVarChar, value: model,
      serial_number: sql.NVarChar, value: serial_number,
      installation_date: sql.Date, value: installation_date,
      calibration_date: sql.Date, value: calibration_date,
      next_calibration_date: sql.Date, value: next_calibration_date,
      installed_by: sql.NVarChar, value: installed_by,
      is_active: sql.Bit, value: is_active,
      status: sql.NVarChar, value: status,
      notes: sql.NVarChar, value: notes
    });
    res.json({ success: true });
  } catch (err) {
    console.error('Error updating sensor:', err);
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/sensors/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM SensorInstallations WHERE id = @id', {
      id: sql.NVarChar, value: id
    });
    res.json({ success: true });
  } catch (err) {
    console.error('Error deleting sensor:', err);
    res.status(500).json({ error: err.message });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    database: 'FactoryEYE',
    timestamp: new Date().toISOString()
  });
});

// Start server
async function startServer() {
  const connected = await connectToDatabase();
  if (connected) {
    await initializeTables();
    console.log('✅ Database connected and tables initialized');
  } else {
    console.log('⚠️ Running in demo mode (database not connected)');
  }
  
  app.listen(PORT, () => {
    console.log(`🚀 FactoryEYE API Server running on http://localhost:${PORT}`);
    if (connected) {
      console.log(`📊 Database: FactoryEYE on D-CZC929DNPY\\MSSQLSERVER01`);
    } else {
      console.log('📊 Database: Demo mode (mock data will be used)');
    }
  });
}

startServer();
