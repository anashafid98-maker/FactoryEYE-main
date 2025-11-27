package com.monprojet.factory.controller;

import com.monprojet.factory.entity.Equipment;
import com.monprojet.factory.service.EquipmentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api/equipments")
@CrossOrigin(origins = "*")
public class EquipmentController {

    @Autowired
    private EquipmentService equipmentService;

    @GetMapping
    public ResponseEntity<List<Equipment>> getAllEquipments() {
        try {
            List<Equipment> equipments = equipmentService.getAllEquipments();
            return ResponseEntity.ok(equipments);
        } catch (Exception e) {
            throw new ResponseStatusException(
                HttpStatus.INTERNAL_SERVER_ERROR,
                "Error fetching equipments: " + e.getMessage()
            );
        }
    }

    @GetMapping("/total")
    public ResponseEntity<Long> getTotalEquipments() {
        try {
            Long total = equipmentService.getTotalEquipmentCount();
            return ResponseEntity.ok(total);
        } catch (Exception e) {
            throw new ResponseStatusException(
                HttpStatus.INTERNAL_SERVER_ERROR,
                "Error counting equipments: " + e.getMessage()
            );
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<Equipment> getEquipmentById(@PathVariable Long id) {
        try {
            return equipmentService.getEquipmentById(id)
                    .map(ResponseEntity::ok)
                    .orElse(ResponseEntity.notFound().build());
        } catch (Exception e) {
            throw new ResponseStatusException(
                HttpStatus.INTERNAL_SERVER_ERROR,
                "Error fetching equipment: " + e.getMessage()
            );
        }
    }

    @GetMapping("/status/{status}")
    public ResponseEntity<List<Equipment>> getEquipmentByStatus(@PathVariable String status) {
        try {
            List<Equipment> equipments = equipmentService.getEquipmentByStatus(status);
            return ResponseEntity.ok(equipments);
        } catch (Exception e) {
            throw new ResponseStatusException(
                HttpStatus.INTERNAL_SERVER_ERROR,
                "Error fetching equipment by status: " + e.getMessage()
            );
        }
    }

    @PostMapping
    public ResponseEntity<Equipment> addEquipment(@RequestBody Equipment equipment) {
        try {
            Equipment saved = equipmentService.addEquipment(equipment);
            return ResponseEntity.ok(saved);
        } catch (Exception e) {
            throw new ResponseStatusException(
                HttpStatus.INTERNAL_SERVER_ERROR,
                "Error adding equipment: " + e.getMessage()
            );
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<Equipment> updateEquipment(@PathVariable Long id, @RequestBody Equipment updatedEquipment) {
        try {
            Equipment equipment = equipmentService.updateEquipment(id, updatedEquipment);
            return ResponseEntity.ok(equipment);
        } catch (RuntimeException e) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, e.getMessage());
        } catch (Exception e) {
            throw new ResponseStatusException(
                HttpStatus.INTERNAL_SERVER_ERROR,
                "Error updating equipment: " + e.getMessage()
            );
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteEquipment(@PathVariable Long id) {
        try {
            equipmentService.deleteEquipment(id);
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, e.getMessage());
        } catch (Exception e) {
            throw new ResponseStatusException(
                HttpStatus.INTERNAL_SERVER_ERROR,
                "Error deleting equipment: " + e.getMessage()
            );
        }
    }
}