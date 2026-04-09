package com.smartjar;

import org.springframework.boot.CommandLineRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
public class DatabaseMigrationRunner implements CommandLineRunner {

    private final JdbcTemplate jdbcTemplate;

    public DatabaseMigrationRunner(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public void run(String... args) throws Exception {
        try {
            jdbcTemplate.execute("ALTER TABLE gold_holding ALTER COLUMN grams TYPE numeric(19,5);");
            System.out.println("DATABASE MIGRATION SUCCESSFUL: grams precision updated to (19,5).");
        } catch (Exception e) {
            System.out.println("DATABASE MIGRATION FAILED (or already altered): " + e.getMessage());
        }
    }
}
