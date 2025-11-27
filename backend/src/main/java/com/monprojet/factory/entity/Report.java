package com.monprojet.factory.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "Reports")
public class Report {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "report_id")
    private Long id;

    @Column(name = "id_equipement", nullable = false)
    private Long idEquipement;

    @Column(name = "report_type", nullable = false)
    private String reportType;

    @Column(name = "file_path", nullable = false)
    private String filePath;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "uploaded_to_sharepoint", nullable = false)
    private Boolean uploadedToSharepoint;

    // Constructeurs
    public Report() {}

    public Report(Long idEquipement, String reportType, String filePath, LocalDateTime createdAt, Boolean uploadedToSharepoint) {
        this.idEquipement = idEquipement;
        this.reportType = reportType;
        this.filePath = filePath;
        this.createdAt = createdAt;
        this.uploadedToSharepoint = uploadedToSharepoint;
    }

    // Getters et Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getIdEquipement() {
        return idEquipement;
    }

    public void setIdEquipement(Long idEquipement) {
        this.idEquipement = idEquipement;
    }

    public String getReportType() {
        return reportType;
    }

    public void setReportType(String reportType) {
        this.reportType = reportType;
    }

    public String getFilePath() {
        return filePath;
    }

    public void setFilePath(String filePath) {
        this.filePath = filePath;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public Boolean getUploadedToSharepoint() {
        return uploadedToSharepoint;
    }

    public void setUploadedToSharepoint(Boolean uploadedToSharepoint) {
        this.uploadedToSharepoint = uploadedToSharepoint;
    }
}
