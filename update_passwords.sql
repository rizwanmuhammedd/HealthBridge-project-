UPDATE Users 
SET PasswordHash = '$2a$11$2DY5K25ijXzLRz9lpBEkqO0afI3ZUQHSAMk.iiWg6FLJTCakkn.v2' 
WHERE Email IN ('admin@hms.com', 'doctor@hms.com');
GO
