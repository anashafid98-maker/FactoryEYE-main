package com.monprojet.factory.entity;


import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;
import java.time.Duration;
import java.time.LocalDateTime;

import java.time.Duration;

@Entity
@Table(name = "Datatable")
public class SensorData {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "equipment_id", nullable = false)
    private Long equipmentId;

    @Column(name = "maintenance_type", nullable = false)
    private String maintenanceType;

    @Column(name = "start_time", nullable = false)
    private LocalDateTime startTime;

    @Column(name = "end_time", nullable = false)
    private LocalDateTime endTime;

    @Column(name = "downtime")
    private Float downtime;

    @Column(name = "repair_time")
    private Float repairTime;

    @Column(name = "failure_occurred", nullable = false)
    private Boolean failureOccurred;

    @Column(name = "technician_name")
    private String technicianName;

    @Column(name = "comments")
    private String comments;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // Getters et setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Float getDowntime() {
        return downtime;
    }

    public void setDowntime(Float downtime) {
        this.downtime = downtime;
    }

    public Float getRepairTime() {
        return repairTime;
    }

    public Boolean getFailureOccurred() { // Méthode correcte
        return failureOccurred;
    }

    public void setFailureOccurred(Boolean failureOccurred) {
        this.failureOccurred = failureOccurred;
    }

    public void setRepairTime(Float repairTime) {
        this.repairTime = repairTime;
    }

    // Méthode pour calculer le temps d'arrêt
    public Float calculateDowntime() {
        if (startTime != null && endTime != null) {
            return (float) Duration.between(startTime, endTime).toHours();
        }
        return 0.0f; // Retourne 0 si startTime ou endTime est null
    }
}