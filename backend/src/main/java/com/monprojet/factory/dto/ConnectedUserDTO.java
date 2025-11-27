package com.monprojet.factory.dto;

import java.time.Instant;

public class ConnectedUserDTO {
    private Long id;
    private String username;
    private String ipAddress;
    private String deviceInfo;
    private String loginTime;
    private String role;
    private Instant connectedAt;
    // Getters and setters


    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getIpAddress() {
        return ipAddress;
    }

    public void setIpAddress(String ipAddress) {
        this.ipAddress = ipAddress;
    }

    public String getDeviceInfo() {
        return deviceInfo;
    }

    public void setDeviceInfo(String deviceInfo) {
        this.deviceInfo = deviceInfo;
    }

    public String getLoginTime() {
        return loginTime;
    }

    public void setLoginTime(String loginTime) {
        this.loginTime = loginTime;
    }
    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }

    public Instant getConnectedAt() {
        return connectedAt;
    }

    public void setConnectedAt(Instant connectedAt) {
        this.connectedAt = connectedAt;
    }

    // Add this constructor to your ConnectedUserDTO class
    public ConnectedUserDTO(String username, Instant connectedAt) {
        this.username = username;
        this.connectedAt = connectedAt;
    }
}
