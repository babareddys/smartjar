package com.smartjar.repository;
import com.smartjar.entity.Transaction;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
// import java.util.Optional;
import java.util.UUID;
public interface TransactionRepository extends JpaRepository<Transaction, UUID> {
    
    
    List<Transaction> findBySenderIdOrReceiverId(UUID senderId, UUID receiverId);
}
