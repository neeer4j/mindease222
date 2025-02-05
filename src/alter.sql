-- Create facilities table
CREATE TABLE IF NOT EXISTS facilities (
    id INT AUTO_INCREMENT PRIMARY KEY,
    facility_id VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL
);

-- Insert example facilities
INSERT INTO facilities (facility_id, name) VALUES 
('gym', 'Gym'),
('pool', 'Pool'),
('community_hall', 'Community Hall');
