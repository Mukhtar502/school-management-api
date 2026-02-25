# 🎓 School Management System API

A comprehensive, enterprise-grade RESTful API for managing schools, classrooms, and students with role-based access control (RBAC), JWT authentication, and MongoDB persistence.

![Node.js](https://img.shields.io/badge/node.js-v14+-green)
![Express](https://img.shields.io/badge/express-4.17+-blue)
![MongoDB](https://img.shields.io/badge/mongodb-4.4+-success)
![License](https://img.shields.io/badge/license-ISC-brightgreen)

---

## ✨ Features

### 🔐 **Security & Authentication**

- **JWT-based authentication** with long-lived (7 days) and short-lived (24 hours) tokens
- **bcrypt password hashing** for secure credential storage
- **Token refresh mechanism** for continuous sessions
- **RBAC (Role-Based Access Control)** with 4 user roles
- **Input validation** on all endpoints
- **SQL injection & XSS protection**

### 👥 **Role-Based Access Control**

```
SUPERADMIN - Full system access
├─ Manage all schools
├─ Manage all users
└─ View system statistics

SCHOOL_ADMIN - School-specific access
├─ Manage classrooms in assigned school
├─ Manage students in assigned school
└─ View school statistics

TEACHER - Classroom access
├─ View students in classroom
└─ Mark attendance and grades

STUDENT - Personal access
├─ View own profile
└─ View classroom information
```

### 📚 **Core Resources**

#### Schools

- ✅ Create, Read, Update, Delete (CRUD)
- ✅ School profile management
- ✅ Statistics and reporting
- ✅ Multi-school support

#### Classrooms

- ✅ Create classrooms with grade levels and sections
- ✅ Manage classroom capacity and enrollment
- ✅ View enrolled students
- ✅ Check availability before enrollment

#### Students

- ✅ Student enrollment and profile management
- ✅ Transfer between classrooms (same school)
- ✅ Enrollment history tracking
- ✅ Suspend/Withdraw students
- ✅ Parent/guardian information

#### Users

- ✅ User registration and login
- ✅ Profile management
- ✅ Password management
- ✅ Role assignment

### 🗄️ **Data Management**

- MongoDB document database
- Redis caching for performance
- Soft deletes for audit trail
- Transaction support for critical operations
- Comprehensive logging

### 📊 **API Features**

- RESTful API design
- Pagination support
- Advanced filtering and search
- Consistent error responses
- Request/response validation
- Rate limiting (configurable)

---

## 🚀 Quick Start

### Prerequisites

- Node.js v14 or higher
- MongoDB v4.4 or higher
- Redis v5.0 or higher (optional, for caching)
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/school-management-api.git
cd school-management-api/axion

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Configure environment variables
nano .env  # Edit with your MongoDB and Redis URIs

# Start the application
npm start

# Server runs on http://localhost:5111
```

### Configuration (.env file)

```bash
# Service
SERVICE_NAME=school-management-api
ENV=development

# Database
MONGO_URI=mongodb://localhost:27017/school_management_system

# Redis
REDIS_URI=redis://127.0.0.1:6379
CORTEX_REDIS=redis://127.0.0.1:6379
OYSTER_REDIS=redis://127.0.0.1:6379
CACHE_REDIS=redis://127.0.0.1:6379

# JWT Secrets (MUST be strong in production!)
LONG_TOKEN_SECRET=your_super_secret_long_token_key_min_32_chars!
SHORT_TOKEN_SECRET=your_super_secret_short_token_key_min_32_chars!
NACL_SECRET=dGhpcyBpcyBhIDMyIGNoYXIgbmFjbCBzZWNyZXQga2V5Lg==

# Ports
USER_PORT=5111
ADMIN_PORT=5222
```

---

## 📖 API Documentation

For comprehensive API documentation, see [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)

### Quick Example - User Registration

```bash
curl -X POST http://localhost:5111/api/user/registerUser \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "email": "admin@school.edu",
    "password": "SecurePassword123",
    "firstName": "Admin",
    "lastName": "User",
    "role": "superadmin"
  }'
```

### Quick Example - Create School

```bash
curl -X POST http://localhost:5111/api/school/createSchool \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_long_token_here" \
  -d '{
    "schoolName": "St. Mary\\'s High School",
    "schoolAddress": "123 Main Street, City, State",
    "schoolPhone": "+1234567890",
    "schoolEmail": "contact@stmarys.edu",
    "principalName": "Dr. Sarah Johnson",
    "schoolCode": "SMH001",
    "establishedYear": 2000
  }'
```

---

## 🏗️ Project Structure

```
axion/
├─ config/              # Configuration management
│  ├─ index.config.js   # Main config loader
│  └─ envs/             # Environment-specific configs
│     ├─ development.js
│     └─ production.js
│
├─ managers/            # Business logic layer
│  ├─ entities/
│  │  ├─ user/          # User management
│  │  ├─ school/        # School CRUD
│  │  ├─ classroom/     # Classroom CRUD
│  │  └─ student/       # Student CRUD
│  ├─ api/              # API router
│  ├─ token/            # JWT token management
│  ├─ response_dispatcher/  # Response formatting
│  └─ _common/          # Shared schemas
│
├─ mws/                 # Middleware
│  ├─ __token.mw.js     # JWT authentication
│  ├─ __device.mw.js    # Device info extraction
│  ├─ __params.mw.js    # URL params extraction
│  ├─ __query.mw.js     # Query string extraction
│  └─ ...
│
├─ loaders/             # Dependency injection & initialization
│  ├─ ManagersLoader.js # Initialize all managers
│  ├─ MiddlewaresLoader.js
│  └─ ValidatorsLoader.js
│
├─ libs/                # Utility functions
├─ cache/               # Redis caching layer
├─ connect/             # Database connections
├─ public/              # Static assets
│
├─ index.js             # Application entry point
├─ package.json
├─ .env                 # Environment variables
├─ .env.example         # Example env file
├─ README.md            # This file
└─ API_DOCUMENTATION.md # Detailed API docs
```

---

## 🗄️ Database Schema

### Collections

- **users** - User accounts with roles
- **schools** - School information
- **classrooms** - Classroom data (linked to schools)
- **students** - Student records (linked to schools and classrooms)
- **enrollment_history** - Historical enrollment records

See [API_DOCUMENTATION.md](./API_DOCUMENTATION.md#database-schema) for detailed schema definitions.

---

## 🔑 Key Endpoints

### Authentication (No token required)

- `POST /api/user/registerUser` - Register new user
- `POST /api/user/loginUser` - Login and get tokens

### Schools (Superadmin only)

- `POST /api/school/createSchool` - Create school
- `GET /api/school/listSchools` - List all schools
- `GET /api/school/getSchoolById` - Get school details
- `POST /api/school/updateSchool` - Update school
- `POST /api/school/deleteSchool` - Deactivate school

### Classrooms (School admin + Superadmin)

- `POST /api/classroom/createClassroom` - Create classroom
- `GET /api/classroom/listClassrooms` - List classrooms
- `GET /api/classroom/getClassroomById` - Get details
- `POST /api/classroom/updateClassroom` - Update details
- `GET /api/classroom/checkClassroomAvailability` - Check seats

### Students (School admin + Superadmin)

- `POST /api/student/createStudent` - Enroll student
- `GET /api/student/listStudents` - List students
- `GET /api/student/getStudentById` - Get student details
- `POST /api/student/updateStudent` - Update profile
- `POST /api/student/transferStudent` - Transfer classroom
- `POST /api/student/withdrawStudent` - Withdraw student

For complete endpoint list, see [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)

---

## 🧪 Testing

### Running Tests

```bash
# Run all tests
npm test

# Run specific test suite
npm test -- user.test.js

# Run with coverage
npm test -- --coverage
```

### Manual Testing with cURL

```bash
# Register superadmin
curl -X POST http://localhost:5111/api/user/registerUser \
  -H "Content-Type: application/json" \
  -d '{
    "username": "superadmin",
    "email": "admin@example.com",
    "password": "AdminPassword123!",
    "firstName": "Super",
    "lastName": "Admin",
    "role": "superadmin"
  }'

# Login (get tokens)
curl -X POST http://localhost:5111/api/user/loginUser \
  -H "Content-Type: application/json" \
  -d '{
    "username": "superadmin",
    "password": "AdminPassword123!"
  }'

# Use returned longToken for subsequent requests
```

### Postman Collection

Import the included Postman collection for easy testing:

- File: `postman_collection.json`
- Environment variables configured for local development
- Examples for all operations

---

## 🚢 Deployment

### Local Development

```bash
npm start
# Runs on http://localhost:5111
```

### Production Build

```bash
npm run build
npm run start:prod
```

### Docker Deployment

```bash
# Build Docker image
docker build -t school-management-api .

# Run container
docker run -p 5111:5111 \
  -e MONGO_URI=your_mongo_uri \
  -e REDIS_URI=your_redis_uri \
  school-management-api
```

### Heroku Deployment

```bash
# Add MongoDB Atlas and Redis to env vars
heroku config:set MONGO_URI=your_mongo_uri
heroku config:set REDIS_URI=your_redis_uri
heroku config:set LONG_TOKEN_SECRET=your_secret
heroku config:set SHORT_TOKEN_SECRET=your_secret
heroku config:set NACL_SECRET=your_secret

# Deploy
git push heroku main
```

### AWS/DigitalOcean Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed instructions.

---

## 🔒 Security Considerations

### Best Practices Implemented

✅ **Password Security**

- Bcrypt hashing with 10 salt rounds
- Minimum 8 characters required
- Never stored in plain text

✅ **Token Security**

- JWT signature validation on every request
- Token expiration enforced
- Refresh token mechanism
- Token blacklisting supported

✅ **RBAC**

- Every endpoint checks user role
- Granular permissions per action
- School admin cannot access other schools

✅ **Input Validation**

- All inputs validated against schemas
- Type checking
- Length restrictions
- Pattern matching (email, phone, etc.)

✅ **Error Handling**

- Generic error messages (no info leakage)
- Detailed logging (internal only)
- Request/response sanitization

### Production Recommendations

1. **Environment Variables**
   - Use strong, unique JWT secrets (min 64 chars)
   - Store .env in secure vault (AWS Secrets Manager, etc.)
   - Never commit .env to version control

2. **HTTPS/TLS**
   - Always use HTTPS in production
   - Certificate from Let's Encrypt or CA
   - Enable HSTS headers

3. **Rate Limiting**
   - Implement per-IP rate limiting
   - Implement per-user rate limiting
   - Use Redis for distributed rate limiting

4. **Monitoring**
   - Enable comprehensive logging
   - Setup error tracking (Sentry)
   - Monitor database performance
   - Setup alerts for failures

5. **Database**
   - Use managed MongoDB Atlas
   - Enable authentication
   - Encrypt data in transit and at rest
   - Regular backups

6. **CORS**
   - Restrict to specific origins
   - Never use wildcard `*` in production
   - Configure appropriate headers

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Code Style

- Use 4-space indentation
- Follow existing naming conventions
- Add JSDoc comments for functions
- Write clean, readable code

---

## 📝 License

This project is licensed under the ISC License - see [LICENSE](./LICENSE) file for details.

---

## 📧 Support

For support, email support@schoolmanagement.api or open an issue on GitHub.

---

## 🙏 Acknowledgments

- Built with [Axion Framework](https://github.com/qantra-io/axion)
- Authentication using [JWT](https://jwt.io/)
- Password hashing with [bcrypt](https://www.npmjs.com/package/bcrypt)
- Validation with [Pineapple](https://www.npmjs.com/package/qantra-pineapple)

---

**Last Updated:** February 23, 2026  
**Version:** 1.0.0  
**Status:** Production Ready ✅
