-- LifeLogger Database Initialization Script
-- Run this script to create the database and tables

-- Create database if it doesn't exist
CREATE DATABASE IF NOT EXISTS lifelogger_db
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

-- Use the database
USE lifelogger_db;

-- Drop existing tables if they exist (for clean setup)
DROP TABLE IF EXISTS daily_task_completions;
DROP TABLE IF EXISTS tasks;

-- Create tasks table
-- Stores recurring daily tasks
CREATE TABLE tasks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    position INT DEFAULT 0,
    INDEX idx_is_active (is_active),
    INDEX idx_position (position)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create daily_task_completions table
-- Records each time a task is completed (star earned)
-- This table is NEVER deleted when tasks are removed to preserve star history
CREATE TABLE daily_task_completions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    task_id INT NOT NULL,
    task_name VARCHAR(255) NOT NULL,  -- Denormalized for history preservation
    completed_date DATE NOT NULL,
    earned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    footnote TEXT DEFAULT NULL,
    UNIQUE KEY unique_task_day (task_id, completed_date),  -- Max 1 star per task per day
    INDEX idx_completed_date (completed_date),
    INDEX idx_task_id (task_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert some sample tasks (optional - can be removed)
INSERT INTO tasks (name) VALUES 
    ('Exercise for 30 minutes'),
    ('Read a book'),
    ('Write in journal'),
    ('Practice coding'),
    ('Meditate for 10 minutes');

SELECT 'Database initialized successfully!' AS status;
