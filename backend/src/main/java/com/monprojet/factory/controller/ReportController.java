package com.monprojet.factory.controller;

import com.monprojet.factory.entity.Report;
import com.monprojet.factory.service.ReportService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/reports")
@CrossOrigin(origins = "*")
public class ReportController {

    @Autowired
    private ReportService reportService;

    // Récupérer tous les rapports
    @GetMapping
    public List<Report> getAllReports() {
        return reportService.getAllReports();
    }

    // Récupérer un rapport par ID
    @GetMapping("/{id}")
    public ResponseEntity<Report> getReportById(@PathVariable Long id) {
        Optional<Report> report = reportService.getReportById(id);
        return report.map(ResponseEntity::ok).orElseGet(() -> ResponseEntity.notFound().build());
    }

    // Récupérer les rapports d'un équipement
    @GetMapping("/equipement/{idEquipement}")
    public List<Report> getReportsByEquipement(@PathVariable Long idEquipement) {
        return reportService.getReportsByEquipement(idEquipement);
    }

    // Ajouter un rapport
    @PostMapping
    public Report addReport(@RequestBody Report report) {
        return reportService.addReport(report);
    }

    // Mettre à jour un rapport
    @PutMapping("/{id}")
    public ResponseEntity<Report> updateReport(@PathVariable Long id, @RequestBody Report updatedReport) {
        try {
            Report report = reportService.updateReport(id, updatedReport);
            return ResponseEntity.ok(report);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    // Supprimer un rapport
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteReport(@PathVariable Long id) {
        reportService.deleteReport(id);
        return ResponseEntity.noContent().build();
    }
}
