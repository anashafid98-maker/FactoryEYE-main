/* package com.monprojet.factory.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "UsersNew")
public class AuthUser {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "UserID")
    private Long id;

    @Column(name = "Username", nullable = false, unique = true)
    private String username;

    @Column(name = "PasswordHash", nullable = false)
    private String passwordHash;

    @Column(name = "Email", nullable = false, unique = true)
    private String email;

    @Column(name = "FirstName", nullable = false)
    private String firstName;

    @Column(name = "LastName", nullable = false)
    private String lastName;

    @Column(name = "RoleID", nullable = false)
    private Integer roleId;

    @Column(name = "CreatedAt", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "LastLogin")
    private LocalDateTime lastLogin;

    public AuthUser() {}

    public AuthUser(String username, String passwordHash, String email, String firstName, String lastName, Integer roleId, LocalDateTime createdAt, LocalDateTime lastLogin) {
        this.username = username;
        this.passwordHash = passwordHash;
        this.email = email;
        this.firstName = firstName;
        this.lastName = lastName;
        this.roleId = roleId;
        this.createdAt = createdAt;
        this.lastLogin = lastLogin;
    }

    // Getters et Setters...
}

 */
