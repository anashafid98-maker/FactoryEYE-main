package com.monprojet.factory.service;

import com.monprojet.factory.entity.EquipmentData;
import com.monprojet.factory.exception.CsvProcessingException;
import com.monprojet.factory.exception.InvalidCSVFormatException;
import com.monprojet.factory.repository.EquipmentDataRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Arrays;

@Service
public class CsvImportService {

    private static final DateTimeFormatter FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
    private static final String[] EXPECTED_HEADERS = {
            "timestamp", "temperature", "pressure",
            "vibration", "humidity", "equipment", "location", "faulty"
    };
    private static final int MIN_TIME_GAP_SECONDS = 20;

    private final EquipmentDataRepository repository;
    private LocalDateTime lastRecordTime;

    @Autowired
    public CsvImportService(EquipmentDataRepository repository) {
        this.repository = repository;
    }

    public void importCsv(MultipartFile file) {
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(file.getInputStream()))) {
            processCsv(reader);
        } catch (Exception e) {
            throw new CsvProcessingException("CSV processing failed: " + e.getMessage());
        }
    }

    private void processCsv(BufferedReader reader) {
        try {
            String headerLine = reader.readLine();
            if (headerLine == null) throw new InvalidCSVFormatException("Empty CSV file");
            validateHeaders(headerLine.split(","));

            String line;
            while ((line = reader.readLine()) != null) {
                processLine(line.split(","));
            }
        } catch (Exception e) {
            throw new CsvProcessingException("Error reading CSV: " + e.getMessage());
        }
    }

    private void validateHeaders(String[] headers) {
        if (!Arrays.equals(headers, EXPECTED_HEADERS)) {
            throw new InvalidCSVFormatException("Invalid headers. Expected: "
                    + Arrays.toString(EXPECTED_HEADERS));
        }
    }

    private void processLine(String[] fields) {
        try {
            EquipmentData data = mapToEquipment(fields);
            validateTimeGap(data.getTimestamp());
            repository.save(data);
            lastRecordTime = data.getTimestamp();
        } catch (Exception e) {
            System.err.println("Skipped invalid line: " + Arrays.toString(fields));
        }
    }

    private EquipmentData mapToEquipment(String[] fields) {
        return EquipmentData.builder()
                .timestamp(parseTimestamp(fields[0]))
                .temperature(parseDouble(fields[1]))
                .pressure(parseDouble(fields[2]))
                .vibration(parseDouble(fields[3]))
                .humidity(parseDouble(fields[4]))
                .equipment(fields[5])
                .location(fields[6])
                .faulty(parseBoolean(fields[7]))
                .build();
    }

    private void validateTimeGap(LocalDateTime timestamp) {
        if (lastRecordTime != null &&
                timestamp.isBefore(lastRecordTime.plusSeconds(MIN_TIME_GAP_SECONDS))) {
            throw new IllegalArgumentException("Time gap too small");
        }
    }

    private LocalDateTime parseTimestamp(String value) {
        try {
            return LocalDateTime.parse(value, FORMATTER);
        } catch (Exception e) {
            throw new IllegalArgumentException("Invalid timestamp format: " + value);
        }
    }

    private Double parseDouble(String value) {
        try {
            return Double.parseDouble(value);
        } catch (NumberFormatException e) {
            throw new IllegalArgumentException("Invalid number format: " + value);
        }
    }

    private Boolean parseBoolean(String value) {
        return value != null && (value.equalsIgnoreCase("true")
                || value.equals("1")
                || value.equalsIgnoreCase("yes"));
    }
}