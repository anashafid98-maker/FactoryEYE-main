package com.monprojet.factory.service;

import com.monprojet.factory.entity.SensorData;
import com.monprojet.factory.repository.SensorDataRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class SensorDataService {

    @Autowired
    private SensorDataRepository sensorDataRepository;

    // Calculate KPIs for SensorData
    public List<SensorData> calculateKPIs() {
        List<SensorData> sensorDataList = sensorDataRepository.findAll();

        for (SensorData data : sensorDataList) {
            // Downtime Calculation (Fallback if SQL Calculation Fails)
            if (data.getDowntime() == null) {
                data.setDowntime(data.calculateDowntime()); // Appel de la méthode calculateDowntime()
            }

            // MTBF Calculation
            double totalUptime = data.getDowntime() + data.getRepairTime();
            double mtbf = totalUptime / sensorDataList.size();
            data.setRepairTime((float) mtbf); // Conversion en Float

            // MTTR Calculation
            if (data.getRepairTime() != null && data.getRepairTime() > 0) {
                data.setRepairTime(data.getDowntime() / data.getRepairTime());
            }
        }

        return sensorDataRepository.saveAll(sensorDataList);
    }

    // Retrieve SensorData by Equipment ID
    public List<SensorData> getSensorDataByEquipment(Long equipmentId) {
        return sensorDataRepository.findByEquipmentId(equipmentId);
    }

    // Retrieve all SensorData records
    public List<SensorData> getAllSensorData() {
        return sensorDataRepository.findAll();
    }

    // Save SensorData Record
    public SensorData saveSensorData(SensorData sensorData) {
        return sensorDataRepository.save(sensorData);
    }
}