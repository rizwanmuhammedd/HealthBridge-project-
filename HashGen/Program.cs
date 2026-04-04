using System;
using BCrypt.Net;

namespace HashGen;

class Program
{
    static void Main(string[] args)
    {
        string password = "Password123!";
        string hash = BCrypt.Net.BCrypt.HashPassword(password, 11);
        Console.WriteLine(hash);
    }
}
