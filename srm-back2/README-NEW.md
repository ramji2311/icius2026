# 🎓 ICIUS 2026 Research Paper Management System - Backend

A comprehensive research paper management system with multi-role workflow (Admin, Editor, Reviewer, Author) and Cloudinary PDF storage.

## 🏗️ Architecture

This backend follows **MVC (Model-View-Controller)** architecture with clear separation of concerns:

```
srm-back/
├── config/              # Configuration files
│   ├── cloudinary.js    # Cloudinary setup
│   └── database.js      # MongoDB connection
├── controllers/         # Business logic
│   ├── authController.js
│   ├── paperController.js
│   ├── adminController.js
│   ├── editorController.js
│   └── reviewerController.js
├── middleware/          # Express middleware
│   ├── auth.js          # JWT authentication
│   ├── roleCheck.js     # Role-based access control
│   └── upload.js        # Multer + Cloudinary upload
├── models/              # Mongoose schemas
│   ├── User.js          # User model with roles
│   ├── Paper.js         # Paper submission model
│   ├── Review.js        # Review model
│   └── UserSubmission.js
├── routes/              # API routes
│   ├── authRoutes.js
│   ├── paperRoutes.js
│   ├── adminRoutes.js
│   ├── editorRoutes.js
│   └── reviewerRoutes.js
├── utils/               # Helper functions
│   ├── emailService.js  # Email templates & sending
│   └── helpers.js       # Utility functions
└── server-new.js        # Main application entry
```

## 🚀 Features

###  Multi-Role System
- **Author**: Submit papers, track status
- **Reviewer**: Review assigned papers with detailed ratings
- **Editor**: Assign reviewers, make final decisions
- **Admin**: Full system control, create editors, assign papers

###  Complete Workflow
1. Author submits paper → Stored in Cloudinary
2. Admin assigns editor
3. Editor assigns 2-3 reviewers
4. Reviewers submit detailed reviews
5. Editor makes final decision (Accept/Reject/Revise)
6. Professional emails sent at each stage

###  Cloudinary Integration
- PDFs stored in cloud (not local filesystem)
- Automatic filename generation based on user email
- Version tracking for revisions
- Secure file management

###  Email System
- Professional IEEE-style HTML templates
- Automated notifications for all workflow stages
- Gmail SMTP integration

## 📦 Installation

### Prerequisites
- Node.js v18+
- MongoDB (local or Atlas)
- Cloudinary account
- Gmail account with App Password

### Setup Steps

1. **Clone and install dependencies**
```bash
cd srm-back
npm install
```

2. **Configure environment variables**
```bash
cp .env.example .env
# Edit .env with your credentials
```

3. **Required Environment Variables**
```env
# MongoDB
MONGODB_URI=mongodb://localhost:27017/SRM

# JWT
JWT_SECRET=your-secret-key

# Email (Gmail)
EMAIL_USER=icius2026@isius.org
EMAIL_PASS=your-app-password
ADMIN_EMAIL=admin@example.com

# Cloudinary
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Frontend
FRONTEND_URL=http://localhost:5173
```

4. **Start the server**
```bash
# Development
npm run dev

# Production
npm start
```

## 📡 API Endpoints

### Authentication (`/api/auth`)
```
POST   /api/auth/register          - Register new user
POST   /api/auth/login             - Login
POST   /api/auth/verify-email      - Verify email
POST   /api/auth/resend-verification - Resend verification email
POST   /api/auth/forgot-password   - Request password reset OTP
POST   /api/auth/reset-password    - Reset password with OTP
GET    /api/auth/me                - Get current user info
```

### Papers (`/api/papers`)
```
POST   /api/papers/submit          - Submit new paper (with PDF upload)
GET    /api/papers/my-submission   - Get user's submission
PUT    /api/papers/edit/:id        - Edit submission
GET    /api/papers/status/:id      - Get paper status
GET    /api/papers/all             - Get all papers (Admin/Editor)
GET    /api/papers/:id             - Get paper by ID
```

### Admin (`/api/admin`)
```
POST   /api/admin/editors          - Create editor account
GET    /api/admin/editors          - Get all editors
POST   /api/admin/assign-editor    - Assign editor to paper
POST   /api/admin/reassign-editor  - Reassign editor
GET    /api/admin/users            - Get all users
DELETE /api/admin/users/:id        - Delete user
GET    /api/admin/dashboard-stats  - Get dashboard statistics
```

### Editor (`/api/editor`)
```
GET    /api/editor/papers          - Get assigned papers
POST   /api/editor/reviewers       - Create reviewer account
GET    /api/editor/reviewers       - Get all reviewers
POST   /api/editor/assign-reviewers - Assign reviewers to paper
GET    /api/editor/papers/:id/reviews - Get reviews for paper
POST   /api/editor/make-decision   - Make final decision
GET    /api/editor/dashboard-stats - Get dashboard statistics
```

### Reviewer (`/api/reviewer`)
```
GET    /api/reviewer/papers        - Get assigned papers
GET    /api/reviewer/papers/:id    - Get paper details for review
POST   /api/reviewer/papers/:id/review - Submit review
GET    /api/reviewer/history       - Get review history
GET    /api/reviewer/dashboard-stats - Get dashboard statistics
```

## 🔐 Authentication & Authorization

### JWT Authentication
- Access tokens expire in 24 hours
- Tokens include: `userId`, `email`, `username`, `role`
- Protected routes require `Authorization: Bearer <token>` header

### Role-Based Access Control
```javascript
// Middleware usage
router.get('/admin-only', verifyJWT, requireAdmin, handler);
router.get('/editor-only', verifyJWT, requireEditor, handler);
router.get('/reviewer-only', verifyJWT, requireReviewer, handler);
router.get('/multi-role', verifyJWT, requireRole('Admin', 'Editor'), handler);
```

## 📄 File Upload with Cloudinary

### Paper Submission
```javascript
// Frontend
const formData = new FormData();
formData.append('pdf', pdfFile);
formData.append('email', 'author@example.com');
formData.append('paperTitle', 'My Research Paper');
formData.append('authorName', 'John Doe');
formData.append('category', 'Computer Science');

fetch('/api/papers/submit', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` },
  body: formData
});
```

### File Naming Convention
- Format: `{email_sanitized}_{timestamp}.pdf`
- Example: `john_doe_gmail_com_1732534567890.pdf`
- Stored in Cloudinary folder: `conference_papers/`

### Response
```json
{
  "success": true,
  "submissionId": "CO001",
  "bookingId": "BK1732534567890123",
  "paperDetails": {
    "title": "My Research Paper",
    "category": "Computer Science",
    "status": "Submitted",
    "pdfUrl": "https://res.cloudinary.com/..."
  }
}
```

## 📧 Email Templates

All emails use professional IEEE-style HTML templates:

1. **Verification Email** - Account activation
2. **Paper Submission** - Confirmation to author
3. **Admin Notification** - New submission alert
4. **Editor Assignment** - Paper assigned to editor
5. **Reviewer Assignment** - Review request with PDF link
6. **Review Submission** - Notification to editor
7. **Final Decision** - Accept/Reject/Revise notification

## 🗄️ Database Models

### User Model
```javascript
{
  username: String,
  email: String (unique),
  password: String (hashed),
  role: Enum ['Author', 'Reviewer', 'Editor', 'Admin'],
  verified: Boolean,
  verificationToken: String,
  verificationExpires: Date
}
```

### Paper Model
```javascript
{
  submissionId: String (unique, e.g., "CO001"),
  paperTitle: String,
  authorName: String,
  email: String,
  category: String,
  pdfUrl: String (Cloudinary URL),
  pdfPublicId: String (Cloudinary ID),
  status: Enum [10 statuses],
  assignedEditor: ObjectId (ref: User),
  assignedReviewers: [ObjectId] (ref: User),
  finalDecision: String,
  editorComments: String,
  editorCorrections: String,
  versions: [{ version, pdfUrl, pdfPublicId, submittedAt }]
}
```

### Review Model
```javascript
{
  paper: ObjectId (ref: Paper),
  reviewer: ObjectId (ref: User),
  ratings: {
    technicalQuality: Enum,
    significance: Enum,
    presentation: Enum,
    relevance: Enum,
    originality: Enum,
    adequacyOfCitations: Enum,
    overall: Enum
  },
  recommendation: Enum ['Accept', 'Conditionally Accept', 'Revise & Resubmit', 'Reject'],
  confidentialCommentsToEditor: String,
  commentsToAuthor: String,
  reviewFileUrls: [{ url, publicId, filename }],
  status: Enum ['Pending', 'Submitted']
}
```

## 🔄 Workflow States

Paper status progression:
1. **Submitted** - Initial submission
2. **Editor Assigned** - Admin assigned editor
3. **Under Review** - Reviewers assigned
4. **Review Received** - All reviews submitted
5. **Revision Required** - Needs corrections
6. **Revised Submitted** - Author resubmitted
7. **Conditionally Accept** - Minor revisions needed
8. **Accepted** - Paper accepted
9. **Rejected** - Paper rejected
10. **Published** - Final publication

## 🛠️ Development

### Running in Development Mode
```bash
npm run dev
```

### Testing Endpoints
```bash
# Health check
curl http://localhost:5000/health

# Register user
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test@123"}'
```

### Creating Admin Account
```javascript
// Use the register endpoint with role
POST /api/auth/register
{
  "email": "admin@example.com",
  "password": "Admin@123",
  "role": "Admin"  // Requires ADMIN_REG_SECRET verification
}
```

## 📊 Dashboard Statistics

### Admin Dashboard
- Total papers (by status)
- Total users (by role)
- Monthly submission trends
- Recent submissions
- Paper status distribution

### Editor Dashboard
- Total assigned papers
- Papers needing reviewer assignment
- Papers under review
- Papers awaiting decision
- Workload distribution

### Reviewer Dashboard
- Total assigned papers
- Pending reviews
- Submitted reviews
- Reviews by recommendation
- Pending papers list

## 🔒 Security Features

-  Password hashing with bcrypt (10 rounds)
-  JWT-based authentication
-  Role-based access control
-  Email verification required
-  OTP-based password reset
-  CORS protection
-  Input validation
-  Secure file uploads to Cloudinary

## 🐛 Error Handling

Comprehensive error handling for:
- Multer upload errors
- Mongoose validation errors
- JWT authentication errors
- Cloudinary upload failures
- Email sending failures

## 📝 License

MIT License - ICIUS 2026

## 👥 Support

For issues or questions:
- Email: icius2026@isius.org
- Check logs for detailed error messages
- Review .env configuration

---

**Built with ❤️ for ICIUS 2026 Conference**
