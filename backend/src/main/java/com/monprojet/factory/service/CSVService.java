 package com.monprojet.factory.service;

import com.monprojet.factory.entity.CompresseurData;
import com.monprojet.factory.repository.CompresseurDataRepository;
import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVParser;
import org.apache.commons.csv.CSVRecord;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.io.*;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@Service
public class CSVService {

    @Autowired
    private CompresseurDataRepository compresseurDataRepo;

    private static final DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    // Méthode modifiée pour prendre en charge un seul fichier compressé
    public void importCompressorData(File compressorFullDataFile) throws IOException {
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(new FileInputStream(compressorFullDataFile), StandardCharsets.UTF_8));
             CSVParser csvParser = new CSVParser(reader, CSVFormat.DEFAULT.withFirstRecordAsHeader())) {

            // Parcourir chaque ligne du fichier CSV
            for (CSVRecord record : csvParser) {
                try {
                    CompresseurData data = new CompresseurData();
                    // On suppose que le fichier contient un timestamp, de la pression, du courant, et des vibrations
                    String timestampString = record.get("timestamp");
                    if (timestampString == null || timestampString.isEmpty()) {
                        continue;  // Ignore les enregistrements sans timestamp
                    }
                    data.setTimestamp(LocalDateTime.parse(timestampString, formatter));

                    // Validation et récupération des autres valeurs
                    try {
                        data.setPressure(Double.parseDouble(record.get("pressure")));  // Basse fréquence
                        data.setCurrentValue(Double.parseDouble(record.get("current")));  // Haute fréquence
                        data.setVibrationX(Double.parseDouble(record.get("vibration_x")));  // Haute fréquence
                        data.setVibrationY(Double.parseDouble(record.get("vibration_y")));  // Haute fréquence
                        data.setVibrationZ(Double.parseDouble(record.get("vibration_z")));  // Haute fréquence
                    } catch (NumberFormatException e) {
                        System.err.println("Erreur de format dans les données CSV pour le timestamp : " + timestampString);
                        continue;  // Ignore les enregistrements avec des données mal formatées
                    }

                    // Sauvegarde des données dans la base
                    compresseurDataRepo.save(data);
                } catch (Exception e) {
                    System.err.println("Erreur lors du traitement de l'enregistrement CSV : " + e.getMessage());
                }
            }
        } catch (IOException e) {
            System.err.println("Erreur lors de la lecture du fichier CSV : " + e.getMessage());
            throw e;  // Propagation de l'exception après journalisation
        }
    }
}


