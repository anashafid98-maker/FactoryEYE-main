package com.monprojet.factory.service;

import com.monprojet.factory.entity.Sensor;
import com.monprojet.factory.entity.Equipment;
import com.monprojet.factory.repository.SensorRepository;
import com.monprojet.factory.repository.EquipmentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class SensorService {

    @Autowired
    private SensorRepository sensorRepository;

    @Autowired
    private EquipmentRepository equipmentRepository;

    public List<Sensor> getSensorsByEquipment(Long equipmentId) {
        return sensorRepository.findByEquipmentId(equipmentId);
    }

    // Ajouter cette méthode dans SensorService
public List<Sensor> getAllSensors() {
    return sensorRepository.findAll();
}

    public Sensor addSensor(Long equipmentId, Sensor sensor) {
        Optional<Equipment> equipment = equipmentRepository.findById(equipmentId);
        if (equipment.isPresent()) {
            sensor.setEquipment(equipment.get());
            return sensorRepository.save(sensor);
        } else {
            throw new RuntimeException("Equipment not found with id: " + equipmentId);
        }
    }

    public void deleteSensor(Long id) {
        sensorRepository.deleteById(id);
    }
}