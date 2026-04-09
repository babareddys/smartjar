package com.smartjar.repository;
import com.smartjar.entity.GoldHolding;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
// import java.util.Optional;
import java.util.UUID;
public interface GoldHoldingRepository extends JpaRepository<GoldHolding, UUID> {
    
    
    List<GoldHolding> findByUserId(UUID userId);
    
}
