package com.monprojet.factory.controller;

import com.monprojet.factory.entity.Sensor;
import com.monprojet.factory.service.SensorService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api/sensors")
@CrossOrigin(origins = "*")
public class SensorController {

    @Autowired
    private SensorService sensorService;

    @GetMapping("/equipment/{equipmentId}")
    public ResponseEntity<List<Sensor>> getSensorsByEquipment(@PathVariable String equipmentId) {
        try {
            Long eqId = Long.parseLong(equipmentId);
            List<Sensor> sensors = sensorService.getSensorsByEquipment(eqId);
            return ResponseEntity.ok(sensors);
        } catch (NumberFormatException e) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST, 
                "Invalid equipment ID: " + equipmentId
            );
        } catch (Exception e) {
            throw new ResponseStatusException(
                HttpStatus.INTERNAL_SERVER_ERROR,
                "Error fetching sensors: " + e.getMessage()
            );
        }
    }

    @PostMapping("/equipment/{equipmentId}")
    public ResponseEntity<Sensor> addSensor(@PathVariable String equipmentId, @RequestBody Sensor sensor) {
        try {
            Long eqId = Long.parseLong(equipmentId);
            Sensor savedSensor = sensorService.addSensor(eqId, sensor);
            return ResponseEntity.ok(savedSensor);
        } catch (NumberFormatException e) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST, 
                "Invalid equipment ID: " + equipmentId
            );
        } catch (RuntimeException e) {
            throw new ResponseStatusException(
                HttpStatus.NOT_FOUND,
                e.getMessage()
            );
        } catch (Exception e) {
            throw new ResponseStatusException(
                HttpStatus.INTERNAL_SERVER_ERROR,
                "Error adding sensor: " + e.getMessage()
            );
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteSensor(@PathVariable Long id) {
        try {
            sensorService.deleteSensor(id);
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            throw new ResponseStatusException(
                HttpStatus.INTERNAL_SERVER_ERROR,
                "Error deleting sensor: " + e.getMessage()
            );
        }
    }

    // Ajouter un endpoint pour tous les capteurs
    @GetMapping
    public ResponseEntity<List<Sensor>> getAllSensors() {
        try {
            List<Sensor> sensors = sensorService.getAllSensors();
            return ResponseEntity.ok(sensors);
        } catch (Exception e) {
            throw new ResponseStatusException(
                HttpStatus.INTERNAL_SERVER_ERROR,
                "Error fetching all sensors: " + e.getMessage()
            );
        }
    }
}