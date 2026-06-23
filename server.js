/**
 * ============================================================
 * PROJECT 3: DATABASE INTEGRATION
 * ============================================================
 * Full Stack Development - Industrial Training Kit
 * Batch: 2026 | Powered by DecodeLabs
 * 
 * Goal: Connect the backend with a database to store and retrieve data.
 * 
 * Key Requirements:
 * - Design a simple database schema
 * - Perform basic CRUD operations
 * - Ensure proper data handling
 * ============================================================
 */

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

// ============================================================
// INITIALIZE EXPRESS APP
// ============================================================
const app = express();
const PORT = 5000;
const MONGODB_URI = 'mongodb://localhost:27017/studentDB';

// ============================================================
// MIDDLEWARE
// ============================================================
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ============================================================
// DATABASE CONNECTION
// ============================================================
mongoose.connect(MONGODB_URI)
.then(() => {
    console.log('✅ Database Connected Successfully');
})
.catch((err) => {
    console.error('❌ Database Connection Error:', err.message);
    console.log('⚠️  Make sure MongoDB is running!');
});

// ============================================================
// DATABASE SCHEMAS
// ============================================================

// Student Schema
const studentSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Student name is required'],
        trim: true,
        minlength: [2, 'Name must be at least 2 characters'],
        maxlength: [50, 'Name cannot exceed 50 characters']
    },
    email: {
        type: String,
        required: [true, 'Email address is required'],
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address']
    },
    age: {
        type: Number,
        required: [true, 'Age is required'],
        min: [1, 'Age must be at least 1'],
        max: [100, 'Age cannot exceed 100']
    },
    grade: {
        type: String,
        required: [true, 'Grade is required'],
        enum: ['A', 'B', 'C', 'D', 'F'],
        uppercase: true
    },
    course: {
        type: String,
        required: [true, 'Course name is required'],
        trim: true,
        minlength: [2, 'Course must be at least 2 characters']
    },
    profile: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Profile'
    },
    enrollmentDate: {
        type: Date,
        default: Date.now
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

studentSchema.set('toJSON', {
    transform: function(doc, ret) {
        delete ret.__v;
        return ret;
    }
});

// Profile Schema (One-to-One)
const profileSchema = new mongoose.Schema({
    studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
        required: true,
        unique: true
    },
    address: {
        type: String,
        required: [true, 'Address is required'],
        trim: true
    },
    phone: {
        type: String,
        required: [true, 'Phone number is required'],
        trim: true,
        match: [/^[0-9]{10,15}$/, 'Please enter a valid phone number']
    },
    bio: {
        type: String,
        maxlength: [500, 'Bio cannot exceed 500 characters']
    },
    city: {
        type: String,
        required: [true, 'City is required'],
        trim: true
    },
    country: {
        type: String,
        required: [true, 'Country is required'],
        trim: true,
        default: 'Pakistan'
    }
}, {
    timestamps: true
});

profileSchema.set('toJSON', {
    transform: function(doc, ret) {
        delete ret.__v;
        return ret;
    }
});

// Enrollment Schema (One-to-Many)
const enrollmentSchema = new mongoose.Schema({
    studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
        required: true
    },
    courseName: {
        type: String,
        required: [true, 'Course name is required'],
        trim: true
    },
    semester: {
        type: String,
        required: [true, 'Semester is required'],
        enum: ['Fall 2026', 'Spring 2026', 'Summer 2026']
    },
    grade: {
        type: String,
        enum: ['A', 'B', 'C', 'D', 'F', 'W'],
        default: 'W'
    },
    credits: {
        type: Number,
        required: [true, 'Credits are required'],
        min: [1, 'Credits must be at least 1'],
        max: [4, 'Credits cannot exceed 4']
    },
    enrollmentDate: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

enrollmentSchema.set('toJSON', {
    transform: function(doc, ret) {
        delete ret.__v;
        return ret;
    }
});

// Create Models
const Student = mongoose.model('Student', studentSchema);
const Profile = mongoose.model('Profile', profileSchema);
const Enrollment = mongoose.model('Enrollment', enrollmentSchema);

// ============================================================
// VALIDATION FUNCTIONS
// ============================================================

const validateStudent = (data) => {
    const errors = [];
    if (!data.name || data.name.trim().length < 2) errors.push('Name is required and must be at least 2 characters');
    if (!data.email || !/^\S+@\S+\.\S+$/.test(data.email)) errors.push('Valid email address is required');
    if (!data.age || data.age < 1 || data.age > 100) errors.push('Age must be between 1 and 100');
    if (!data.grade || !['A', 'B', 'C', 'D', 'F'].includes(data.grade.toUpperCase())) errors.push('Grade must be A, B, C, D, or F');
    if (!data.course || data.course.trim().length < 2) errors.push('Course name is required and must be at least 2 characters');
    return errors;
};

const validateProfile = (data) => {
    const errors = [];
    if (!data.address || data.address.trim().length < 5) errors.push('Address is required and must be at least 5 characters');
    if (!data.phone || !/^[0-9]{10,15}$/.test(data.phone)) errors.push('Valid phone number (10-15 digits) is required');
    if (!data.city || data.city.trim().length < 2) errors.push('City is required');
    return errors;
};

const validateEnrollment = (data) => {
    const errors = [];
    if (!data.courseName || data.courseName.trim().length < 2) errors.push('Course name is required');
    if (!data.semester || !['Fall 2026', 'Spring 2026', 'Summer 2026'].includes(data.semester)) errors.push('Valid semester is required');
    if (!data.credits || data.credits < 1 || data.credits > 4) errors.push('Credits must be between 1 and 4');
    return errors;
};

// ============================================================
// API ENDPOINTS
// ============================================================

// ========== CREATE (POST) ==========

// POST /api/students - Create student
app.post('/api/students', async (req, res) => {
    try {
        const errors = validateStudent(req.body);
        if (errors.length > 0) {
            return res.status(400).json({ success: false, message: 'Validation Error', errors });
        }

        const existingStudent = await Student.findOne({ email: req.body.email.toLowerCase() });
        if (existingStudent) {
            return res.status(409).json({ success: false, message: 'Student with this email already exists' });
        }

        const student = await Student.create({
            ...req.body,
            email: req.body.email.toLowerCase(),
            grade: req.body.grade.toUpperCase()
        });

        res.status(201).json({ success: true, message: 'Student created successfully', data: student });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error creating student', error: error.message });
    }
});

// POST /api/profiles - Create profile (One-to-One)
app.post('/api/profiles', async (req, res) => {
    try {
        const errors = validateProfile(req.body);
        if (errors.length > 0) {
            return res.status(400).json({ success: false, message: 'Validation Error', errors });
        }

        const student = await Student.findById(req.body.studentId);
        if (!student) {
            return res.status(404).json({ success: false, message: 'Student not found' });
        }

        const existingProfile = await Profile.findOne({ studentId: req.body.studentId });
        if (existingProfile) {
            return res.status(409).json({ success: false, message: 'Profile already exists for this student' });
        }

        const profile = await Profile.create(req.body);
        student.profile = profile._id;
        await student.save();

        res.status(201).json({ success: true, message: 'Profile created successfully', data: profile });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error creating profile', error: error.message });
    }
});

// POST /api/enrollments - Create enrollment (One-to-Many)
app.post('/api/enrollments', async (req, res) => {
    try {
        const errors = validateEnrollment(req.body);
        if (errors.length > 0) {
            return res.status(400).json({ success: false, message: 'Validation Error', errors });
        }

        const student = await Student.findById(req.body.studentId);
        if (!student) {
            return res.status(404).json({ success: false, message: 'Student not found' });
        }

        const enrollment = await Enrollment.create(req.body);
        res.status(201).json({ success: true, message: 'Enrollment created successfully', data: enrollment });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error creating enrollment', error: error.message });
    }
});

// ========== READ (GET) ==========

// GET /api/students - Get all students
app.get('/api/students', async (req, res) => {
    try {
        const { grade, course, isActive } = req.query;
        const filter = {};
        if (grade) filter.grade = grade.toUpperCase();
        if (course) filter.course = { $regex: course, $options: 'i' };
        if (isActive !== undefined) filter.isActive = isActive === 'true';

        const students = await Student.find(filter).populate('profile').sort({ createdAt: -1 });
        res.status(200).json({ success: true, count: students.length, data: students });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error retrieving students', error: error.message });
    }
});

// GET /api/students/:id - Get single student
app.get('/api/students/:id', async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ success: false, message: 'Invalid student ID' });
        }

        const student = await Student.findById(id).populate('profile');
        if (!student) {
            return res.status(404).json({ success: false, message: 'Student not found' });
        }

        const enrollments = await Enrollment.find({ studentId: id });
        res.status(200).json({ success: true, data: { student, enrollments } });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error retrieving student', error: error.message });
    }
});

// GET /api/students/search - Search students
app.get('/api/students/search', async (req, res) => {
    try {
        const { q } = req.query;
        if (!q || q.trim().length < 2) {
            return res.status(400).json({ success: false, message: 'Search query must be at least 2 characters' });
        }

        const students = await Student.find({
            $or: [
                { name: { $regex: q, $options: 'i' } },
                { email: { $regex: q, $options: 'i' } },
                { course: { $regex: q, $options: 'i' } }
            ]
        }).populate('profile');

        res.status(200).json({ success: true, count: students.length, data: students });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error searching students', error: error.message });
    }
});

// GET /api/enrollments/:studentId - Get enrollments for a student
app.get('/api/enrollments/:studentId', async (req, res) => {
    try {
        const { studentId } = req.params;
        if (!mongoose.Types.ObjectId.isValid(studentId)) {
            return res.status(400).json({ success: false, message: 'Invalid student ID' });
        }

        const enrollments = await Enrollment.find({ studentId }).sort({ enrollmentDate: -1 });
        res.status(200).json({ success: true, count: enrollments.length, data: enrollments });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error retrieving enrollments', error: error.message });
    }
});

// GET /api/stats - Get statistics
app.get('/api/stats', async (req, res) => {
    try {
        const totalStudents = await Student.countDocuments();
        const activeStudents = await Student.countDocuments({ isActive: true });
        const totalEnrollments = await Enrollment.countDocuments();
        
        const gradeDistribution = await Student.aggregate([
            { $group: { _id: '$grade', count: { $sum: 1 } } },
            { $sort: { _id: 1 } }
        ]);

        res.status(200).json({
            success: true,
            data: {
                totalStudents,
                activeStudents,
                inactiveStudents: totalStudents - activeStudents,
                totalEnrollments,
                gradeDistribution
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error retrieving statistics', error: error.message });
    }
});

// ========== UPDATE (PUT) ==========

// PUT /api/students/:id - Update student
app.put('/api/students/:id', async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ success: false, message: 'Invalid student ID' });
        }

        const student = await Student.findById(id);
        if (!student) {
            return res.status(404).json({ success: false, message: 'Student not found' });
        }

        if (req.body.email) {
            const duplicate = await Student.findOne({ email: req.body.email.toLowerCase(), _id: { $ne: id } });
            if (duplicate) {
                return res.status(409).json({ success: false, message: 'Email already exists for another student' });
            }
        }

        const updateData = { ...req.body };
        if (updateData.email) updateData.email = updateData.email.toLowerCase();
        if (updateData.grade) updateData.grade = updateData.grade.toUpperCase();

        const updated = await Student.findByIdAndUpdate(id, updateData, { new: true, runValidators: true }).populate('profile');
        res.status(200).json({ success: true, message: 'Student updated successfully', data: updated });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error updating student', error: error.message });
    }
});

// PUT /api/profiles/:studentId - Update profile
app.put('/api/profiles/:studentId', async (req, res) => {
    try {
        const { studentId } = req.params;
        if (!mongoose.Types.ObjectId.isValid(studentId)) {
            return res.status(400).json({ success: false, message: 'Invalid student ID' });
        }

        const profile = await Profile.findOne({ studentId });
        if (!profile) {
            return res.status(404).json({ success: false, message: 'Profile not found' });
        }

        const updated = await Profile.findOneAndUpdate({ studentId }, req.body, { new: true, runValidators: true });
        res.status(200).json({ success: true, message: 'Profile updated successfully', data: updated });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error updating profile', error: error.message });
    }
});

// ========== DELETE ==========

// DELETE /api/students/:id - Delete student (cascade)
app.delete('/api/students/:id', async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ success: false, message: 'Invalid student ID' });
        }

        const student = await Student.findById(id);
        if (!student) {
            return res.status(404).json({ success: false, message: 'Student not found' });
        }

        await Profile.findOneAndDelete({ studentId: id });
        await Enrollment.deleteMany({ studentId: id });
        await student.deleteOne();

        res.status(200).json({ success: true, message: 'Student and all related data deleted', data: { deletedId: id, name: student.name } });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error deleting student', error: error.message });
    }
});

// DELETE /api/enrollments/:id - Delete enrollment
app.delete('/api/enrollments/:id', async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ success: false, message: 'Invalid enrollment ID' });
        }

        const enrollment = await Enrollment.findById(id);
        if (!enrollment) {
            return res.status(404).json({ success: false, message: 'Enrollment not found' });
        }

        await enrollment.deleteOne();
        res.status(200).json({ success: true, message: 'Enrollment deleted successfully', data: { deletedId: id } });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error deleting enrollment', error: error.message });
    }
});

// ============================================================
// HEALTH CHECK
// ============================================================
app.get('/health', (req, res) => {
    const dbStatus = mongoose.connection.readyState;
    const statusMap = { 0: 'Disconnected', 1: 'Connected', 2: 'Connecting', 3: 'Disconnecting' };

    res.status(200).json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        server: 'Running on port ' + PORT,
        database: statusMap[dbStatus] || 'Unknown',
        uptime: Math.floor(process.uptime()) + ' seconds'
    });
});

// ============================================================
app.get('/', (req, res) => {
    res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>StudentDB | Management System</title>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css">
    <style>
        :root {
            --primary: #4f46e5;
            --primary-light: #818cf8;
            --bg: #f8fafc;
            --card-bg: #ffffff;
            --text-main: #1e293b;
            --text-muted: #64748b;
            --border: #e2e8f0;
            --success: #10b981;
            --danger: #ef4444;
        }

        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Plus Jakarta Sans', sans-serif;
            background-color: var(--bg);
            color: var(--text-main);
            line-height: 1.6;
        }

        .navbar {
            background: #fff;
            padding: 1rem 2rem;
            border-bottom: 1px solid var(--border);
            display: flex;
            justify-content: space-between;
            align-items: center;
            position: sticky;
            top: 0;
            z-index: 100;
        }

        .brand { font-weight: 700; font-size: 1.25rem; color: var(--primary); display: flex; align-items: center; gap: 10px; }

        .container { max-width: 1200px; margin: 2rem auto; padding: 0 1.5rem; }

        /* Stats Grid */
        .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 1.5rem; margin-bottom: 2rem; }
        .stat-card { background: #fff; padding: 1.5rem; border-radius: 1rem; border: 1px solid var(--border); box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.05); }
        .stat-label { font-size: 0.875rem; color: var(--text-muted); font-weight: 500; margin-bottom: 0.5rem; }
        .stat-value { font-size: 2rem; font-weight: 700; color: var(--text-main); }

        /* Layout */
        .main-layout { display: grid; grid-template-columns: 2fr 1fr; gap: 1.5rem; }

        /* Card Style */
        .card { background: #fff; border: 1px solid var(--border); border-radius: 1rem; overflow: hidden; height: fit-content; }
        .card-header { padding: 1.25rem; border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center; }
        .card-title { font-weight: 600; font-size: 1rem; }

        /* Button Style */
        .btn { padding: 0.625rem 1.25rem; border-radius: 0.5rem; font-weight: 600; font-size: 0.875rem; cursor: pointer; transition: 0.2s; border: none; display: flex; align-items: center; gap: 8px; }
        .btn-primary { background: var(--primary); color: #fff; }
        .btn-primary:hover { background: var(--primary-light); }
        .btn-outline { background: transparent; border: 1px solid var(--border); color: var(--text-main); }
        .btn-sm { padding: 0.4rem 0.8rem; font-size: 0.75rem; }
        .btn-danger { background: rgba(239, 68, 68, 0.1); color: var(--danger); }
        .btn-danger:hover { background: var(--danger); color: #fff; }

        /* Table Style */
        table { width: 100%; border-collapse: collapse; }
        th { text-align: left; padding: 1rem; font-size: 0.75rem; font-weight: 600; color: var(--text-muted); text-transform: uppercase; border-bottom: 1px solid var(--border); background: #f8fafc; }
        td { padding: 1rem; border-bottom: 1px solid var(--border); font-size: 0.875rem; }
        tr:hover { background: #fefeff; }

        /* Form Controls */
        .form-group { margin-bottom: 1rem; }
        label { display: block; font-size: 0.875rem; font-weight: 500; margin-bottom: 0.4rem; color: var(--text-main); }
        input, select, textarea { width: 100%; padding: 0.625rem; border-radius: 0.5rem; border: 1px solid var(--border); font-family: inherit; font-size: 0.875rem; }
        input:focus { outline: none; border-color: var(--primary); ring: 2px solid var(--primary-light); }

        /* Modal */
        .modal-overlay { position: fixed; inset: 0; background: rgba(15, 23, 42, 0.5); backdrop-filter: blur(4px); display: none; align-items: center; justify-content: center; z-index: 1000; padding: 1rem; }
        .modal { background: #fff; border-radius: 1rem; width: 100%; max-width: 500px; max-height: 90vh; overflow-y: auto; box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1); }

        /* Detail Sidebar */
        .details-container { padding: 1.5rem; }
        .profile-header { display: flex; align-items: center; gap: 15px; margin-bottom: 1.5rem; }
        .avatar { width: 48px; height: 48px; background: var(--primary-light); color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; }
        .detail-item { margin-bottom: 1rem; }
        .detail-label { font-size: 0.75rem; color: var(--text-muted); font-weight: 600; text-transform: uppercase; }
        .detail-value { font-weight: 500; }

        .enroll-item { background: #f8fafc; border: 1px solid var(--border); border-radius: 0.75rem; padding: 1rem; margin-bottom: 0.75rem; }

        .badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 700; text-transform: uppercase; }
        .badge-a { background: #dcfce7; color: #166534; }
        .badge-f { background: #fee2e2; color: #991b1b; }

        @media (max-width: 900px) { .main-layout { grid-template-columns: 1fr; } }
    </style>
</head>
<body>
    <nav class="navbar">
        <div class="brand"><i class="fas fa-database"></i> StudentDB <span>Pro</span></div>
        <div style="display: flex; gap: 1rem;">
            <a href="/api" class="btn btn-outline btn-sm" target="_blank">API Docs</a>
            <button class="btn btn-primary btn-sm" onclick="showModal()"><i class="fas fa-plus"></i> Add Student</button>
        </div>
    </nav>

    <div class="container">
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-label">Total Students</div>
                <div class="stat-value" id="totalStudents">0</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">Active Enrollments</div>
                <div class="stat-value" id="totalEnrollments">0</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">Database Status</div>
                <div class="stat-value" style="font-size: 1rem; color: var(--success); display:flex; align-items:center; gap:8px;">
                    <i class="fas fa-circle" style="font-size: 8px;"></i> Connected
                </div>
            </div>
        </div>

        <div class="main-layout">
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">Student Directory</h3>
                    <button class="btn btn-outline btn-sm" onclick="loadStudents()"><i class="fas fa-sync"></i> Refresh</button>
                </div>
                <div style="overflow-x: auto;">
                    <table id="studentTable">
                        <thead>
                            <tr>
                                <th>Student</th>
                                <th>Course</th>
                                <th>Grade</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody id="studentList">
                            <!-- Loaded via JS -->
                        </tbody>
                    </table>
                </div>
            </div>

            <div class="card" id="detailsCard">
                <div class="card-header">
                    <h3 class="card-title">Selection Details</h3>
                </div>
                <div class="details-container" id="detailsContent">
                    <div style="text-align:center; color: var(--text-muted); padding: 3rem 0;">
                        <i class="fas fa-user-graduate" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.2;"></i>
                        <p>Select a student to view their profile and course enrollments.</p>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Add Student Modal -->
    <div class="modal-overlay" id="addModal">
        <div class="modal">
            <div class="card-header">
                <h3 class="card-title">New Student Registration</h3>
                <button onclick="hideModal()" style="border:none; background:none; cursor:pointer;"><i class="fas fa-times"></i></button>
            </div>
            <form id="studentForm" style="padding: 1.5rem;" onsubmit="handleCreate(event)">
                <div class="form-group">
                    <label>Full Name</label>
                    <input type="text" name="name" required placeholder="mubashar kiyani">
                </div>
                <div class="form-group">
                    <label>Email Address</label>
                    <input type="email" name="email" required placeholder="mubashar.kiyani@example.com">
                </div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                    <div class="form-group">
                        <label>Age</label>
                        <input type="number" name="age" required min="1" max="100" value="20">
                    </div>
                    <div class="form-group">
                        <label>Initial Grade</label>
                        <select name="grade">
                            <option value="A">Grade A</option>
                            <option value="B">Grade B</option>
                            <option value="C">Grade C</option>
                            <option value="D">Grade D</option>
                            <option value="F">Grade F</option>
                        </select>
                    </div>
                </div>
                <div class="form-group">
                    <label>Primary Course</label>
                    <input type="text" name="course" required placeholder="Industrial Training Bundle">
                </div>
                <div style="margin-top: 1.5rem; display: flex; gap: 1rem;">
                    <button type="button" class="btn btn-outline" style="flex:1;" onclick="hideModal()">Cancel</button>
                    <button type="submit" class="btn btn-primary" style="flex:1;">Create Record</button>
                </div>
            </form>
        </div>
    </div>

    <script>
        function showModal() { document.getElementById('addModal').style.display = 'flex'; }
        function hideModal() { document.getElementById('addModal').style.display = 'none'; }

        async function loadStudents() {
            const res = await fetch('/api/students');
            const data = await res.json();
            const list = document.getElementById('studentList');
            list.innerHTML = '';

            data.data.forEach(student => {
                const tr = document.createElement('tr');
                tr.onclick = () => viewStudent(student._id);
                tr.style.cursor = 'pointer';
                tr.innerHTML = \`
                    <td>
                        <div style="font-weight:600;">\${student.name}</div>
                        <div style="font-size:12px; color:var(--text-muted);">\${student.email}</div>
                    </td>
                    <td>\${student.course}</td>
                    <td><span class="badge badge-a">\${student.grade}</span></td>
                    <td>\${student.isActive ? '<i class="fas fa-circle" style="color:#10b981; font-size:8px;"></i> Active' : 'Inactive'}</td>
                    <td>
                        <button class="btn btn-danger btn-sm" onclick="event.stopPropagation(); handleDelete('\${student._id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                \`;
                list.appendChild(tr);
            });

            updateStats();
        }

        async function viewStudent(id) {
            const res = await fetch(\`/api/students/\${id}\`);
            const { data } = await res.json();
            const { student, enrollments } = data;
            
            const content = document.getElementById('detailsContent');
            content.innerHTML = \`
                <div class="profile-header">
                    <div class="avatar">\${student.name.charAt(0).toUpperCase()}</div>
                    <div>
                        <h4 style="margin:0;">\${student.name}</h4>
                        <p style="font-size:12px; color:var(--text-muted); margin:0;">\${student.email}</p>
                    </div>
                </div>

                <div style="display:grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 2rem;">
                    <div class="detail-item">
                        <div class="detail-label">Age</div>
                        <div class="detail-value">\${student.age} Years</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">Enrolled In</div>
                        <div class="detail-value">\${student.course}</div>
                    </div>
                </div>

                <h5 style="margin-bottom: 1rem; font-size: 0.8rem; text-transform: uppercase; color: var(--text-muted);">Enrollment History</h5>
                \${enrollments.length > 0 ? enrollments.map(e => \`
                    <div class="enroll-item">
                        <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
                            <span style="font-weight:600;">\${e.courseName}</span>
                            <span class="badge badge-a">\${e.grade}</span>
                        </div>
                        <div style="font-size:12px; color:var(--text-muted); display:flex; justify-content:space-between;">
                            <span>\${e.semester}</span>
                            <span>\${e.credits} Credits</span>
                        </div>
                    </div>
                \`).join('') : '<p style="font-size:13px; color:var(--text-muted);">No detailed enrollment records found.</p>'}
                
                <button class="btn btn-outline btn-sm" style="width:100%; margin-top: 1rem;" onclick="addQuickEnroll('\${student._id}')">
                    <i class="fas fa-plus"></i> Add Enrollment
                </button>
            \`;
        }

        async function handleCreate(e) {
            e.preventDefault();
            const formData = new FormData(e.target);
            const student = Object.fromEntries(formData);
            
            const res = await fetch('/api/students', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(student)
            });

            if (res.ok) {
                hideModal();
                e.target.reset();
                loadStudents();
            } else {
                const err = await res.json();
                alert('Error: ' + err.message);
            }
        }

        async function handleDelete(id) {
            if (!confirm('Are you sure you want to delete this student and all related data?')) return;
            
            const res = await fetch(\`/api/students/\${id}\`, { method: 'DELETE' });
            if (res.ok) {
                loadStudents();
                document.getElementById('detailsContent').innerHTML = '<p style="text-align:center; color: var(--text-muted); padding: 3rem 0;">Student deleted successfully.</p>';
            }
        }

        async function addQuickEnroll(studentId) {
            const courseName = prompt('Enter Course Name:');
            if (!courseName) return;

            const res = await fetch('/api/enrollments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    studentId,
                    courseName,
                    semester: 'Fall 2026',
                    credits: 3,
                    grade: 'A'
                })
            });

            if (res.ok) viewStudent(studentId);
        }

        async function updateStats() {
            const res = await fetch('/api/stats');
            const data = await res.json();
            if (data.success) {
                document.getElementById('totalStudents').textContent = data.data.totalStudents;
                document.getElementById('totalEnrollments').textContent = data.data.totalEnrollments;
            }
        }

        // Initialize
        loadStudents();
        setInterval(updateStats, 10000);
    </script>
</body>
</html>
    `);
});
// API DOCS ENDPOINT
// ============================================================
app.get('/api', (req, res) => {
    res.status(200).json({
        project: 'Project 3: Database Integration',
        description: 'Connect the backend with a database to store and retrieve data',
        version: '1.0.0',
        institution: 'DecodeLabs',
        batch: '2026',
        database: 'MongoDB (NoSQL)',
        schema: {
            Student: 'Student information (Primary Key: _id)',
            Profile: 'Student profile (One-to-One with Student)',
            Enrollment: 'Course enrollment (One-to-Many with Student)'
        },
        crudOperations: {
            CREATE: {
                'POST /api/students': 'Create a new student',
                'POST /api/profiles': 'Create a profile (One-to-One)',
                'POST /api/enrollments': 'Create an enrollment (One-to-Many)'
            },
            READ: {
                'GET /api/students': 'Get all students',
                'GET /api/students/:id': 'Get a single student with enrollments',
                'GET /api/students/search?q=term': 'Search students',
                'GET /api/enrollments/:studentId': 'Get enrollments for a student',
                'GET /api/stats': 'Get statistics'
            },
            UPDATE: {
                'PUT /api/students/:id': 'Update a student',
                'PUT /api/profiles/:studentId': 'Update a profile'
            },
            DELETE: {
                'DELETE /api/students/:id': 'Delete a student (cascade)',
                'DELETE /api/enrollments/:id': 'Delete an enrollment'
            }
        },
        constraints: {
            UNIQUE: 'Email must be unique',
            'NOT NULL': 'All fields are required',
            CHECK: 'Age 1-100, Grade A-F, Credits 1-4'
        },
        relationships: {
            'One-to-One': 'Student → Profile',
            'One-to-Many': 'Student → Enrollments'
        }
    });
});

// ============================================================
// 404 ERROR HANDLER
// ============================================================
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found',
        suggestion: 'Visit / for the UI or /api for API documentation'
    });
});

// ============================================================
// GLOBAL ERROR HANDLER
// ============================================================
app.use((err, req, res, next) => {
    console.error('Server Error:', err);
    res.status(500).json({
        success: false,
        message: 'Internal Server Error',
        error: err.message
    });
});

// ============================================================
// START SERVER
// ============================================================
app.listen(PORT, () => {
    console.log('');
    console.log('╔═══════════════════════════════════════════════════════════════╗');
    console.log('║                                                               ║');
    console.log('║       🗄️  PROJECT 3: DATABASE INTEGRATION                    ║');
    console.log('║                                                               ║');
    console.log('║       DecodeLabs Industrial Training Kit                      ║');
    console.log('║       Batch: 2026                                            ║');
    console.log('║                                                               ║');
    console.log('╠═══════════════════════════════════════════════════════════════╣');
    console.log('║                                                               ║');
    console.log(`║   📡 Server    : http://localhost:${PORT}                      ║`);
    console.log(`║   🖥️  UI        : http://localhost:${PORT}/                     ║`);
    console.log(`║   📚 API Docs  : http://localhost:${PORT}/api                  ║`);
    console.log(`║   🏥 Health    : http://localhost:${PORT}/health               ║`);
    console.log('║                                                               ║');
    console.log(`║   🗄️  Database : ${MONGODB_URI}                               ║`);
    console.log('║                                                               ║');
    console.log('║   📊 Schema Design:                                           ║');
    console.log('║   ┌─────────────────────────────────────────────────────────┐  ║');
    console.log('║   │  Student  ──(1:1)──►  Profile                         │  ║');
    console.log('║   │     │                                                  │  ║');
    console.log('║   │     └──(1:Many)──►  Enrollments                       │  ║');
    console.log('║   └─────────────────────────────────────────────────────────┘  ║');
    console.log('║                                                               ║');
    console.log('║   ✅ CRUD Operations Ready:                                   ║');
    console.log('║   📝 CREATE  │  📖 READ  │  ✏️ UPDATE  │  🗑️ DELETE          ║');
    console.log('║                                                               ║');
    console.log('╚═══════════════════════════════════════════════════════════════╝');
    console.log('');
});