package com.monprojet.factory.dto;

import lombok.Data;

@Data
public class KpiDto {
    private Long id;
    private String title;
    private String value;
    private String iconName;
    private String colorClass;
}