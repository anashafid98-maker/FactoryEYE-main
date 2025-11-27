/*
package com.monprojet.factory.config;


import com.monprojet.factory.entity.Role;
import com.monprojet.factory.entity.User;
import com.monprojet.factory.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        if (userRepository.findByUsername("admin").isEmpty()) {
            var admin = User.builder()
                    .username("admin")
                    .password(passwordEncoder.encode("admin123"))
                    .role(Role.ADMIN)
                    .email("admin@example.com")
                    .firstname("Admin")
                    .lastname("User")
                    .build();
            userRepository.save(admin);
        }
    }
}

 */