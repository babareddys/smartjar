package com.smartjar.repository;

import com.smartjar.entity.RecurringBill;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Repository
public interface RecurringBillRepository extends JpaRepository<RecurringBill, UUID> {
    List<RecurringBill> findByUserId(UUID userId);
    List<RecurringBill> findByIsActiveTrueAndNextRunDateLessThanEqual(LocalDate date);
}
