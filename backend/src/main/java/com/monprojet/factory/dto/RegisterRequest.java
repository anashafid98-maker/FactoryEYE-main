package com.monprojet.factory.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class RegisterRequest {
    private String firstname;
    private String lastname;
    private String email;
    private String username;  // Champ ajouté
    private String password;

    // Lombok @Data générera automatiquement :
    // getFirstname(), getLastname(), getEmail(), getUsername(), getPassword()
    // et les setters correspondants
}