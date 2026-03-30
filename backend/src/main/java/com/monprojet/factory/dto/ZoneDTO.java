package com.monprojet.factory.dto;

import java.util.List;

public class ZoneDTO {
    private String zoneName;
    private String description;
    private String location;
    private Long projectId;
    private List<String> equipment; // Liste simplifiée de noms d'équipements

    // Getters & Setters
    public String getZoneName() { return zoneName; }
    public void setZoneName(String zoneName) { this.zoneName = zoneName; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }
    public Long getProjectId() { return projectId; }
    public void setProjectId(Long projectId) { this.projectId = projectId; }
    public List<String> getEquipment() { return equipment; }
    public void setEquipment(List<String> equipment) { this.equipment = equipment; }
}
