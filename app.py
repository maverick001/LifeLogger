"""
LifeLogger - Daily Task & Achievement Tracker
Flask application for logging daily achievements and tracking progress with stars.
"""
from flask import Flask, render_template, jsonify, request, session, redirect, url_for
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from config import Config
import mysql.connector
from mysql.connector import pooling
from datetime import datetime, date, timedelta
from functools import wraps

app = Flask(__name__)
app.config.from_object(Config)

# Rate limiter configuration
limiter = Limiter(
    app=app,
    key_func=get_remote_address,
    default_limits=[]  # No global limit, apply per-route
)

# Database connection pool
db_pool = None


def init_db_pool():
    """Initialize the database connection pool."""
    global db_pool
    try:
        db_config = Config.get_db_config()
        
        # Build pool configuration
        pool_config = {
            'pool_name': "lifelogger_pool",
            'pool_size': db_config['pool_size'],
            'host': db_config['host'],
            'port': db_config['port'],
            'user': db_config['user'],
            'password': db_config['password'],
            'database': db_config['database']
        }
        
        # Add SSL configuration if available (for Aiven)
        if db_config.get('ssl_ca'):
            pool_config['ssl_ca'] = db_config['ssl_ca']
            pool_config['ssl_verify_cert'] = db_config.get('ssl_verify_cert', True)
            print(f"[OK] SSL configured for database connection")
        
        db_pool = pooling.MySQLConnectionPool(**pool_config)
        print("[OK] Database connection pool initialized successfully")
        
        # Check and migrate database
        check_and_migrate_db()
        
        return True
    except mysql.connector.Error as err:
        print(f"[FAIL] Database connection failed: {err}")
        return False


def get_db_connection():
    """Get a connection from the pool."""
    if db_pool is None:
        init_db_pool()
    return db_pool.get_connection()


def db_operation(f):
    """Decorator to handle database connections and error handling."""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        conn = None
        cursor = None
        try:
            conn = get_db_connection()
            cursor = conn.cursor(dictionary=True)
            result = f(cursor, conn, *args, **kwargs)
            return result
        except mysql.connector.Error as err:
            if conn:
                conn.rollback()
            return jsonify({'error': str(err)}), 500
        finally:
            if cursor:
                cursor.close()
            if conn:
                conn.close()
    return decorated_function


def check_and_migrate_db():
    """Check database schema and apply migrations if needed."""
    conn = None
    try:
        conn = db_pool.get_connection()
        cursor = conn.cursor()
        
        # Check if 'position' column exists in 'tasks' table
        cursor.execute("""
            SELECT COUNT(*) 
            FROM information_schema.columns 
            WHERE table_schema = DATABASE() 
            AND table_name = 'tasks' 
            AND column_name = 'position'
        """)
        exists = cursor.fetchone()[0]
        
        if not exists:
            print("[INFO] Applying migration: Adding 'position' column to 'tasks' table...")
            cursor.execute("ALTER TABLE tasks ADD COLUMN position INT DEFAULT 0")
            cursor.execute("CREATE INDEX idx_position ON tasks(position)")
            conn.commit()
            print("[OK] Migration successful: 'position' column added")

        # Check if 'footnote' column exists in 'daily_task_completions' table
        cursor.execute("""
            SELECT COUNT(*) 
            FROM information_schema.columns 
            WHERE table_schema = DATABASE() 
            AND table_name = 'daily_task_completions' 
            AND column_name = 'footnote'
        """)
        exists = cursor.fetchone()[0]
        
        if not exists:
            print("[INFO] Applying migration: Adding 'footnote' column to 'daily_task_completions' table...")
            cursor.execute("ALTER TABLE daily_task_completions ADD COLUMN footnote TEXT DEFAULT NULL")
            conn.commit()
            print("[OK] Migration successful: 'footnote' column added")
        
    except mysql.connector.Error as err:
        print(f"[WARN] Database migration failed: {err}")
    finally:
        if conn:
            conn.close()


def login_required(f):
    """Decorator to require site password for accessing routes."""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        # Skip authentication if SITE_PASSWORD is not set
        if not Config.SITE_PASSWORD:
            return f(*args, **kwargs)
        
        # Check if user is authenticated
        if not session.get('authenticated'):
            # For API routes, return 401
            if request.path.startswith('/api/'):
                return jsonify({'error': 'Authentication required'}), 401
            # For page routes, redirect to login
            return redirect(url_for('login'))
        
        return f(*args, **kwargs)
    return decorated_function


# ============== Authentication Routes ==============

@app.route('/login', methods=['GET'])
def login():
    """Serve the login page."""
    # If already authenticated or no password required, redirect to home
    if not Config.SITE_PASSWORD or session.get('authenticated'):
        return redirect(url_for('index'))
    return render_template('login.html')


@app.route('/api/verify-password', methods=['POST'])
@limiter.limit("5 per minute")
def verify_password():
    """Verify the site password."""
    data = request.get_json()
    
    if not data or not data.get('password'):
        return jsonify({'error': 'Password is required'}), 400
    
    if data['password'] == Config.SITE_PASSWORD:
        session['authenticated'] = True
        return jsonify({'success': True, 'message': 'Login successful'})
    else:
        return jsonify({'success': False, 'error': 'Incorrect password'}), 401


@app.route('/logout')
def logout():
    """Clear the session and redirect to login."""
    session.clear()
    return redirect(url_for('login'))


# ============== Page Routes ==============

@app.route('/')
@login_required
def index():
    """Serve the main page."""
    return render_template('index.html')


# ============== Task API Routes ==============

@app.route('/api/tasks', methods=['GET'])
@login_required
@db_operation
def get_tasks(cursor, conn):
    """Get all active tasks with completion status for a specific date."""
    # Get date from query param, default to today
    date_str = request.args.get('date')
    if date_str:
        try:
            target_date = datetime.strptime(date_str, '%Y-%m-%d').date().isoformat()
        except ValueError:
            return jsonify({'error': 'Invalid date format. Use YYYY-MM-DD'}), 400
    else:
        target_date = date.today().isoformat()
    
    query = """
        SELECT 
            t.id,
            t.name,
            t.created_at,
            CASE WHEN dtc.id IS NOT NULL THEN TRUE ELSE FALSE END as completed_today,
            dtc.footnote
        FROM tasks t
        LEFT JOIN daily_task_completions dtc 
            ON t.id = dtc.task_id AND dtc.completed_date = %s
        WHERE t.is_active = TRUE
        ORDER BY t.position ASC, t.created_at ASC
    """
    cursor.execute(query, (target_date,))
    tasks = cursor.fetchall()
    
    # Convert datetime objects to strings for JSON serialization
    for task in tasks:
        if task['created_at']:
            task['created_at'] = task['created_at'].isoformat()
        task['completed_today'] = bool(task['completed_today'])
    
    return jsonify(tasks)


@app.route('/api/tasks', methods=['POST'])
@login_required
@db_operation
def add_task(cursor, conn):
    """Add a new task."""
    data = request.get_json()
    
    if not data or not data.get('name'):
        return jsonify({'error': 'Task name is required'}), 400
    
    name = data['name'].strip()
    if not name:
        return jsonify({'error': 'Task name cannot be empty'}), 400
    
    if len(name) > 255:
        return jsonify({'error': 'Task name too long (max 255 characters)'}), 400
    
    query = "INSERT INTO tasks (name) VALUES (%s)"
    cursor.execute(query, (name,))
    conn.commit()
    
    return jsonify({
        'id': cursor.lastrowid,
        'name': name,
        'created_at': datetime.now().isoformat(),
        'completed_today': False
    }), 201


@app.route('/api/tasks/<int:task_id>', methods=['PUT'])
@login_required
@db_operation
def edit_task(cursor, conn, task_id):
    """Edit a task name."""
    data = request.get_json()
    
    if not data or not data.get('name'):
        return jsonify({'error': 'Task name is required'}), 400
    
    name = data['name'].strip()
    if not name:
        return jsonify({'error': 'Task name cannot be empty'}), 400
    
    if len(name) > 255:
        return jsonify({'error': 'Task name too long (max 255 characters)'}), 400
    
    # Check if task exists and is active
    cursor.execute("SELECT id FROM tasks WHERE id = %s AND is_active = TRUE", (task_id,))
    if not cursor.fetchone():
        return jsonify({'error': 'Task not found'}), 404

    query = "UPDATE tasks SET name = %s WHERE id = %s"
    cursor.execute(query, (name, task_id))
    conn.commit()
    
    return jsonify({
        'id': task_id,
        'name': name
    }), 200


@app.route('/api/tasks/reorder', methods=['POST'])
@login_required
@db_operation
def reorder_tasks(cursor, conn):
    """Update task positions based on a list of IDs."""
    data = request.get_json()
    
    if not data or 'taskIds' not in data:
        return jsonify({'error': 'taskIds list is required'}), 400
    
    task_ids = data['taskIds']
    
    # Update positions in bulk
    # Using a case statement or executemany might be cleaner, but simple loop is fine for small lists
    try:
        for index, task_id in enumerate(task_ids):
            cursor.execute("UPDATE tasks SET position = %s WHERE id = %s", (index, task_id))
        conn.commit()
        return jsonify({'message': 'Tasks reordered successfully'})
    except mysql.connector.Error as err:
        conn.rollback()
        return jsonify({'error': f"Database error: {err}"}), 500


@app.route('/api/tasks/<int:task_id>', methods=['DELETE'])
@login_required
@db_operation
def delete_task(cursor, conn, task_id):
    """Soft-delete a task (sets is_active=FALSE)."""
    # Check if task exists
    cursor.execute("SELECT id FROM tasks WHERE id = %s AND is_active = TRUE", (task_id,))
    if not cursor.fetchone():
        return jsonify({'error': 'Task not found'}), 404
    
    # Soft delete
    cursor.execute("UPDATE tasks SET is_active = FALSE WHERE id = %s", (task_id,))
    conn.commit()
    
    return jsonify({'message': 'Task deleted successfully'})


@app.route('/api/tasks/<int:task_id>/footnote', methods=['POST'])
@login_required
@db_operation
def save_footnote(cursor, conn, task_id):
    """Save a footnote for a task on a specific date."""
    data = request.get_json()
    
    if not data:
        return jsonify({'error': 'Request body required'}), 400
        
    footnote = data.get('footnote', '').strip()
    date_str = data.get('date')
    
    if date_str:
        try:
            target_date = datetime.strptime(date_str, '%Y-%m-%d').date().isoformat()
        except ValueError:
            return jsonify({'error': 'Invalid date format. Use YYYY-MM-DD'}), 400
    else:
        target_date = date.today().isoformat()
    
    # Get task info
    cursor.execute("SELECT id, name FROM tasks WHERE id = %s AND is_active = TRUE", (task_id,))
    task = cursor.fetchone()
    
    if not task:
        return jsonify({'error': 'Task not found'}), 404
        
    # Check if a completion record exists
    cursor.execute(
        "SELECT id FROM daily_task_completions WHERE task_id = %s AND completed_date = %s",
        (task_id, target_date)
    )
    existing_record = cursor.fetchone()
    
    if existing_record:
        # Update existing record
        cursor.execute(
            "UPDATE daily_task_completions SET footnote = %s WHERE id = %s",
            (footnote, existing_record['id'])
        )
    else:
        # Create new record (this inherently marks it as complete/starred)
        cursor.execute("""
            INSERT INTO daily_task_completions (task_id, task_name, completed_date, footnote)
            VALUES (%s, %s, %s, %s)
        """, (task_id, task['name'], target_date, footnote))
        
    conn.commit()
    
    return jsonify({
        'message': 'Footnote saved successfully',
        'task_id': task_id,
        'date': target_date,
        'footnote': footnote
    })


# ============== Task Completion API Routes ==============

@app.route('/api/tasks/<int:task_id>/complete', methods=['POST'])
@login_required
@db_operation
def complete_task(cursor, conn, task_id):
    """Mark a task as complete for a specific date (earn a star)."""
    # Get date from request body, default to today
    data = request.get_json() or {}
    date_str = data.get('date')
    
    if date_str:
        try:
            target_date = datetime.strptime(date_str, '%Y-%m-%d').date().isoformat()
        except ValueError:
            return jsonify({'error': 'Invalid date format. Use YYYY-MM-DD'}), 400
    else:
        target_date = date.today().isoformat()
    
    # Get task info
    cursor.execute("SELECT id, name FROM tasks WHERE id = %s AND is_active = TRUE", (task_id,))
    task = cursor.fetchone()
    
    if not task:
        return jsonify({'error': 'Task not found'}), 404
    
    # Check if already completed on that date
    cursor.execute(
        "SELECT id FROM daily_task_completions WHERE task_id = %s AND completed_date = %s",
        (task_id, target_date)
    )
    if cursor.fetchone():
        return jsonify({'message': 'Task already completed on this date'}), 200
    
    # Insert completion record
    query = """
        INSERT INTO daily_task_completions (task_id, task_name, completed_date)
        VALUES (%s, %s, %s)
    """
    cursor.execute(query, (task_id, task['name'], target_date))
    conn.commit()
    
    return jsonify({
        'message': 'Star earned!',
        'task_id': task_id,
        'completed_date': target_date
    }), 201


@app.route('/api/tasks/<int:task_id>/complete', methods=['DELETE'])
@login_required
@db_operation
def uncomplete_task(cursor, conn, task_id):
    """Remove task completion for a specific date (remove star)."""
    # Get date from query param, default to today
    date_str = request.args.get('date')
    if date_str:
        try:
            target_date = datetime.strptime(date_str, '%Y-%m-%d').date().isoformat()
        except ValueError:
            return jsonify({'error': 'Invalid date format. Use YYYY-MM-DD'}), 400
    else:
        target_date = date.today().isoformat()
    
    cursor.execute(
        "DELETE FROM daily_task_completions WHERE task_id = %s AND completed_date = %s",
        (task_id, target_date)
    )
    conn.commit()
    
    if cursor.rowcount > 0:
        return jsonify({'message': 'Completion removed'})
    else:
        return jsonify({'message': 'No completion found for this date'}), 404


# ============== Statistics API Routes ==============

@app.route('/api/stats/daily', methods=['GET'])
@login_required
@db_operation
def get_daily_stats(cursor, conn):
    """Get daily star counts for the last 30 days."""
    days = request.args.get('days', 30, type=int)
    days = min(max(days, 7), 90)  # Limit between 7 and 90 days
    
    end_date = date.today()
    start_date = end_date - timedelta(days=days - 1)
    
    query = """
        SELECT 
            completed_date,
            COUNT(*) as star_count
        FROM daily_task_completions
        WHERE completed_date BETWEEN %s AND %s
        GROUP BY completed_date
        ORDER BY completed_date ASC
    """
    cursor.execute(query, (start_date.isoformat(), end_date.isoformat()))
    results = cursor.fetchall()
    
    # Create a dict for quick lookup
    stats_dict = {row['completed_date'].isoformat(): row['star_count'] for row in results}
    
    # Fill in all days (including those with 0 stars)
    daily_stats = []
    current_date = start_date
    while current_date <= end_date:
        date_str = current_date.isoformat()
        daily_stats.append({
            'date': date_str,
            'day_name': current_date.strftime('%a'),  # Mon, Tue, etc.
            'star_count': stats_dict.get(date_str, 0)
        })
        current_date += timedelta(days=1)
    
    return jsonify(daily_stats)


@app.route('/api/stats/weekly', methods=['GET'])
@login_required
@db_operation
def get_weekly_stats(cursor, conn):
    """Get weekly recap - stars per task for this week."""
    today = date.today()
    
    # Check if date param provided
    date_str = request.args.get('date')
    if date_str:
        try:
            ref_date = datetime.strptime(date_str, '%Y-%m-%d').date()
        except ValueError:
            return jsonify({'error': 'Invalid date format. Use YYYY-MM-DD'}), 400
    else:
        ref_date = today

    # Rolling 7 days: [ref_date - 7, ref_date - 1]
    # This matches the "7-Day Avg" logic requested by user
    end_date = ref_date - timedelta(days=1)
    start_date = ref_date - timedelta(days=7)
    
    
    # Get all active tasks, ordered by position
    cursor.execute("SELECT id, name FROM tasks WHERE is_active = TRUE ORDER BY position ASC")
    tasks = cursor.fetchall()
    
    task_stats = []
    
    # For each task, count stars in the window
    for task in tasks:
        cursor.execute("""
            SELECT COUNT(*) as star_count
            FROM daily_task_completions
            WHERE task_id = %s AND completed_date BETWEEN %s AND %s
        """, (task['id'], start_date.isoformat(), end_date.isoformat()))
        
        count = cursor.fetchone()['star_count']
        
        task_stats.append({
            'task_id': task['id'],
            'task_name': task['name'],
            'star_count': count,
            'max_possible': 7,
            'percentage': round((count / 7) * 100, 1)
        })
    
    return jsonify({
        'week_start': start_date.isoformat(),
        'week_end': end_date.isoformat(),
        'days_in_period': 7,
        'tasks': task_stats
    })


@app.route('/api/stats/today', methods=['GET'])
@login_required
@db_operation
def get_today_stats(cursor, conn):
    """Get today's statistics."""
    today = date.today().isoformat()
    
    # Get total active tasks
    cursor.execute("SELECT COUNT(*) as total FROM tasks WHERE is_active = TRUE")
    total_tasks = cursor.fetchone()['total']
    
    # Get completed tasks today
    cursor.execute(
        "SELECT COUNT(*) as completed FROM daily_task_completions WHERE completed_date = %s",
        (today,)
    )
    completed_today = cursor.fetchone()['completed']
    
    return jsonify({
        'date': today,
        'total_tasks': total_tasks,
        'completed_tasks': completed_today,
        'stars_today': completed_today
    })


@app.route('/api/stats/average', methods=['GET'])
@login_required
@db_operation
def get_average_stats(cursor, conn):
    """Get the average number of stars earned in the past X days (default 7)."""
    # Reference date (the 'today' from which we look back)
    date_str = request.args.get('date')
    if date_str:
        try:
            ref_date = datetime.strptime(date_str, '%Y-%m-%d').date()
        except ValueError:
            return jsonify({'error': 'Invalid date format. Use YYYY-MM-DD'}), 400
    else:
        ref_date = date.today()

    days = request.args.get('days', 7, type=int)
    if days < 1:
        return jsonify({'error': 'Days must be at least 1'}), 400

    # Calculate range: [ref_date - days, ref_date - 1]
    # Example: If ref_date is Jan 12, days=7
    # End date = Jan 11 (ref_date - 1 day)
    # Start date = Jan 5 (end_date - 6 days = ref_date - 1 - (days - 1) = ref_date - days)
    end_date = ref_date - timedelta(days=1)
    start_date = ref_date - timedelta(days=days)
    
    query = """
        SELECT COUNT(*) as total_stars
        FROM daily_task_completions
        WHERE completed_date BETWEEN %s AND %s
    """
    cursor.execute(query, (start_date.isoformat(), end_date.isoformat()))
    result = cursor.fetchone()
    total_stars = result['total_stars'] if result else 0
    
    average = round(total_stars / days, 1)
    
    return jsonify({
        'average': average,
        'total_stars': total_stars,
        'days': days,
        'start_date': start_date.isoformat(),
        'end_date': end_date.isoformat(),
        'reference_date': ref_date.isoformat()
    })


# ============== Error Handlers ==============

@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Not found'}), 404


@app.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Internal server error'}), 500


@app.errorhandler(429)
def ratelimit_handler(e):
    """Handle rate limit exceeded errors."""
    return jsonify({
        'error': 'Too many login attempts. Please try again later.',
        'retry_after': e.description
    }), 429


# ============== Main ==============

if __name__ == '__main__':
    print("\n" + "="*50)
    print("  LifeLogger - Daily Task & Achievement Tracker")
    print("="*50 + "\n")
    
    if init_db_pool():
        print(f"[*] Starting server on http://localhost:5004\n")
        app.run(host='0.0.0.0', port=5004, debug=Config.DEBUG)
    else:
        print("\n[WARN] Please ensure MySQL is running and the database is initialized.")
        print("   Run: mysql -u root -p < init_db.sql\n")
