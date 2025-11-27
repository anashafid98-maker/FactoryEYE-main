package com.monprojet.factory.service;

import com.monprojet.factory.entity.Report;
import com.monprojet.factory.repository.ReportRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class ReportService {

    @Autowired
    private ReportRepository reportRepository;

    // Récupérer tous les rapports
    public List<Report> getAllReports() {
        return reportRepository.findAll();
    }

    // Récupérer un rapport par ID
    public Optional<Report> getReportById(Long id) {
        return reportRepository.findById(id);
    }

    // Récupérer les rapports liés à un équipement
    public List<Report> getReportsByEquipement(Long idEquipement) {
        return reportRepository.findByIdEquipement(idEquipement);
    }

    // Ajouter un rapport
    public Report addReport(Report report) {
        return reportRepository.save(report);
    }

    // Mettre à jour un rapport
    public Report updateReport(Long id, Report updatedReport) {
        return reportRepository.findById(id).map(report -> {
            report.setIdEquipement(updatedReport.getIdEquipement());
            report.setReportType(updatedReport.getReportType());
            report.setFilePath(updatedReport.getFilePath());
            report.setCreatedAt(updatedReport.getCreatedAt());
            report.setUploadedToSharepoint(updatedReport.getUploadedToSharepoint());
            return reportRepository.save(report);
        }).orElseThrow(() -> new RuntimeException("Rapport non trouvé"));
    }

    // Supprimer un rapport
    public void deleteReport(Long id) {
        reportRepository.deleteById(id);
    }
}
