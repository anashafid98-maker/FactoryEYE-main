package com.monprojet.factory.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import java.util.Map;

@RestController
public class AlertController {
    @GetMapping("/api/alerts/summary")
    public Map<String, Integer> getAlertSummary() {
        // Remplace par ta logique réelle si besoin
        return Map.of(
            "critical", 0,
            "major", 0,
            "minor", 0
        );
    }
}