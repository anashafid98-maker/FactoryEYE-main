package com.monprojet.factory.controller;

import com.monprojet.factory.dto.*;
import com.monprojet.factory.entity.User;
import com.monprojet.factory.service.ConnectedUserService;
import com.monprojet.factory.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class UserController {

    private final UserService userService;
    private final ConnectedUserService connectedUserService;

    @Autowired
    public UserController(UserService userService, ConnectedUserService connectedUserService) {
        this.userService = userService;
        this.connectedUserService = connectedUserService;
    }

    /**
     * Endpoint de connexion
     */
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        try {
            User user = userService.login(request.getUsername(), request.getPassword());

            // Ajouter l'utilisateur à la liste des connectés
            connectedUserService.addUser(user.getUsername());

            return ResponseEntity.ok(new LoginResponse(
                    user.getId(),
                    user.getUsername(),
                    user.getRole().name()
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(e.getMessage());
        }
    }

    /**
     * Endpoint de déconnexion (optionnel)
     */
    @PostMapping("/logout")
    public ResponseEntity<String> logout(@RequestParam String username) {
        connectedUserService.removeUser(username);
        return ResponseEntity.ok("Déconnexion réussie");
    }

    /**
     * Obtenir la liste des utilisateurs connectés (via service)
     */
    @GetMapping("/connected")
    public ResponseEntity<List<ConnectedUserDTO>> getConnectedUsers() {
        return ResponseEntity.ok(connectedUserService.getConnectedUsers());
    }

    /**
     * Lister tous les utilisateurs (admin)
     */
    @GetMapping("/users")
    public ResponseEntity<List<User>> getAllUsers() {
        List<User> users = userService.getAllUsers();
        return ResponseEntity.ok(users);
    }

    /**
     * Créer un utilisateur
     */
    @PostMapping("/users")
    public ResponseEntity<User> createUser(@RequestBody CreateUserRequest request) {
        User created = userService.createUser(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    /**
     * Enregistrement (register)
     */
    @PostMapping("/register")
    public ResponseEntity<String> register(@RequestBody CreateUserRequest request) {
        userService.createUser(request);
        return ResponseEntity.ok("Utilisateur créé avec succès");
    }

    /**
     * Exemple d'endpoint retournant tous les utilisateurs avec des infos de connexion fictives
     */
    @GetMapping("/connected-users")
    public ResponseEntity<List<Map<String, Object>>> getAllConnectedUsers() {
        List<User> users = userService.getAllUsers();

        List<Map<String, Object>> connected = users.stream().map(user -> {
            Map<String, Object> map = new HashMap<>();
            map.put("id", user.getId());
            map.put("username", user.getUsername());
            map.put("ipAddress", "N/A"); // À remplacer par une vraie IP si disponible
            map.put("deviceInfo", "N/A"); // À remplacer par infos navigateur/appareil
            map.put("loginTime", Instant.now().toString()); // À remplacer si tu stockes l'heure
            map.put("role", user.getRole().name());
            return map;
        }).collect(Collectors.toList());

        return ResponseEntity.ok(connected);
    }
}
