package com.monprojet.factory.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "COMPRESSEURDATA")
public class CompresseurData {

        @Id
        @GeneratedValue(strategy = GenerationType.IDENTITY)
        private Long id;

        private LocalDateTime timestamp;
        private Double pressure;
        private Double currentValue;

        @Column(name = "vibration_x")
        private Double vibrationX;

        @Column(name = "vibration_y")
        private Double vibrationY;

        @Column(name = "vibration_z")
        private Double vibrationZ;


    // Getters et Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public LocalDateTime getTimestamp() { return timestamp; }
    public void setTimestamp(LocalDateTime timestamp) { this.timestamp = timestamp; }

    public Double getPressure() { return pressure; }
    public void setPressure(Double pressure) { this.pressure = pressure; }

    public Double getCurrentValue() { return currentValue; }
    public void setCurrentValue(Double currentValue) { this.currentValue = currentValue; }

    public Double getVibrationX() { return vibrationX; }
    public void setVibrationX(Double vibrationX) { this.vibrationX = vibrationX; }

    public Double getVibrationY() { return vibrationY; }
    public void setVibrationY(Double vibrationY) { this.vibrationY = vibrationY; }

    public Double getVibrationZ() { return vibrationZ; }
    public void setVibrationZ(Double vibrationZ) { this.vibrationZ = vibrationZ; }
}


