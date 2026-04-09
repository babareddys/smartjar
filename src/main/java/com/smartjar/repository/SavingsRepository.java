package com.smartjar.repository;
import com.smartjar.entity.Savings;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
// import java.util.Optional;
import java.util.UUID;
public interface SavingsRepository extends JpaRepository<Savings, UUID> {
    
    
    List<Savings> findByUserId(UUID userId);
    
}
