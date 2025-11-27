package com.monprojet.factory;

import org.springframework.context.annotation.Bean;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;



@SpringBootApplication(scanBasePackages = "com.monprojet.factory")
public class FactoryApplication {
    public static void main(String[] args) {
        SpringApplication.run(FactoryApplication.class, args);
    }

}
