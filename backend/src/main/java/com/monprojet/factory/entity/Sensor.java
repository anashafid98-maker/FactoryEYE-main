package com.monprojet.factory.entity;

import jakarta.persistence.*;
import com.fasterxml.jackson.annotation.JsonIgnore;

@Entity
@Table(name = "Sensors") // Note: "Sensors" avec S majuscule
public class Sensor {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "Sensor_id") // Votre colonne ID
    private Long id;

    @Column(name = "Sensor_type", nullable = false) // Votre colonne type
    private String type;

    @Column(name = "Description") // Utiliser Description comme nom
    private String name;

    @Column(name = "id_equipement", nullable = false) // Votre colonne équipement
    private Long equipmentId;

    // Colonnes supplémentaires si nécessaire
    @Transient // Ne pas persister en base
    private String unit;
    
    @Transient // Ne pas persister en base
    private Double value;

    // Relation avec Equipment
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_equipement", insertable = false, updatable = false)
    @JsonIgnore
    private Equipment equipment;

    // Constructeurs
    public Sensor() {}

    public Sensor(String name, String type, Long equipmentId) {
        this.name = name;
        this.type = type;
        this.equipmentId = equipmentId;
    }

    // Getters et Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public Long getEquipmentId() { return equipmentId; }
    public void setEquipmentId(Long equipmentId) { this.equipmentId = equipmentId; }

    public String getUnit() { return unit; }
    public void setUnit(String unit) { this.unit = unit; }

    public Double getValue() { return value; }
    public void setValue(Double value) { this.value = value; }

    public Equipment getEquipment() { return equipment; }
    public void setEquipment(Equipment equipment) { this.equipment = equipment; }
}