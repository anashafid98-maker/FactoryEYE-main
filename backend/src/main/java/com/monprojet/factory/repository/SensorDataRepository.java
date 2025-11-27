package com.monprojet.factory.repository;

import com.monprojet.factory.entity.SensorData;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SensorDataRepository extends JpaRepository<SensorData, Long> {

    // Custom Queries for KPI calculations
    List<SensorData> findByEquipmentId(Long equipmentId);

    List<SensorData> findByEquipmentIdAndFailureOccurred(Long equipmentId, boolean failureOccurred);}
