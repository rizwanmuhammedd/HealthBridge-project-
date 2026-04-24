using System;
using BCrypt.Net;

namespace HashGen;

class Program
{
    static void Main(string[] args)
    {
        // Testing the hash I gave you for Pharmacist
        string password = "Pharmacy@123";
        string hash = "$2a$11$6yb9uv8n6BVAKxkhLjd8A.Dxxwmi/TH6isj0/iHKPCDPEoXf1g982";
        
        bool isValid = BCrypt.Net.BCrypt.Verify(password, hash);
        Console.WriteLine($"Is Hash Valid: {isValid}");
        
        // Generate a fresh one just in case with default factor
        Console.WriteLine($"New Hash: {BCrypt.Net.BCrypt.HashPassword(password)}");
    }
}
