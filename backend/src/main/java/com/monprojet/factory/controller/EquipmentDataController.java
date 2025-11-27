package com.monprojet.factory.controller;

import com.monprojet.factory.entity.EquipmentData;
import com.monprojet.factory.repository.EquipmentDataRepository;
import com.monprojet.factory.service.CsvImportService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.Optional;

@RestController
@RequestMapping("/api/equipment")
public class EquipmentDataController {

    private final CsvImportService csvImportService;
    private final EquipmentDataRepository repository;

    // Constructeur corrigé avec les deux dépendances
    public EquipmentDataController(CsvImportService csvImportService,
                                   EquipmentDataRepository repository) {
        this.csvImportService = csvImportService;
        this.repository = repository;
    }

    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<String> uploadCsv(@RequestParam("file") MultipartFile file) {
        try {
            if (file.isEmpty()) {
                return ResponseEntity.badRequest().body("Le fichier est vide");
            }

            if (!"text/csv".equals(file.getContentType())) {
                return ResponseEntity.badRequest().body("Seuls les fichiers CSV sont autorisés");
            }

            csvImportService.importCsv(file);
            return ResponseEntity.ok("Import réussi");
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body("Erreur lors de l'import: " + e.getMessage());
        }
    }

    @GetMapping
    public ResponseEntity<Page<EquipmentData>> getAllEquipmentData(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        Pageable pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(repository.findAll(pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<EquipmentData> getEquipmentById(@PathVariable Long id) {
        Optional<EquipmentData> data = repository.findById(id);
        return data.map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @GetMapping("/search")
    public ResponseEntity<Page<EquipmentData>> searchEquipmentData(
            @RequestParam(required = false) String equipmentId,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime start,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime end,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        Pageable pageable = PageRequest.of(page, size);

        if(equipmentId != null && start != null && end != null) {
            return ResponseEntity.ok(
                    repository.findByEquipmentAndTimestampBetween(
                            equipmentId, start, end, pageable
                    )
            );
        }

        if(start != null && end != null) {
            return ResponseEntity.ok(
                    repository.findByTimestampBetween(start, end, pageable)
            );
        }

        if(equipmentId != null) {
            return ResponseEntity.ok(
                    repository.findByEquipment(equipmentId, pageable)
            );
        }

        return ResponseEntity.badRequest().build();
    }
}