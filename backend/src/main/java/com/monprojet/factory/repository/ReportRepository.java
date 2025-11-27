package com.monprojet.factory.repository;

import com.monprojet.factory.entity.Report;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ReportRepository extends JpaRepository<Report, Long> {
    List<Report> findByIdEquipement(Long idEquipement);
}
