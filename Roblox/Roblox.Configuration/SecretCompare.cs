using System.Security.Cryptography;
using System.Text;

namespace Roblox;

/// <summary>
/// Constant-time comparison for shared secrets (bot, RCC, game-server keys).
/// Never treats a missing or empty secret as a match, so an unset config value
/// cannot be "matched" by a request that omits the header.
/// </summary>
public static class SecretCompare
{
    public const int MinimumSecretLength = 32;

    public static bool Matches(string? provided, string? expected)
    {
        if (string.IsNullOrEmpty(provided) || string.IsNullOrEmpty(expected))
            return false;
        var a = Encoding.UTF8.GetBytes(provided);
        var b = Encoding.UTF8.GetBytes(expected);
        return a.Length == b.Length && CryptographicOperations.FixedTimeEquals(a, b);
    }

    /// <summary>Throws at startup if a required secret is missing, a known placeholder, or too short.</summary>
    public static string Require(string name, string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
            throw new InvalidOperationException($"Config value '{name}' is required. Set it in appsettings.json.");
        if (value.Length < MinimumSecretLength)
            throw new InvalidOperationException($"Config value '{name}' must be at least {MinimumSecretLength} characters. Generate one with: openssl rand -hex 32");
        return value;
    }
}
