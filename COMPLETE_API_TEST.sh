#!/bin/bash

# School Management System - Complete API Test Suite
# This script tests all major endpoints and captures responses for validation

BASE_URL="http://localhost:5111"
OUTPUT_FILE="API_TEST_RESULTS.json"

# Initialize results file
echo "{\"tests\": []}" > "$OUTPUT_FILE"

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to run a test and capture response
run_test() {
    local test_name=$1
    local method=$2
    local endpoint=$3
    local data=$4
    local headers=$5
    
    echo -e "${BLUE}▶ Testing: ${test_name}${NC}"
    
    if [ "$method" = "GET" ]; then
        response=$(curl -s -X GET "${BASE_URL}${endpoint}" \
            -H "Content-Type: application/json" \
            $headers)
    else
        response=$(curl -s -X POST "${BASE_URL}${endpoint}" \
            -H "Content-Type: application/json" \
            $headers \
            -d "$data")
    fi
    
    echo "$response" | jq . 2>/dev/null || echo "$response"
    echo "---"
    echo ""
}

echo "==============================================="
echo "PHASE 1: USER REGISTRATION & AUTHENTICATION"
echo "==============================================="
echo ""

# Test 1.1: Register Superadmin
run_test "1.1 Register Superadmin" "POST" "/api/user/registerUser" \
'{
    "username": "admin1",
    "email": "admin@school.com",
    "password": "AdminPass123",
    "firstName": "Admin",
    "lastName": "User",
    "role": "superadmin"
}'

# Extract admin token (manually set for now)
ADMIN_TOKEN="your_admin_token_here"

# Test 1.2: Register School Admin
run_test "1.2 Register School Admin" "POST" "/api/user/registerUser" \
'{
    "username": "school_admin1",
    "email": "school.admin@example.com",
    "password": "SchoolAdminPass123",
    "firstName": "School",
    "lastName": "Admin",
    "role": "school_admin"
}'

# Test 1.3: Register Teacher
run_test "1.3 Register Teacher" "POST" "/api/user/registerUser" \
'{
    "username": "teacher1",
    "email": "teacher@example.com",
    "password": "TeacherPass123",
    "firstName": "Jane",
    "lastName": "Smith",
    "role": "teacher"
}'

# Test 1.4: Register Student
run_test "1.4 Register Student" "POST" "/api/user/registerUser" \
'{
    "username": "student1",
    "email": "student@example.com",
    "password": "StudentPass123",
    "firstName": "John",
    "lastName": "Doe",
    "role": "student"
}'

# Test 1.5: Login User
run_test "1.5 Login User" "POST" "/api/user/loginUser" \
'{
    "username": "admin1",
    "password": "AdminPass123"
}'

echo ""
echo "==============================================="
echo "PHASE 2: SCHOOL MANAGEMENT"
echo "==============================================="
echo ""

# Test 2.1: Create School (requires token)
run_test "2.1 Create School" "POST" "/api/school/createSchool" \
'{
    "schoolName": "Springfield High School",
    "schoolAddress": "123 Main Street",
    "schoolPhone": "+1-555-1234",
    "schoolEmail": "info@springfield.edu",
    "principalName": "John Principal",
    "schoolCode": "SHS001",
    "establishedYear": 1990
}' \
"-H 'Authorization: Bearer test_token'"

# Test 2.2: List Schools
run_test "2.2 List Schools" "GET" "/api/school/listSchools?page=1&limit=20" "" \
"-H 'Authorization: Bearer test_token'"

echo ""
echo "==============================================="
echo "PHASE 3: CLASSROOM MANAGEMENT"
echo "==============================================="
echo ""

# Test 3.1: Create Classroom (requires schoolId from previous test)
run_test "3.1 Create Classroom" "POST" "/api/classroom/createClassroom" \
'{
    "schoolId": "test-school-id",
    "classroomName": "10-A",
    "gradeLevel": "10",
    "section": "A",
    "capacity": 30,
    "roomNumber": "101"
}' \
"-H 'Authorization: Bearer test_token'"

# Test 3.2: List Classrooms
run_test "3.2 List Classrooms" "GET" "/api/classroom/listClassrooms?schoolId=test-school-id&page=1&limit=20" "" \
"-H 'Authorization: Bearer test_token'"

echo ""
echo "==============================================="
echo "PHASE 4: STUDENT MANAGEMENT"
echo "==============================================="
echo ""

# Test 4.1: Create Student
run_test "4.1 Create Student" "POST" "/api/student/createStudent" \
'{
    "schoolId": "test-school-id",
    "studentFirstName": "John",
    "studentLastName": "Doe",
    "enrollmentNumber": "ENR001",
    "studentEmail": "john@example.com",
    "dateOfBirth": "2008-05-15",
    "parentName": "Jane Doe",
    "parentPhone": "+1-555-9999",
    "classroomId": "test-classroom-id",
    "enrollmentDate": "2026-01-15"
}' \
"-H 'Authorization: Bearer test_token'"

# Test 4.2: List Students
run_test "4.2 List Students" "GET" "/api/student/listStudents?schoolId=test-school-id&page=1&limit=20" "" \
"-H 'Authorization: Bearer test_token'"

echo ""
echo "==============================================="
echo "PHASE 5: VALIDATION ERROR TESTING"
echo "==============================================="
echo ""

# Test 5.1: Missing Required Fields
run_test "5.1 User Registration - Missing Email" "POST" "/api/user/registerUser" \
'{
    "username": "test",
    "password": "TestPass123",
    "firstName": "Test",
    "lastName": "User",
    "role": "student"
}'

# Test 5.2: Invalid Email Format
run_test "5.2 Invalid Email Format" "POST" "/api/user/registerUser" \
'{
    "username": "testuser",
    "email": "invalid-email",
    "password": "TestPass123",
    "firstName": "Test",
    "lastName": "User",
    "role": "student"
}'

# Test 5.3: Duplicate School Code
run_test "5.3 Duplicate School Code" "POST" "/api/school/createSchool" \
'{
    "schoolName": "Another School",
    "schoolAddress": "456 Oak Ave",
    "schoolPhone": "+1-555-5678",
    "schoolEmail": "another@school.edu",
    "principalName": "Jane Principal",
    "schoolCode": "SHS001",
    "establishedYear": 2000
}' \
"-H 'Authorization: Bearer test_token'"

# Test 5.4: Invalid Grade Level
run_test "5.4 Invalid Grade Level" "POST" "/api/classroom/createClassroom" \
'{
    "schoolId": "test-school-id",
    "classroomName": "Invalid",
    "gradeLevel": "99",
    "section": "A",
    "capacity": 30,
    "roomNumber": "101"
}' \
"-H 'Authorization: Bearer test_token'"

echo ""
echo "==============================================="
echo "PHASE 6: RBAC (Role-Based Access Control)"
echo "==============================================="
echo ""

# Test 6.1: Student Cannot Create School
run_test "6.1 Student Cannot Create School" "POST" "/api/school/createSchool" \
'{
    "schoolName": "Test School",
    "schoolAddress": "789 Test St",
    "schoolPhone": "+1-555-9999",
    "schoolEmail": "test@school.edu",
    "principalName": "Test Principal",
    "schoolCode": "TEST001",
    "establishedYear": 2020
}' \
"-H 'Authorization: Bearer student_token'"

# Test 6.2: Unauthorized Access Without Token
run_test "6.2 Unauthorized Access Without Token" "POST" "/api/school/createSchool" \
'{
    "schoolName": "Test School",
    "schoolAddress": "789 Test St",
    "schoolPhone": "+1-555-9999",
    "schoolEmail": "test@school.edu",
    "principalName": "Test Principal",
    "schoolCode": "TEST002",
    "establishedYear": 2020
}'

echo ""
echo "==============================================="
echo "TEST SUITE COMPLETE"
echo "==============================================="
echo "Results have been captured above"
echo "Review responses for validation and error handling"
echo ""
