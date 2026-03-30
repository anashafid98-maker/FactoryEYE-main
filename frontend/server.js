const express = require('express');
const sql = require('mssql');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// SQL Server Configuration - Using your existing database credentials
const dbConfig = {
  server: 'L-1H8446291N\\MSSQLSERVER01',
  database: 'FactoryEYE',
  user: 'anashafid',
  password: 'Ana@Secure1234',
  port: 1433,
  options: {
    encrypt: true,
    trustServerCertificate: true,
    enableArithAbort: true
  }
};

// Connect to SQL Server
sql.connect(dbConfig)
  .then(pool => {
    if (pool.connected) {
      console.log('✅ Connected to FactoryEYE SQL Database');
      return pool;
    }
  })
  .catch(err => console.error('❌ Database connection failed:', err));

// ==================== API ROUTES ====================

// Projects - GET all
app.get('/api/projects', async (req, res) => {
  try {
    const result = await sql.query`SELECT * FROM dbo.Projects ORDER BY created_at DESC`;
    res.json(result.recordset);
  } catch (err) {
    console.error('Error fetching projects:', err);
    res.status(500).json({ error: err.message });
  }
});

// Projects - CREATE
app.post('/api/projects', async (req, res) => {
  try {
    const { name, description, status, created_by } = req.body;
    const result = await sql.query`
      INSERT INTO dbo.Projects (name, description, status, created_by, created_at, updated_at)
      VALUES (${name}, ${description}, ${status || 'active'}, ${created_by || 'admin'}, GETDATE(), GETDATE());
      SELECT SCOPE_IDENTITY() as id;
    `;
    res.json({ id: result.recordset[0].id, message: 'Project created' });
  } catch (err) {
    console.error('Error creating project:', err);
    res.status(500).json({ error: err.message });
  }
});

// Projects - UPDATE
app.put('/api/projects/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, status } = req.body;
    await sql.query`
      UPDATE dbo.Projects 
      SET name = ${name}, description = ${description}, status = ${status}, updated_at = GETDATE()
      WHERE id = ${id}
    `;
    res.json({ message: 'Project updated' });
  } catch (err) {
    console.error('Error updating project:', err);
    res.status(500).json({ error: err.message });
  }
});

// Projects - DELETE
app.delete('/api/projects/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await sql.query`DELETE FROM dbo.Zones WHERE project_id = ${id}`;
    await sql.query`DELETE FROM dbo.Projects WHERE id = ${id}`;
    res.json({ message: 'Project deleted' });
  } catch (err) {
    console.error('Error deleting project:', err);
    res.status(500).json({ error: err.message });
  }
});

// Zones - GET by project
app.get('/api/projects/:projectId/zones', async (req, res) => {
  try {
    const { projectId } = req.params;
    const result = await sql.query`
      SELECT * FROM dbo.Zones WHERE project_id = ${projectId} ORDER BY name
    `;
    res.json(result.recordset);
  } catch (err) {
    console.error('Error fetching zones:', err);
    res.status(500).json({ error: err.message });
  }
});

// Zones - CREATE
app.post('/api/zones', async (req, res) => {
  try {
    const { project_id, name, description, location } = req.body;
    const result = await sql.query`
      INSERT INTO dbo.Zones (project_id, name, description, location, created_at, updated_at)
      VALUES (${project_id}, ${name}, ${description}, ${location}, GETDATE(), GETDATE());
      SELECT SCOPE_IDENTITY() as id;
    `;
    res.json({ id: result.recordset[0].id, message: 'Zone created' });
  } catch (err) {
    console.error('Error creating zone:', err);
    res.status(500).json({ error: err.message });
  }
});

// Zones - DELETE
app.delete('/api/zones/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await sql.query`DELETE FROM dbo.Equipment WHERE zone_id = ${id}`;
    await sql.query`DELETE FROM dbo.Zones WHERE id = ${id}`;
    res.json({ message: 'Zone deleted' });
  } catch (err) {
    console.error('Error deleting zone:', err);
    res.status(500).json({ error: err.message });
  }
});

// Equipment - GET by zone
app.get('/api/zones/:zoneId/equipment', async (req, res) => {
  try {
    const { zoneId } = req.params;
    const result = await sql.query`
      SELECT * FROM dbo.Equipment WHERE zone_id = ${zoneId} ORDER BY name
    `;
    res.json(result.recordset);
  } catch (err) {
    console.error('Error fetching equipment:', err);
    res.status(500).json({ error: err.message });
  }
});

// Equipment - CREATE
app.post('/api/equipment', async (req, res) => {
  try {
    const { zone_id, name, reference, type, manufacturer, model, serial_number, installation_date, diagram_url } = req.body;
    const result = await sql.query`
      INSERT INTO dbo.Equipment (zone_id, name, reference, type, manufacturer, model, serial_number, installation_date, diagram_url, created_at, updated_at)
      VALUES (${zone_id}, ${name}, ${reference}, ${type}, ${manufacturer}, ${model}, ${serial_number}, ${installation_date}, ${diagram_url}, GETDATE(), GETDATE());
      SELECT SCOPE_IDENTITY() as id;
    `;
    res.json({ id: result.recordset[0].id, message: 'Equipment created' });
  } catch (err) {
    console.error('Error creating equipment:', err);
    res.status(500).json({ error: err.message });
  }
});

// Equipment - DELETE
app.delete('/api/equipment/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await sql.query`DELETE FROM dbo.SensorInstallations WHERE equipment_id = ${id}`;
    await sql.query`DELETE FROM dbo.Equipment WHERE id = ${id}`;
    res.json({ message: 'Equipment deleted' });
  } catch (err) {
    console.error('Error deleting equipment:', err);
    res.status(500).json({ error: err.message });
  }
});

// Sensors - GET by equipment
app.get('/api/equipment/:equipmentId/sensors', async (req, res) => {
  try {
    const { equipmentId } = req.params;
    const result = await sql.query`
      SELECT * FROM dbo.SensorInstallations WHERE equipment_id = ${equipmentId} ORDER BY sensor_name
    `;
    res.json(result.recordset);
  } catch (err) {
    console.error('Error fetching sensors:', err);
    res.status(500).json({ error: err.message });
  }
});

// Sensors - CREATE
app.post('/api/sensors', async (req, res) => {
  try {
    const { equipment_id, sensor_name, sensor_type, measurement_type, installation_point, position_x, position_y, manufacturer, model, serial_number, installation_date, calibration_date, next_calibration_date, installed_by, is_active, status, notes } = req.body;
    const result = await sql.query`
      INSERT INTO dbo.SensorInstallations (equipment_id, sensor_name, sensor_type, measurement_type, installation_point, position_x, position_y, manufacturer, model, serial_number, installation_date, calibration_date, next_calibration_date, installed_by, is_active, status, notes, created_at, updated_at)
      VALUES (${equipment_id}, ${sensor_name}, ${sensor_type}, ${measurement_type}, ${installation_point}, ${position_x}, ${position_y}, ${manufacturer}, ${model}, ${serial_number}, ${installation_date}, ${calibration_date}, ${next_calibration_date}, ${installed_by}, ${is_active ? 1 : 0}, ${status}, ${notes}, GETDATE(), GETDATE());
      SELECT SCOPE_IDENTITY() as id;
    `;
    res.json({ id: result.recordset[0].id, message: 'Sensor created' });
  } catch (err) {
    console.error('Error creating sensor:', err);
    res.status(500).json({ error: err.message });
  }
});

// Sensors - UPDATE
app.put('/api/sensors/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { sensor_name, sensor_type, measurement_type, installation_point, position_x, position_y, manufacturer, model, serial_number, is_active, status, notes } = req.body;
    await sql.query`
      UPDATE dbo.SensorInstallations 
      SET sensor_name = ${sensor_name}, sensor_type = ${sensor_type}, measurement_type = ${measurement_type}, 
          installation_point = ${installation_point}, position_x = ${position_x}, position_y = ${position_y},
          manufacturer = ${manufacturer}, model = ${model}, serial_number = ${serial_number},
          is_active = ${is_active ? 1 : 0}, status = ${status}, notes = ${notes}, updated_at = GETDATE()
      WHERE id = ${id}
    `;
    res.json({ message: 'Sensor updated' });
  } catch (err) {
    console.error('Error updating sensor:', err);
    res.status(500).json({ error: err.message });
  }
});

// Sensors - DELETE
app.delete('/api/sensors/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await sql.query`DELETE FROM dbo.SensorInstallations WHERE id = ${id}`;
    res.json({ message: 'Sensor deleted' });
  } catch (err) {
    console.error('Error deleting sensor:', err);
    res.status(500).json({ error: err.message });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', database: 'FactoryEYE' });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 FactoryEYE API Server running on http://localhost:${PORT}`);
  console.log(`🔌 Connecting to SQL Server: L-1H8446291N\\MSSQLSERVER01`);
  console.log(`📁 Database: FactoryEYE`);
});

