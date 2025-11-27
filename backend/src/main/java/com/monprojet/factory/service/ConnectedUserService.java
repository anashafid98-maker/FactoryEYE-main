package com.monprojet.factory.service;

import com.monprojet.factory.dto.ConnectedUserDTO;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

@Service
public class ConnectedUserService {

    private final Map<String, Instant> connectedUsers = new ConcurrentHashMap<>();

    public void addUser(String username) {
        connectedUsers.put(username, Instant.now());
    }

    public void removeUser(String username) {
        connectedUsers.remove(username);
    }

    public List<ConnectedUserDTO> getConnectedUsers() {
        return connectedUsers.entrySet().stream()
                .map(entry -> new ConnectedUserDTO(entry.getKey(), entry.getValue()))
                .collect(Collectors.toList());
    }
}
