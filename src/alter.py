import mysql.connector
from mysql.connector import Error

# Database connection details
HOST = "localhost"
USER = "root"
PASSWORD = "1234"  # Update this with your actual password
DATABASE = "society_management"

# SQL Queries
setup_queries = [
    # Drop bookings and facilities tables if they already exist
    "DROP TABLE IF EXISTS bookings;",
    "DROP TABLE IF EXISTS facilities;",
    
    # Create facilities table
    """
    CREATE TABLE facilities (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        available BOOLEAN DEFAULT TRUE
    );
    """,
    
    # Create bookings table
    """
    CREATE TABLE bookings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        member_id INT NOT NULL,
        facility_id INT NOT NULL,
        date DATE NOT NULL,
        status ENUM('Pending', 'Accepted', 'Rejected') DEFAULT 'Pending',
        reason TEXT,
        response_reason TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (facility_id) REFERENCES facilities(id) ON DELETE CASCADE
    );
    """,
    
    # Insert sample data into facilities
    """
    INSERT INTO facilities (name, available) VALUES
    ('Gym', 1),
    ('Pool', 1),
    ('Community Hall', 1);
    """,
    
    # Insert sample data into bookings (optional)
    """
    INSERT INTO bookings (member_id, facility_id, date, status) VALUES
    (1, 1, '2024-10-20', 'Accepted'),
    (2, 2, '2024-10-21', 'Pending'),
    (3, 3, '2024-10-22', 'Rejected');
    """
]

def drop_foreign_key_if_exists(cursor):
    """Check if foreign key constraint exists and drop it if it does."""
    try:
        cursor.execute("""
            SELECT CONSTRAINT_NAME FROM information_schema.KEY_COLUMN_USAGE 
            WHERE TABLE_NAME = 'bookings' AND REFERENCED_TABLE_NAME = 'facilities';
        """)
        result = cursor.fetchone()
        if result:
            fk_name = result[0]
            cursor.execute(f"ALTER TABLE bookings DROP FOREIGN KEY {fk_name};")
            print(f"Foreign key {fk_name} dropped successfully.")
        else:
            print("No foreign key to drop.")
    except Error as e:
        print(f"Error while dropping foreign key: {e}")
    finally:
        cursor.fetchall()  # Consume any unread result to prevent the "Unread result found" error

def execute_queries(queries):
    """Execute a list of SQL queries."""
    try:
        # Establish a database connection
        connection = mysql.connector.connect(
            host=HOST,
            user=USER,
            password=PASSWORD,
            database=DATABASE
        )
        
        if connection.is_connected():
            cursor = connection.cursor()
            
            # Drop the foreign key if it exists
            drop_foreign_key_if_exists(cursor)

            # Execute all other queries
            for query in queries:
                print(f"Executing:\n{query}")
                cursor.execute(query)
                connection.commit()
                print("Success.\n")
            print("All queries executed successfully.")
    
    except Error as e:
        print(f"Error: {e}")
    
    finally:
        if connection.is_connected():
            cursor.close()
            connection.close()
            print("MySQL connection is closed.")

# Run the script
if __name__ == "__main__":
    execute_queries(setup_queries)
