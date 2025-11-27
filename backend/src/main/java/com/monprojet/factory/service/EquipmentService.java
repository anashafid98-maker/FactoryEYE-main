package com.monprojet.factory.service;

import com.monprojet.factory.entity.Equipment;
import com.monprojet.factory.repository.EquipmentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class EquipmentService {

    @Autowired
    private EquipmentRepository equipmentRepository;

    public List<Equipment> getAllEquipments() {
        try {
            return equipmentRepository.findAll();
        } catch (Exception e) {
            throw new RuntimeException("Error fetching equipments: " + e.getMessage(), e);
        }
    }

    public Long getTotalEquipmentCount() {
        try {
            return equipmentRepository.count();
        } catch (Exception e) {
            throw new RuntimeException("Error counting equipments: " + e.getMessage(), e);
        }
    }

    public Optional<Equipment> getEquipmentById(Long id) {
        return equipmentRepository.findById(id);
    }

    public List<Equipment> getEquipmentByStatus(String status) {
        return equipmentRepository.findByStatus(status);
    }

    public Equipment addEquipment(Equipment equipment) {
        try {
            return equipmentRepository.save(equipment);
        } catch (Exception e) {
            throw new RuntimeException("Error adding equipment: " + e.getMessage(), e);
        }
    }

    public Equipment updateEquipment(Long id, Equipment updatedEquipment) {
        Optional<Equipment> existing = equipmentRepository.findById(id);
        if (existing.isPresent()) {
            Equipment equipment = existing.get();
            equipment.setName(updatedEquipment.getName());
            equipment.setStatus(updatedEquipment.getStatus());
            equipment.setType(updatedEquipment.getType());
            return equipmentRepository.save(equipment);
        }
        throw new RuntimeException("Equipment not found with id: " + id);
    }

    public void deleteEquipment(Long id) {
        if (equipmentRepository.existsById(id)) {
            equipmentRepository.deleteById(id);
        } else {
            throw new RuntimeException("Equipment not found with id: " + id);
        }
    }
}