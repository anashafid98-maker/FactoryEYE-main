 package com.monprojet.factory.controller;

import com.monprojet.factory.entity.CompresseurData;
import com.monprojet.factory.service.CSVService;
import com.monprojet.factory.repository.CompresseurDataRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@CrossOrigin(origins = "*") // Permet les appels CORS depuis n'importe quel domaine
@RestController
@RequestMapping("/api/compresseur")
public class CSVController {

    @Autowired
    private CSVService csvService;  // Injection de la dépendance CSVService

    @Autowired
    private CompresseurDataRepository compresseurDataRepo;

    // Endpoint pour l'upload du fichier CSV
    @PostMapping("/upload")
    public String uploadCompressorData(@RequestParam("compressorFullData") MultipartFile compressorFullData) throws IOException {
        // Log pour vérifier si le fichier est bien reçu
        if (compressorFullData == null || compressorFullData.isEmpty()) {
            throw new IllegalArgumentException("Le fichier 'compressorFullData' est manquant ou vide.");
        }
        System.out.println("Fichier reçu : " + compressorFullData.getOriginalFilename());

        // Création du fichier temporaire
        File tempFile = File.createTempFile("compressorfulldata", ".csv");
        compressorFullData.transferTo(tempFile);

        // Appel de la méthode d'instance pour importer les données
        csvService.importCompressorData(tempFile);  // Utilisation de l'instance de CSVService

        return "Données du compresseur insérées dans FactoryEYE avec succès !";
    }

    // Endpoint pour récupérer les données du compresseur
    // In your CSVController.java
    @GetMapping("/data")
    public List<CompresseurData> getCompresseurData() {
        return compresseurDataRepo.findAll(); // Make sure this returns the data in the format you need
    }

    // Endpoint pour supprimer toutes les données du compresseur
    @DeleteMapping("/data")
    public String deleteAllCompressorData() {
        compresseurDataRepo.deleteAll();
        return "Toutes les données du compresseur ont été supprimées avec succès.";
    }

    // Ajoutez cette méthode dans votre CSVController.java

@GetMapping("/data-with-psd")
public List<Map<String, Object>> getCompresseurDataWithPSD() {
    List<CompresseurData> data = compresseurDataRepo.findAll();
    
    return data.stream().map(item -> {
        Map<String, Object> result = new HashMap<>();
        result.put("id", item.getId());
        result.put("timestamp", item.getTimestamp().toString());
        result.put("pressure", item.getPressure());
        result.put("currentValue", item.getCurrentValue());
        result.put("vibrationX", item.getVibrationX());
        result.put("vibrationY", item.getVibrationY());
        result.put("vibrationZ", item.getVibrationZ());
        
        // Générer les données PSD simulées (comme dans votre Python)
        result.put("vxRMS", generateRMS(item.getVibrationX()));
        result.put("vyRMS", generateRMS(item.getVibrationY()));
        result.put("running", true); // Simulé
        
        // Générer les spectres PSD
        result.put("spectrumVX", generatePSD(item.getVibrationX(), "VX"));
        result.put("spectrumVY", generatePSD(item.getVibrationY(), "VY"));
        
        return result;
    }).collect(Collectors.toList());
}

private Double generateRMS(Double vibration) {
    return vibration != null ? Math.sqrt(vibration * vibration) : 0.1;
}

private Map<String, Object> generatePSD(Double vibration, String axis) {
    Map<String, Object> spectrum = new HashMap<>();
    
    try {
        double vibrationMagnitude = Math.max(Math.abs(vibration != null ? vibration : 1.0), 0.1);
        
        // Simuler la génération de PSD comme dans Python
        int nPoints = 512;
        List<Double> freqs = new ArrayList<>();
        List<Double> psd = new ArrayList<>();
        
        double rpm = 1250;
        double fundamentalFreq = rpm / 60;
        double harmonic2 = fundamentalFreq * 2;
        double harmonic3 = fundamentalFreq * 3;
        
        for (int i = 0; i < nPoints; i++) {
            double freq = (i * 1000.0) / nPoints;
            freqs.add(freq);
            
            if (freq == 0) {
                psd.add(1e-12);
                continue;
            }
            
            double value = 1e-12;
            double vibFactor = vibrationMagnitude * (axis.equals("VX") ? 1.0 : 0.8);
            
            // Composantes spectrales simulées
            value += Math.exp(-Math.pow((freq - fundamentalFreq) / 2, 2)) * 0.1 * vibFactor;
            value += Math.exp(-Math.pow((freq - harmonic2) / 1.5, 2)) * 0.05 * vibFactor;
            value += Math.exp(-Math.pow((freq - harmonic3) / 1.5, 2)) * 0.03 * vibFactor;
            value += Math.exp(-Math.pow((freq - 100) / 3, 2)) * 0.02 * vibFactor;
            value += Math.exp(-Math.pow((freq - 150) / 3, 2)) * 0.01 * vibFactor;
            
            // Bruit de fond
            value += (0.001 * vibFactor) / (freq + 1);
            value += Math.random() * 0.002 * vibFactor;
            
            psd.add(Math.max(value, 1e-12));
        }
        
        spectrum.put("freqs", freqs);
        spectrum.put("psd", psd);
        
    } catch (Exception e) {
        // PSD par défaut en cas d'erreur
        List<Double> defaultFreqs = new ArrayList<>();
        List<Double> defaultPsd = new ArrayList<>();
        for (int i = 0; i < 512; i++) {
            defaultFreqs.add((i * 1000.0) / 512);
            defaultPsd.add(1e-6);
        }
        spectrum.put("freqs", defaultFreqs);
        spectrum.put("psd", defaultPsd);
    }
    
    return spectrum;
}

// Endpoint temporaire pour tester
@GetMapping("/data-simple")
public List<Map<String, Object>> getSimpleData() {
    try {
        List<CompresseurData> data = compresseurDataRepo.findAll();
        
        return data.stream().map(item -> {
            Map<String, Object> result = new HashMap<>();
            result.put("id", item.getId());
            result.put("timestamp", item.getTimestamp() != null ? item.getTimestamp().toString() : "");
            result.put("pressure", item.getPressure() != null ? item.getPressure() : 0.0);
            result.put("currentValue", item.getCurrentValue() != null ? item.getCurrentValue() : 0.0);
            result.put("vibrationX", item.getVibrationX() != null ? item.getVibrationX() : 0.0);
            result.put("vibrationY", item.getVibrationY() != null ? item.getVibrationY() : 0.0);
            result.put("vibrationZ", item.getVibrationZ() != null ? item.getVibrationZ() : 0.0);
            
            // Valeurs par défaut pour les tests
            result.put("vxRMS", 0.1);
            result.put("vyRMS", 0.1);
            result.put("running", true);
            
            return result;
        }).collect(Collectors.toList());
        
    } catch (Exception e) {
        e.printStackTrace();
        throw new RuntimeException("Erreur lors de la récupération des données: " + e.getMessage());
    }
}

    // Endpoint de test
    @GetMapping("/test")
    public String test() {
        return "Le contrôleur fonctionne !";
    }
}
