package com.smartjar.repository;

import com.smartjar.entity.GoldInvestment;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface GoldInvestmentRepository extends JpaRepository<GoldInvestment, Long> {

    List<GoldInvestment> findByUserId(Long userId);
}