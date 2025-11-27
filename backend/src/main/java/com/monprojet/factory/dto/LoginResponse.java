package com.monprojet.factory.dto;

import lombok.Data;

@Data
public class LoginResponse {
    private Long id;
    private String username;
    private String role;

    public LoginResponse(Long id, String username, String role) {
        this.id = id;
        this.username = username;
        this.role = role;
    }
}