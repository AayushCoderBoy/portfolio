require('dotenv').config();

console.log('Environment check:', {
    DATABASE_URL: process.env.DATABASE_URL ? 'Set' : 'Not set',
    EMAIL_USER: process.env.EMAIL_USER || 'Not set',
    EMAIL_PASS: process.env.EMAIL_PASS ? 'Set' : 'Not set'
});

const express = require('express');
const cors = require('cors');
const path=require('path')
const dotenv = require('dotenv');
const { Pool } = require('pg');
const nodemailer = require('nodemailer');
const emailVerifier = require('email-verify');
const crypto = require('crypto');

dotenv.config();

// Create Express app
const app = express();

app.use(express.static(path.join(__dirname,'public')))

// Middleware
app.use(cors());
app.use(express.json());

const BACKEND_URL = 'https://portfolio-g8qc.onrender.com/';

// Log the database URL (masked)
console.log('Database URL exists:', !!process.env.DATABASE_URL);

// Database configuration
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

// Test database connection
pool.connect((err, client, release) => {
    if (err) {
        console.error('Database connection error:', err);
        console.error('Database config:', {
            url: process.env.DATABASE_URL ? 'Set (hidden)' : 'Not set'
        });
    } else {
        console.log('Database connected successfully');
        release();
    }
});

// Initialize database
async function initDatabase() {
    try {
        await testDatabaseConnection();
        // Add your table creation queries here
        const client = await pool.connect();
        await client.query(`
            CREATE TABLE IF NOT EXISTS contacts (
                id SERIAL PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                email VARCHAR(100) NOT NULL,
                message TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('Database initialized successfully');
        client.release();
    } catch (err) {
        console.error('Database initialization error:', err);
    }
}

// Call initialization
initDatabase();

// Email configuration
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    },
    tls: {
        rejectUnauthorized: false
    }
});

// Test database connection
async function testDatabaseConnection() {
    try {
        const client = await pool.connect();
        const result = await client.query('SELECT NOW()');
        console.log('Database test query result:', result.rows[0]);
        client.release();
    } catch (err) {
        console.error('Database test error:', err);
        console.log('Database URL:', process.env.DATABASE_URL ? 'Set' : 'Not set');
    }
}

testDatabaseConnection();

// Test email configuration immediately
transporter.verify((error, success) => {
    if (error) {
        console.error('Email configuration error:', error);
    } else {
        console.log('Email server is ready');
        // Send a test email
        transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: process.env.EMAIL_USER,
            subject: 'Test Email',
            text: 'This is a test email to verify the configuration'
        }).then(() => {
            console.log('Test email sent successfully');
        }).catch((err) => {
            console.error('Test email failed:', err);
        });
    }
});

// Test endpoint
app.get('/api/test', (req, res) => {
    res.json({ message: 'Backend is working!' });
});

// Store verification codes temporarily (in production, use Redis or a database)
const verificationCodes = new Map();

// Generate verification code
function generateVerificationCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

// Add a new endpoint to send verification code
app.post('/api/verify-email', async (req, res) => {
    const { email } = req.body;

    // Validate Gmail format
    const gmailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
    if (!gmailRegex.test(email)) {
        return res.status(400).json({
            message: 'Please use a valid Gmail address'
        });
    }

    try {
        // Generate a verification code
        const verificationCode = generateVerificationCode();
        
        // Store the code with the email (expires in 10 minutes)
        verificationCodes.set(email, {
            code: verificationCode,
            timestamp: Date.now()
        });

        // Send verification email
        const mailOptions = {
            from: `"Portfolio Verification" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: 'Email Verification Code',
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px;">
                    <h2>Email Verification</h2>
                    <p>Your verification code is: <strong>${verificationCode}</strong></p>
                    <p>This code will expire in 10 minutes.</p>
                </div>
            `
        };

        await transporter.sendMail(mailOptions);

        res.json({ message: 'Verification code sent successfully' });
    } catch (error) {
        console.error('Error sending verification code:', error);
        res.status(500).json({
            message: 'Error sending verification code',
            error: error.message
        });
    }
});

// Contact form endpoint
app.post('/api/contact', async (req, res) => {
    console.log('Received contact request:', req.body);
    
    // Set proper headers
    res.setHeader('Content-Type', 'application/json');
    
    try {
        const { name, email, message } = req.body;
        
        if (!name || !email || !message) {
            return res.status(400).json({
                success: false,
                message: 'Please fill in all fields'
            });
        }

        // Send email
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: process.env.EMAIL_USER,
            subject: `New Contact Form Submission from ${name}`,
            html: `
                <h2>New Contact Form Submission</h2>
                <p><strong>Name:</strong> ${name}</p>
                <p><strong>Email:</strong> ${email}</p>
                <p><strong>Message:</strong> ${message}</p>
            `
        };

        await transporter.sendMail(mailOptions);

        // Save to database
        const client = await pool.connect();
        const result = await client.query(
            'INSERT INTO contacts (name, email, message) VALUES ($1, $2, $3) RETURNING *',
            [name, email, message]
        );
        client.release();

        res.status(200).json({
            success: true,
            message: 'Message sent successfully',
            data: result.rows[0]
        });

    } catch (error) {
        console.error('Contact form error:', error);
        res.status(500).json({
            success: false,
            message: 'Error sending message. Please try again.',
            error: error.message
        });
    }
});

// Email verification endpoint
app.post('/api/verify-email', async (req, res) => {
    try {
        const { email } = req.body;
        console.log('Sending verification to:', email); // Debug log

        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
        
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Email Verification Code',
            html: `
                <h2>Email Verification</h2>
                <p>Your verification code is: <strong>${verificationCode}</strong></p>
            `
        };

        await transporter.sendMail(mailOptions);
        console.log('Verification email sent successfully'); // Debug log

        res.json({ 
            success: true, 
            message: 'Verification code sent',
            code: verificationCode 
        });
    } catch (error) {
        console.error('Email verification error:', error); // Debug log
        res.status(500).json({ 
            success: false, 
            message: 'Error sending verification code',
            error: error.message 
        });
    }
});

app.get('/',(req,res)=>{
    res.sendFile(path.join(__dirname,'public','index.html'))
})

const PORT = parseInt(process.env.PORT || '3000');

const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
}).on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.log(`Port ${PORT} is busy, trying ${PORT + 1}`);
        const newPort = PORT + 1;
        app.listen(newPort, '0.0.0.0', () => {
            console.log(`Server running on alternative port ${newPort}`);
        });
    } else {
        console.error('Server error:', err);
        process.exit(1);
    }
});

process.on('SIGTERM', () => {
    console.log('SIGTERM signal received: closing HTTP server');
    server.close(() => {
        console.log('HTTP server closed');
        pool.end();
        process.exit(0);
    });
});
