-- Seed Departments for HospitalMS_PatientDB
USE [HospitalMS_PatientDB]
GO

-- Check if departments exist, if not insert
IF NOT EXISTS (SELECT 1 FROM Departments WHERE Name = 'Cardiology')
INSERT INTO Departments (Name, Description, FloorNumber, IsActive, CreatedAt, TenantId)
VALUES ('Cardiology', 'Heart and vascular system specialist', 2, 1, GETUTCDATE(), 1);

IF NOT EXISTS (SELECT 1 FROM Departments WHERE Name = 'Gynaecology')
INSERT INTO Departments (Name, Description, FloorNumber, IsActive, CreatedAt, TenantId)
VALUES ('Gynaecology', 'Female reproductive health and pregnancy', 3, 1, GETUTCDATE(), 1);

IF NOT EXISTS (SELECT 1 FROM Departments WHERE Name = 'Orthopaedics')
INSERT INTO Departments (Name, Description, FloorNumber, IsActive, CreatedAt, TenantId)
VALUES ('Orthopaedics', 'Bone and joint specialist', 1, 1, GETUTCDATE(), 1);

IF NOT EXISTS (SELECT 1 FROM Departments WHERE Name = 'Neurology')
INSERT INTO Departments (Name, Description, FloorNumber, IsActive, CreatedAt, TenantId)
VALUES ('Neurology', 'Brain and nervous system specialist', 4, 1, GETUTCDATE(), 1);

IF NOT EXISTS (SELECT 1 FROM Departments WHERE Name = 'Paediatrics')
INSERT INTO Departments (Name, Description, FloorNumber, IsActive, CreatedAt, TenantId)
VALUES ('Paediatrics', 'Child healthcare and development', 2, 1, GETUTCDATE(), 1);

IF NOT EXISTS (SELECT 1 FROM Departments WHERE Name = 'Ophthalmology')
INSERT INTO Departments (Name, Description, FloorNumber, IsActive, CreatedAt, TenantId)
VALUES ('Ophthalmology', 'Eye care and surgery', 1, 1, GETUTCDATE(), 1);

IF NOT EXISTS (SELECT 1 FROM Departments WHERE Name = 'Dermatology')
INSERT INTO Departments (Name, Description, FloorNumber, IsActive, CreatedAt, TenantId)
VALUES ('Dermatology', 'Skin and hair specialist', 1, 1, GETUTCDATE(), 1);

IF NOT EXISTS (SELECT 1 FROM Departments WHERE Name = 'Oncology')
INSERT INTO Departments (Name, Description, FloorNumber, IsActive, CreatedAt, TenantId)
VALUES ('Oncology', 'Cancer diagnosis and treatment', 5, 1, GETUTCDATE(), 1);

GO
