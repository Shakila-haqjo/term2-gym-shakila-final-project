-- backend/database.sql
-- High Street Gym Database Schema

-- Drop existing tables
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
    status ENUM('draft', 'published') DEFAULT 'draft',
    published_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (author_id) REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_author (author_id),
    INDEX idx_status (status)
);

-- Insert default admin user (password: admin123)
INSERT INTO users (email, password, first_name, last_name, role) VALUES
('admin@gym.com', '$2a$10$rQZ5YJZKjx4YxVZ5YJZKjO8F5YJZKjx4YxVZ5YJZKjx4YxVZ5YJZ', 'Admin', 'User', 'admin');

-- Insert sample activities
INSERT INTO activities (name, description) VALUES
('Yoga', 'Mindful stretching and breathing exercises'),
('Pilates', 'Core strengthening and flexibility'),
('HIIT', 'High-intensity interval training'),
('Personal Training', 'One-on-one training sessions'),
('Strength Training', 'Weight and resistance training'),
('CrossFit', 'Varied functional movements');

-- Insert sample locations
INSERT INTO locations (name, description) VALUES
('Main Gym', 'Main workout floor with equipment'),
('Studio A', 'Large studio for group classes'),
('Studio B', 'Smaller studio for intimate sessions'),
('Weight Room', 'Dedicated area for strength training'),
('Outdoor Area', 'Open space for outdoor activities');

-- Insert sample trainer (password: trainer123)
INSERT INTO users (email, password, first_name, last_name, phone, role, specialization, bio) VALUES
('trainer@gym.com', '$2a$10$rQZ5YJZKjx4YxVZ5YJZKjO8F5YJZKjx4YxVZ5YJZKjx4YxVZ5YJZ', 'Sarah', 'Johnson', '+1234567890', 'trainer', 'Yoga, Pilates', 'Certified yoga instructor with 8 years of experience');

-- Insert sample member (password: member123)
INSERT INTO users (email, password, first_name, last_name, phone, role) VALUES
('member@gym.com', '$2a$10$rQZ5YJZKjx4YxVZ5YJZKjO8F5YJZKjx4YxVZ5YJZKjx4YxVZ5YJZ', 'John', 'Doe', '+1987654321', 'member');