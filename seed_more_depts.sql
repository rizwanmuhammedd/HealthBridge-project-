-- Seed MORE Departments for HospitalMS_PatientDB
USE [HospitalMS_PatientDB]
GO

INSERT INTO Departments (Name, Description, FloorNumber, IsActive, CreatedAt, TenantId)
SELECT 'Urology', 'Urinary tract and male reproductive system', 3, 1, GETUTCDATE(), 1
WHERE NOT EXISTS (SELECT 1 FROM Departments WHERE Name = 'Urology');

INSERT INTO Departments (Name, Description, FloorNumber, IsActive, CreatedAt, TenantId)
SELECT 'ENT (Otolaryngology)', 'Ear, nose, and throat specialists', 1, 1, GETUTCDATE(), 1
WHERE NOT EXISTS (SELECT 1 FROM Departments WHERE Name = 'ENT (Otolaryngology)');

INSERT INTO Departments (Name, Description, FloorNumber, IsActive, CreatedAt, TenantId)
SELECT 'Psychiatry', 'Mental health and behavioral disorders', 4, 1, GETUTCDATE(), 1
WHERE NOT EXISTS (SELECT 1 FROM Departments WHERE Name = 'Psychiatry');

INSERT INTO Departments (Name, Description, FloorNumber, IsActive, CreatedAt, TenantId)
SELECT 'Physical Therapy', 'Rehabilitation and physical medicine', 0, 1, GETUTCDATE(), 1
WHERE NOT EXISTS (SELECT 1 FROM Departments WHERE Name = 'Physical Therapy');

INSERT INTO Departments (Name, Description, FloorNumber, IsActive, CreatedAt, TenantId)
SELECT 'Radiology', 'Medical imaging and diagnostics', 0, 1, GETUTCDATE(), 1
WHERE NOT EXISTS (SELECT 1 FROM Departments WHERE Name = 'Radiology');

GO
