package com.monprojet.factory.controller;

import com.monprojet.factory.dto.ZoneDTO;
import com.monprojet.factory.entity.Equipment;
import com.monprojet.factory.entity.Zone;
import com.monprojet.factory.service.ZoneService;
import com.monprojet.factory.repository.ZoneRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/zones")
@CrossOrigin(origins = "*")
public class ZoneController {

    @Autowired
    private ZoneRepository zoneRepository;
    @Autowired
    private ZoneService zoneService;

    @PostMapping
    public ResponseEntity<?> createZone(@RequestBody ZoneDTO zoneDTO) { // Retrait de @Valid
        try {
            Zone zone = new Zone();
            zone.setZoneName(zoneDTO.getZoneName());
            zone.setDescription(zoneDTO.getDescription());
            zone.setLocation(zoneDTO.getLocation());

            // Création des équipements avec valeurs par défaut
            zoneDTO.getEquipment().forEach(equipmentName -> {
                Equipment equipment = new Equipment();
                equipment.setName(equipmentName);
                equipment.setStatus("ACTIVE"); // Obligatoire en base
                equipment.setType("GENERIC");  // Obligatoire en base
                equipment.setZone(zone);
                zone.getEquipment().add(equipment);
            });

            Zone savedZone = zoneService.saveZone(zone);
            return ResponseEntity.ok(savedZone);
        } catch (DataIntegrityViolationException e) {
            return ResponseEntity.badRequest().body("Erreur SQL : " + e.getCause().getMessage());
        }
    }
    // Les autres méthodes (GET, DELETE) restent inchangées
    @GetMapping
    public List<Zone> getAllZones() {
        return zoneService.getAllZones();
    }

    @DeleteMapping("/{zoneId}/equipment/{equipmentName}")
    public ResponseEntity<Void> deleteEquipment(
            @PathVariable Long zoneId,
            @PathVariable String equipmentName) {

        Optional<Zone> zoneOpt = zoneRepository.findById(zoneId);
        if (zoneOpt.isEmpty()) return ResponseEntity.notFound().build();

        Zone zone = zoneOpt.get();
        zone.getEquipment().removeIf(eq -> eq.getName().equals(equipmentName));
        zoneRepository.save(zone);

        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteZone(@PathVariable Long id) {
        zoneService.deleteZoneById(id);
        return ResponseEntity.ok().body("Zone supprimée avec succès");
    }
}