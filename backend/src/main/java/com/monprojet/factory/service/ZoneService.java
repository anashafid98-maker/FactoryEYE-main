package com.monprojet.factory.service;

import com.monprojet.factory.entity.Zone;
import com.monprojet.factory.repository.ZoneRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service
public class ZoneService {

    @Autowired
    private ZoneRepository zoneRepository;

    @Transactional
    public Zone saveZone(Zone zone) {
        return zoneRepository.save(zone);
    }

    @Transactional
    public void deleteZoneById(Long id) {
        zoneRepository.deleteById(id);
    }

    public List<Zone> getAllZones() {
        return zoneRepository.findAll();
    }
}