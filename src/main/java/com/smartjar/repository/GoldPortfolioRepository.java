package com.smartjar.repository;

import com.smartjar.entity.GoldPortfolio;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface GoldPortfolioRepository extends JpaRepository<GoldPortfolio,Long> {

    Optional<GoldPortfolio> findByUserId(Long userId);
}