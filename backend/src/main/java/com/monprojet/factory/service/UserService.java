package com.monprojet.factory.service;
 
import com.monprojet.factory.dto.CreateUserRequest;
import com.monprojet.factory.entity.User;
import com.monprojet.factory.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
 
import java.util.List;
 
@Service
public class UserService {
 
    @Autowired
    private UserRepository userRepository;
 
    public User login(String username, String password) {
        return userRepository.findByUsernameAndPassword(username, password)
                .orElseThrow(() -> new RuntimeException("Invalid credentials"));
    }
 
    public List<User> getAllUsers() {
        return userRepository.findAll();
    }
 
    public User createUser(CreateUserRequest req) {
        if (userRepository.findByUsername(req.getUsername()).isPresent()) {
            throw new RuntimeException("Username already exists");
        }
 
        User user = new User();
        user.setUsername(req.getUsername());
        user.setPassword(req.getPassword());
        user.setEmail(req.getEmail());
        user.setFirstname(req.getFirstname());
        user.setLastname(req.getLastname());
        user.setRole(req.getRole());
 
        return userRepository.save(user);
    }
}