package com.monprojet.factory.repository;

import com.monprojet.factory.entity.EquipmentData;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.time.LocalDateTime;

@Repository
public interface EquipmentDataRepository extends JpaRepository<EquipmentData, Long> {
    Page<EquipmentData> findByEquipment(String equipment, Pageable pageable);
    Page<EquipmentData> findByTimestampBetween(LocalDateTime start, LocalDateTime end, Pageable pageable);
    Page<EquipmentData> findByEquipmentAndTimestampBetween(String equipment, LocalDateTime start, LocalDateTime end, Pageable pageable);
}