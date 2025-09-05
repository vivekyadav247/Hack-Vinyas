<<<<<<< HEAD

# Vinyas Hackathon - Full Stack Application

A complete hackathon management system with team registration, admin panel, payment verification, and PPT submission functionality.

## 🚀 Features

### Frontend

- **Responsive Design**: Mobile-first design with auto-hiding navbar
- **Team Registration**: Complete registration form with validation
- **PPT Submission**: File upload for presentation submissions
- **Admin Panel**: Professional admin interface with team management
- **Payment Integration**: Payment screenshot upload and verification

### Backend

- **MongoDB Integration**: Complete database setup with schemas
- **Authentication**: Secure admin login with OTP verification
- **File Uploads**: Multer-based file handling for PPTs and images
- **Email Service**: Nodemailer integration for notifications
- **API Endpoints**: RESTful APIs for all operations
- **Validation**: Comprehensive input validation using Joi
- **Session Management**: Secure session handling

## 📁 Project Structure

```
vinyas/
├── models/                 # MongoDB models
│   ├── Team.js            # Team registration model
│   ├── Admin.js           # Admin user model
│   ├── OTP.js             # OTP verification model
│   ├── PPTSubmission.js   # PPT submission model
│   └── index.js           # Model exports
├── routes/                # API routes
│   ├── index.js           # Page routes
│   ├── auth.js            # Authentication routes
│   ├── teams.js           # Team management routes
│   └── upload.js          # File upload routes
├── middlewares/           # Custom middleware
│   ├── auth.js            # Authentication middleware
│   └── upload.js          # File upload middleware
├── utils/                 # Utility functions
│   ├── emailService.js    # Email service
│   └── validation.js      # Validation schemas
├── dbconfig/              # Database configuration
│   └── database.js        # MongoDB connection
├── uploads/               # File storage
│   ├── ppt-submissions/   # PPT files
│   ├── payment-screenshots/ # Payment images
│   └── general/           # Other files
├── views/                 # EJS templates
├── public/                # Static assets
├── .env                   # Environment variables
├── .gitignore             # Git ignore rules
├── package.json           # Dependencies
└── app.js                 # Main application
```

## 🛠️ Installation & Setup

### 1. Clone and Install Dependencies

```bash
cd "c:\Users\Vivek Yadav\Desktop\Vinyas"
npm install
```

### 2. Environment Setup

Update the `.env` file with your actual values:

```env
# MongoDB Configuration
MONGO_URI=mongodb://localhost:27017/vinyas_hackathon

# Email Configuration
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# Admin Configuration
ADMIN_EMAIL=vivekyadd240706@gmail.com
ADMIN_PASSWORD=your_secure_admin_password

# Session Configuration
SESSION_SECRET=your-super-secret-session-key

# Server Configuration
NODE_ENV=development
PORT=3000
FRONTEND_URL=http://localhost:3000
```

### 3. MongoDB Setup

- Install MongoDB locally or use MongoDB Atlas
- Update the `MONGO_URI` in `.env` file
- Database and collections will be created automatically

### 4. Email Configuration

1. Enable 2FA on your Gmail account
2. Generate an App Password
3. Update `EMAIL_USER` and `EMAIL_PASS` in `.env`

### 5. Start the Application

```bash
npm start
```

## 📡 API Endpoints

### Authentication Routes (`/api/auth`)

- `POST /admin/login` - Admin login with email/password
- `POST /admin/verify-otp` - Verify OTP for admin login
- `POST /admin/resend-otp` - Resend OTP
- `GET /admin/status` - Check authentication status
- `POST /admin/logout` - Admin logout
- `GET /admin/profile` - Get admin profile
- `PUT /admin/profile` - Update admin profile

### Team Management Routes (`/api/teams`)

- `POST /register` - Register new team
- `GET /` - Get all teams (admin only)
- `GET /:id` - Get team by ID (admin only)
- `PUT /:id` - Update team details (admin only)
- `PUT /:id/payment` - Update payment status (admin only)
- `POST /send-email` - Send emails to teams (admin only)
- `GET /stats/overview` - Get team statistics (admin only)
- `DELETE /:id` - Delete team (admin only)

### File Upload Routes (`/api/upload`)

- `POST /ppt-submission` - Submit PPT file
- `POST /payment-screenshot` - Upload payment screenshot
- `GET /file/:type/:filename` - Download uploaded file
- `GET /ppt-submissions` - Get all PPT submissions (admin only)
- `PUT /ppt-submissions/:id/review` - Review PPT submission (admin only)
- `GET /stats/uploads` - Get upload statistics (admin only)
- `DELETE /file/:type/:filename` - Delete uploaded file (admin only)

### Page Routes (`/`)

- `GET /` - Home page
- `GET /register` - Registration page
- `GET /ppt-submission` - PPT submission page
- `GET /admin/login` - Admin login page
- `GET /admin/dashboard` - Admin dashboard (requires auth)
- `GET /admin/teams` - Team management page (requires auth)

## 🗄️ Database Models

### Team Model

- Team registration information
- Leader and member details
- Payment status and details
- Registration timestamp

### Admin Model

- Admin authentication
- Role-based permissions
- Login attempt tracking
- Account locking mechanism

### OTP Model

- OTP generation and verification
- Expiration handling
- Rate limiting
- Purpose tracking

### PPTSubmission Model

- File upload tracking
- Submission versioning
- Review system
- Late submission detection

## 🔐 Security Features

- **Password Hashing**: Bcrypt with salt rounds
- **Session Security**: Secure session configuration
- **Rate Limiting**: Login attempt limiting
- **File Validation**: Strict file type validation
- **Input Sanitization**: Comprehensive validation
- **CORS Protection**: Configured for production
- **XSS Prevention**: HTTP-only cookies

## 📧 Email Templates

Professional email templates for:

- OTP verification
- Payment confirmation
- Team notifications
- Bulk messaging

## 🚀 Running in Production

1. Set `NODE_ENV=production` in `.env`
2. Use a production MongoDB instance
3. Configure proper HTTPS
4. Set up reverse proxy (nginx)
5. Use PM2 for process management

## 🔧 Development

### Default Admin Account

- Email: `vivekyadd240706@gmail.com`
- Password: Set via `ADMIN_PASSWORD` environment variable

### File Upload Limits

- PPT files: 10MB max
- Images: 5MB max
- Supported formats: PPT, PPTX, PDF, JPG, PNG

### Database Indexes

Optimized indexes for:

- Email lookups
- Team searches
- Payment status filtering
- Submission tracking

## 📝 Environment Variables

| Variable         | Description                      | Default                                      |
| ---------------- | -------------------------------- | -------------------------------------------- |
| `MONGO_URI`      | MongoDB connection string        | `mongodb://localhost:27017/vinyas_hackathon` |
| `EMAIL_USER`     | Gmail account for sending emails | -                                            |
| `EMAIL_PASS`     | Gmail app password               | -                                            |
| `ADMIN_EMAIL`    | Default admin email              | `vivekyadd240706@gmail.com`                  |
| `ADMIN_PASSWORD` | Default admin password           | `your_secure_password`                       |
| `SESSION_SECRET` | Session encryption key           | Random string                                |
| `NODE_ENV`       | Environment mode                 | `development`                                |
| `PORT`           | Server port                      | `3000`                                       |
| `FRONTEND_URL`   | Frontend URL for CORS            | `http://localhost:3000`                      |

## 🐛 Troubleshooting

### Common Issues

1. **MongoDB Connection Error**

   - Check if MongoDB is running
   - Verify connection string in `.env`

2. **Email Sending Failed**

   - Ensure Gmail 2FA is enabled
   - Use app-specific password
   - Check email credentials

3. **File Upload Issues**

   - Check file size limits
   - Verify upload directory permissions
   - Ensure supported file formats

4. **Session Issues**
   - Clear browser cookies
   - Check session secret in `.env`
   - Verify MongoDB connection

### Logs

All errors are logged to console with timestamps. Check server logs for detailed error information.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

---

**Built with ❤️ for Vinyas Hackathon**
