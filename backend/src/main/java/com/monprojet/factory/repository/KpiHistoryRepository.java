package com.monprojet.factory.repository;

import com.monprojet.factory.entity.KpiHistory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface KpiHistoryRepository extends JpaRepository<KpiHistory, Long> {
    List<KpiHistory> findByKpiIdOrderByRecordedAtDesc(Long kpiId);
}
