package com.monprojet.factory.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "alerts")
public class Alert {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    private AlertSeverity severity;

    private String message;
    private boolean resolved;

    @ManyToOne
    @JoinColumn(name = "equipment_id")
    private Equipment equipment;

    public enum AlertSeverity {
        CRITICAL, MAJOR, MINOR
    }

    // Getters et setters
}