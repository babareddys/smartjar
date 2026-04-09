package com.smartjar.repository;

import com.smartjar.entity.Upi;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import java.util.UUID;

public interface UpiRepository extends JpaRepository<Upi, UUID> {
    Optional<Upi> findByUpiId(String upiId);
    Optional<Upi> findByUserId(UUID userId);
}
