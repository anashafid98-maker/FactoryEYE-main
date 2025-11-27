package com.monprojet.factory.repository;

import com.monprojet.factory.entity.Zone;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ZoneRepository extends JpaRepository<Zone, Long> {

    @EntityGraph(attributePaths = {"equipment"})
    @Override
    List<Zone> findAll();
}