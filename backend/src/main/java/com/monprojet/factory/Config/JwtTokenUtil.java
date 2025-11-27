/*package com.monprojet.factory.config;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import org.springframework.stereotype.Component;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Date;

@Component
public class JwtTokenUtil {

    private String secretKey = "super_secret_key"; // Clé secrète pour signer le token

    // Méthode pour générer un token
    public String generateToken(UserDetails userDetails) {
        return Jwts.builder()
                .setSubject(userDetails.getUsername()) // Sujet du token
                .setIssuedAt(new Date()) // Date d'émission du token
                .setExpiration(new Date(System.currentTimeMillis() + 1000 * 60 * 60)) // Expiration dans 1 heure
                .signWith(SignatureAlgorithm.HS256, secretKey) // Signature avec clé secrète et algorithme HS256
                .compact(); // Générer le token compact
    }

    // Méthode pour extraire le username à partir du token
    public String extractUsername(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(secretKey)
                .build()
                .parseClaimsJws(token)
                .getBody()
                .getSubject();
    }

    // Méthode pour vérifier si un token est valide
    public boolean isTokenValid(String token, UserDetails userDetails) {
        final String username = extractUsername(token);
        return (username.equals(userDetails.getUsername()) && !isTokenExpired(token));
    }

    // Méthode pour vérifier si un token est expiré
    private boolean isTokenExpired(String token) {
        return extractExpiration(token).before(new Date());
    }

    // Méthode pour extraire la date d'expiration du token
    private Date extractExpiration(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(secretKey)
                .build()
                .parseClaimsJws(token)
                .getBody()
                .getExpiration();
    }
}

 */
