-- FactoryEYE Database Tables Setup Script
-- Run this in your SQL Server Management Studio to create the required tables

USE FactoryEYE;
GO

-- Projects Table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Projects')
BEGIN
    CREATE TABLE dbo.Projects (
        id NVARCHAR(36) PRIMARY KEY DEFAULT NEWID(),
        name NVARCHAR(255) NOT NULL,
        description NVARCHAR(MAX),
        status NVARCHAR(50) DEFAULT 'active',
        created_by NVARCHAR(100),
        created_at DATETIME DEFAULT GETDATE(),
        updated_at DATETIME DEFAULT GETDATE()
    );
    PRINT 'Projects table created successfully';
END
ELSE
BEGIN
    PRINT 'Projects table already exists';
END
GO

-- Zones Table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Zones')
BEGIN
    CREATE TABLE dbo.Zones (
        id NVARCHAR(36) PRIMARY KEY DEFAULT NEWID(),
        project_id NVARCHAR(36) NOT NULL,
        name NVARCHAR(255) NOT NULL,
        description NVARCHAR(MAX),
        location NVARCHAR(255),
        created_at DATETIME DEFAULT GETDATE(),
        updated_at DATETIME DEFAULT GETDATE()
    );
    PRINT 'Zones table created successfully';
END
ELSE
BEGIN
    PRINT 'Zones table already exists';
END
GO

-- Add foreign key for Zones if it doesn't exist
IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_Zones_Projects')
BEGIN
    ALTER TABLE dbo.Zones ADD CONSTRAINT FK_Zones_Projects FOREIGN KEY (project_id) REFERENCES dbo.Projects(id) ON DELETE CASCADE;
END
GO

-- Equipment Table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Equipment')
BEGIN
    CREATE TABLE dbo.Equipment (
        id NVARCHAR(36) PRIMARY KEY DEFAULT NEWID(),
        zone_id NVARCHAR(36) NOT NULL,
        name NVARCHAR(255) NOT NULL,
        reference NVARCHAR(100),
        type NVARCHAR(100),
        manufacturer NVARCHAR(255),
        model NVARCHAR(255),
        serial_number NVARCHAR(100),
        installation_date DATE,
        status NVARCHAR(50) DEFAULT 'operational',
        diagram_url NVARCHAR(500),
        created_at DATETIME DEFAULT GETDATE(),
        updated_at DATETIME DEFAULT GETDATE()
    );
    PRINT 'Equipment table created successfully';
END
ELSE
BEGIN
    PRINT 'Equipment table already exists';
END
GO

-- Add foreign key for Equipment if it doesn't exist
IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_Equipment_Zones')
BEGIN
    ALTER TABLE dbo.Equipment ADD CONSTRAINT FK_Equipment_Zones FOREIGN KEY (zone_id) REFERENCES dbo.Zones(id) ON DELETE CASCADE;
END
GO

-- SensorInstallations Table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'SensorInstallations')
BEGIN
    CREATE TABLE dbo.SensorInstallations (
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
        serial_number NVARCHAR(100),
        installation_date DATE,
        calibration_date DATE,
        next_calibration_date DATE,
        installed_by NVARCHAR(255),
        is_active BIT DEFAULT 1,
        status NVARCHAR(50) DEFAULT 'good',
        notes NVARCHAR(MAX),
        created_at DATETIME DEFAULT GETDATE(),
        updated_at DATETIME DEFAULT GETDATE()
    );
    PRINT 'SensorInstallations table created successfully';
END
ELSE
BEGIN
    PRINT 'SensorInstallations table already exists';
END
GO

-- Add foreign key for SensorInstallations if it doesn't exist
IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_SensorInstallations_Equipment')
BEGIN
    ALTER TABLE dbo.SensorInstallations ADD CONSTRAINT FK_SensorInstallations_Equipment FOREIGN KEY (equipment_id) REFERENCES dbo.Equipment(id) ON DELETE CASCADE;
END
GO

-- Insert sample data (optional)
IF NOT EXISTS (SELECT * FROM dbo.Projects)
BEGIN
    INSERT INTO dbo.Projects (name, description, status, created_by) VALUES 
    ('Maintenance Préventive - Ligne A', 'Projet de maintenance preventive pour la ligne de production A', 'active', 'admin'),
    ('Mise à niveau Système Contrôle', 'Mise a niveau du systeme de controle', 'active', 'admin'),
    ('Remplacement Pompes P-101', 'Remplacement des pompes P-101', 'completed', 'admin');
    
    PRINT 'Sample projects inserted';
END
GO

PRINT '========================================';
PRINT 'FactoryEYE database setup completed!';
PRINT '========================================';

