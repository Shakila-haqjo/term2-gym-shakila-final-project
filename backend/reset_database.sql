-- Reset Database Script
-- Drops old database and creates fresh new database

-- Drop old database if exists
DROP DATABASE IF EXISTS high_street_gym;

-- Drop new database if exists (to ensure clean slate)
DROP DATABASE IF EXISTS shakila_fitness_gym;

-- Create new database
CREATE DATABASE shakila_fitness_gym;

-- Use the new database
USE shakila_fitness_gym;

-- Drop existing tables (safety measure)
DROP TABLE IF EXISTS bookings;
DROP TABLE IF EXISTS blog_posts;
DROP TABLE IF EXISTS sessions;
DROP TABLE IF EXISTS activities;
DROP TABLE IF EXISTS locations;
DROP TABLE IF EXISTS users;

-- Users table
CREATE TABLE users (
    user_id INT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    role ENUM('member', 'trainer', 'admin') DEFAULT 'member',
    specialization VARCHAR(255),
    bio TEXT,
    profile_image VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_role (role)
);

-- Activities table
CREATE TABLE activities (
    activity_id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Locations table
CREATE TABLE locations (
    location_id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sessions table
CREATE TABLE sessions (
    session_id INT PRIMARY KEY AUTO_INCREMENT,
    trainer_id INT NOT NULL,
    activity_id INT NOT NULL,
    location_id INT NOT NULL,
    session_name VARCHAR(255) NOT NULL,
    session_date DATE NOT NULL,
    session_time TIME NOT NULL,
    duration INT NOT NULL COMMENT 'Duration in minutes',
    max_participants INT NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (trainer_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (activity_id) REFERENCES activities(activity_id) ON DELETE CASCADE,
    FOREIGN KEY (location_id) REFERENCES locations(location_id) ON DELETE CASCADE,
    INDEX idx_trainer (trainer_id),
    INDEX idx_date (session_date)
);

-- Bookings table
CREATE TABLE bookings (
    booking_id INT PRIMARY KEY AUTO_INCREMENT,
    session_id INT NOT NULL,
    user_id INT NOT NULL,
    status ENUM('confirmed', 'cancelled', 'completed') DEFAULT 'confirmed',
    booking_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    cancelled_at TIMESTAMP NULL,
    FOREIGN KEY (session_id) REFERENCES sessions(session_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    UNIQUE KEY unique_booking (session_id, user_id),
    INDEX idx_user (user_id),
    INDEX idx_session (session_id),
    INDEX idx_status (status)
);

-- Blog posts table
CREATE TABLE blog_posts (
    post_id INT PRIMARY KEY AUTO_INCREMENT,
    author_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    category VARCHAR(50),
    featured_image VARCHAR(255),
    status ENUM('draft', 'published') DEFAULT 'published',
    published_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (author_id) REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_author (author_id),
    INDEX idx_status (status)
);

-- Insert default users with proper bcrypt hashed passwords
-- Passwords: admin12322, trainer12322, member12322
INSERT INTO users (email, password, first_name, last_name, role) VALUES
('admin22@gym.com', '$2a$10$KtrZa9oIdHLKBpuCZsXhU.HkEshZqzrxUgaN6t8agU13/UruzWACe', 'Admin', 'User', 'admin');

INSERT INTO users (email, password, first_name, last_name, phone, role, specialization, bio) VALUES
('trainer22@gym.com', '$2a$10$MLiWf2CdpoKrPf1hNO2/XerUjxt1BBdcSt8fPHD8Pvjk1Zk445sFa', 'Sarah', 'Johnson', '+1234567890', 'trainer', 'Yoga, Pilates, HIIT', 'Certified fitness instructor with 8 years of experience');

INSERT INTO users (email, password, first_name, last_name, phone, role) VALUES
('member@gym22.com', '$2a$10$7QTmEAK7KIVphxNAozaAeOj2QROhmdaxNoQOBX.1pFFNPbnKM0FWe', 'John', 'Doe', '+1987654321', 'member');

-- Insert sample activities
INSERT INTO activities (name, description) VALUES
('Yoga', 'Mindful stretching and breathing exercises for flexibility and relaxation'),
('Pilates', 'Core strengthening and flexibility training'),
('HIIT', 'High-intensity interval training for maximum calorie burn'),
('Personal Training', 'One-on-one personalized training sessions'),
('Strength Training', 'Weight and resistance training for muscle building'),
('CrossFit', 'Varied functional movements at high intensity'),
('Cardio', 'Cardiovascular endurance training'),
('Zumba', 'Dance fitness party workout');

-- Insert sample locations
INSERT INTO locations (name, description) VALUES
('Main Gym Floor', 'Main workout floor with cardio and weight equipment'),
('Studio A', 'Large studio for group fitness classes'),
('Studio B', 'Smaller studio for intimate sessions and personal training'),
('Weight Room', 'Dedicated area for strength and resistance training'),
('Outdoor Area', 'Open space for outdoor activities and boot camps'),
('Spin Room', 'Dedicated cycling studio with stationary bikes');
