package com.monprojet.factory.entity;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "kpis")
@Data
public class Kpi {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "kpi_id")
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false)
    private String value;

    @Column(name = "icon_name", nullable = false)
    private String iconName;

    @Column(name = "color_class", nullable = false)
    private String colorClass;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @OneToMany(mappedBy = "kpi", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<KpiHistory> history = new ArrayList<>();
}