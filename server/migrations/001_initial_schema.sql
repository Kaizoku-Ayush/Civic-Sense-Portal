-- Migration 001: Initial Database Schema
-- Description: Create all core tables for the Civic Sense Portal
-- Date: 2026-02-08

-- Enable PostGIS extension for geospatial queries
CREATE EXTENSION IF NOT EXISTS postgis;

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Departments table (created first because users references it)
CREATE TABLE IF NOT EXISTS departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(20),
    zone_polygon GEOMETRY(POLYGON, 4326),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    firebase_uid VARCHAR(128) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    role VARCHAR(20) DEFAULT 'CITIZEN' CHECK (role IN ('CITIZEN', 'ADMIN', 'DEPARTMENT_STAFF')),
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    civic_points INTEGER DEFAULT 0,
    avatar_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Issues table
CREATE TABLE IF NOT EXISTS issues (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    title VARCHAR(200),
    description TEXT,
    category VARCHAR(50) NOT NULL,
    ai_category VARCHAR(50),
    ai_confidence DECIMAL(5,4),
    ai_severity_score DECIMAL(3,2),
    image_url TEXT NOT NULL,
    image_hash VARCHAR(64),
    location GEOMETRY(POINT, 4326) NOT NULL,
    address TEXT,
    status VARCHAR(20) DEFAULT 'PENDING' 
        CHECK (status IN ('PENDING', 'ACKNOWLEDGED', 'IN_PROGRESS', 'RESOLVED', 'REJECTED', 'DUPLICATE')),
    priority VARCHAR(10) DEFAULT 'MEDIUM' CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    assigned_department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    assigned_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    duplicate_of UUID REFERENCES issues(id) ON DELETE SET NULL,
    resolved_at TIMESTAMP,
    resolution_image_url TEXT,
    resolution_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Issue updates/timeline table
CREATE TABLE IF NOT EXISTS issue_updates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    issue_id UUID REFERENCES issues(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    old_status VARCHAR(20),
    new_status VARCHAR(20),
    comment TEXT,
    is_public BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Routing rules table
CREATE TABLE IF NOT EXISTS routing_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category VARCHAR(50) NOT NULL,
    department_id UUID REFERENCES departments(id) ON DELETE CASCADE NOT NULL,
    zone_polygon GEOMETRY(POLYGON, 4326),
    priority INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    issue_id UUID REFERENCES issues(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(200) NOT NULL,
    message TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_issues_location ON issues USING GIST(location);
CREATE INDEX IF NOT EXISTS idx_issues_status ON issues(status);
CREATE INDEX IF NOT EXISTS idx_issues_category ON issues(category);
CREATE INDEX IF NOT EXISTS idx_issues_user ON issues(user_id);
CREATE INDEX IF NOT EXISTS idx_issues_created ON issues(created_at);
CREATE INDEX IF NOT EXISTS idx_issues_image_hash ON issues(image_hash);
CREATE INDEX IF NOT EXISTS idx_users_firebase_uid ON users(firebase_uid);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_issue_updates_issue ON issue_updates(issue_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id, is_read) WHERE is_read = FALSE;

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_issues_updated_at
    BEFORE UPDATE ON issues
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert default departments
INSERT INTO departments (name, email, phone) VALUES
    ('Sanitation Department', 'sanitation@civicsense.gov', '+91-1234567890'),
    ('Public Works Department', 'publicworks@civicsense.gov', '+91-1234567891'),
    ('Electrical Department', 'electrical@civicsense.gov', '+91-1234567892'),
    ('Water & Drainage', 'water@civicsense.gov', '+91-1234567893'),
    ('Environmental Services', 'environment@civicsense.gov', '+91-1234567894')
ON CONFLICT DO NOTHING;

-- Insert default routing rules
INSERT INTO routing_rules (category, department_id, priority) 
SELECT 
    category,
    (SELECT id FROM departments WHERE name = dept_name),
    priority
FROM (VALUES
    ('garbage', 'Sanitation Department', 1),
    ('pothole', 'Public Works Department', 1),
    ('road_crack', 'Public Works Department', 2),
    ('streetlight', 'Electrical Department', 1),
    ('drainage', 'Water & Drainage', 1),
    ('graffiti', 'Environmental Services', 3)
) AS rules(category, dept_name, priority)
ON CONFLICT DO NOTHING;

COMMENT ON TABLE users IS 'Stores user information for citizens, admins, and department staff';
COMMENT ON TABLE issues IS 'Main table for civic issue reports with geospatial data';
COMMENT ON TABLE departments IS 'Municipal departments that handle different types of issues';
COMMENT ON TABLE routing_rules IS 'Rules for automatic routing of issues to departments';
COMMENT ON TABLE notifications IS 'User notifications for issue updates';
