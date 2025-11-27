package com.monprojet.factory.dto;

import lombok.Data;
import com.monprojet.factory.entity.Role;

@Data
public class CreateUserRequest {
    private String username;
    private String password;
    private String email;
    private String firstname;
    private String lastname;
    private Role role;    // Imaginons que tu aies déjà une enum Role
}
