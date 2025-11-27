package com.monprojet.factory.repository;

import com.monprojet.factory.entity.Sensor;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SensorRepository extends JpaRepository<Sensor, Long> {
    
    // Utiliser le nom de colonne correct
    @Query("SELECT s FROM Sensor s WHERE s.equipmentId = ?1")
    List<Sensor> findByEquipmentId(Long equipmentId);
    
    List<Sensor> findAll();
}