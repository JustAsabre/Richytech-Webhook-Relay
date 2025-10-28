# Automated API Testing Script for Webhook Relay Service
# Date: October 26, 2025

$baseUrl = "http://localhost:5000"
$testResults = @()
$testsPassed = 0
$testsFailed = 0

# Test counter
$testNumber = 0

function Write-TestHeader {
    param([string]$title)
    Write-Host "`n╔══════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
    Write-Host "║  $title" -ForegroundColor Yellow
    Write-Host "╚══════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
}

function Write-TestResult {
    param(
        [string]$testName,
        [bool]$passed,
        [string]$message = ""
    )
    
    $script:testNumber++
    
    if ($passed) {
        Write-Host "  ✅ Test $script:testNumber : $testName" -ForegroundColor Green
        if ($message) { Write-Host "     $message" -ForegroundColor Gray }
        $script:testsPassed++
    } else {
        Write-Host "  ❌ Test $script:testNumber : $testName" -ForegroundColor Red
        if ($message) { Write-Host "     Error: $message" -ForegroundColor Red }
        $script:testsFailed++
    }
    
    $script:testResults += @{
        Number = $script:testNumber
        Name = $testName
        Passed = $passed
        Message = $message
    }
}

# Global variables for auth tokens
$authToken = $null
$testUser = @{
    email = "automated.test.$(Get-Date -Format 'HHmmss')@example.com"
    password = "AutoTest@123456"
    fullName = "Automated Test User"
}

Write-Host "`n" -NoNewline
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "   AUTOMATED API TESTING - WEBHOOK RELAY SERVICE" -ForegroundColor Yellow
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "Backend URL: $baseUrl" -ForegroundColor White
Write-Host "Test Started: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor White
Write-Host ""

# ============================================================================
# TEST 1: Backend Health Check
# ============================================================================
Write-TestHeader "TEST SUITE 1: BACKEND HEALTH & CONNECTIVITY"

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/health" -Method GET
    
    if ($response.status -eq "ok") {
        Write-TestResult "Backend Health Endpoint" $true "Server is healthy"
    } else {
        Write-TestResult "Backend Health Endpoint" $false "Status is $($response.status)"
    }
    
    if ($response.mongodb -eq "connected") {
        Write-TestResult "MongoDB Connection" $true "Database connected"
    } else {
        Write-TestResult "MongoDB Connection" $false "MongoDB status: $($response.mongodb)"
    }
    
    if ($response.redis -eq "connected") {
        Write-TestResult "Redis Connection" $true "Cache connected"
    } else {
        Write-TestResult "Redis Connection" $false "Redis status: $($response.redis)"
    }
    
} catch {
    Write-TestResult "Backend Health Endpoint" $false $_.Exception.Message
    Write-TestResult "MongoDB Connection" $false "Cannot check - health endpoint failed"
    Write-TestResult "Redis Connection" $false "Cannot check - health endpoint failed"
}

# ============================================================================
# TEST 2: User Registration
# ============================================================================
Write-TestHeader "TEST SUITE 2: USER REGISTRATION"

try {
    $registerBody = @{
        email = $testUser.email
        password = $testUser.password
        fullName = $testUser.fullName
    } | ConvertTo-Json
    
    $headers = @{
        "Content-Type" = "application/json"
    }
    
    $response = Invoke-RestMethod -Uri "$baseUrl/api/auth/register" -Method POST -Body $registerBody -Headers $headers
    
    if ($response.success -eq $true) {
        Write-TestResult "User Registration" $true "User created successfully"
    } else {
        Write-TestResult "User Registration" $false "Response success flag is false"
    }
    
    if ($response.data.token) {
        Write-TestResult "JWT Token Generation" $true "Token received on registration"
        $authToken = $response.data.token
    } else {
        Write-TestResult "JWT Token Generation" $false "No token in response"
    }
    
    if ($response.data.user.email -eq $testUser.email) {
        Write-TestResult "User Data Return" $true "Correct user data returned"
    } else {
        Write-TestResult "User Data Return" $false "User data mismatch"
    }
    
    if ($response.data.user.subscriptionTier) {
        Write-TestResult "Default Subscription Assignment" $true "Subscription tier: $($response.data.user.subscriptionTier)"
    } else {
        Write-TestResult "Default Subscription Assignment" $false "No subscription tier assigned"
    }
    
} catch {
    Write-TestResult "User Registration" $false $_.Exception.Message
    Write-TestResult "JWT Token Generation" $false "Registration failed"
    Write-TestResult "User Data Return" $false "Registration failed"
    Write-TestResult "Default Subscription Assignment" $false "Registration failed"
}

# ============================================================================
# TEST 3: Authentication
# ============================================================================
Write-TestHeader "TEST SUITE 3: AUTHENTICATION & AUTHORIZATION"

# Test: Login with correct credentials
try {
    $loginBody = @{
        email = $testUser.email
        password = $testUser.password
    } | ConvertTo-Json
    
    $response = Invoke-RestMethod -Uri "$baseUrl/api/auth/login" -Method POST -Body $loginBody -Headers $headers
    
    if ($response.success -eq $true) {
        Write-TestResult "User Login (Valid Credentials)" $true "Login successful"
        $authToken = $response.data.token
    } else {
        Write-TestResult "User Login (Valid Credentials)" $false "Login failed"
    }
} catch {
    Write-TestResult "User Login (Valid Credentials)" $false $_.Exception.Message
}

# Test: Login with wrong password
try {
    $wrongLoginBody = @{
        email = $testUser.email
        password = "WrongPassword123"
    } | ConvertTo-Json
    
    $response = Invoke-RestMethod -Uri "$baseUrl/api/auth/login" -Method POST -Body $wrongLoginBody -Headers $headers
    Write-TestResult "Login Validation (Wrong Password)" $false "Should have failed but succeeded"
} catch {
    if ($_.Exception.Response.StatusCode.value__ -eq 401) {
        Write-TestResult "Login Validation (Wrong Password)" $true "Correctly rejected invalid credentials"
    } else {
        Write-TestResult "Login Validation (Wrong Password)" $false "Wrong error code: $($_.Exception.Response.StatusCode.value__)"
    }
}

# Test: Get current user (with auth token)
if ($authToken) {
    try {
        $authHeaders = @{
            "Authorization" = "Bearer $authToken"
            "Content-Type" = "application/json"
        }
        
        $response = Invoke-RestMethod -Uri "$baseUrl/api/auth/me" -Method GET -Headers $authHeaders
        
        if ($response.success -eq $true -and $response.data.user.email -eq $testUser.email) {
            Write-TestResult "Protected Route Access (With Token)" $true "User data retrieved successfully"
        } else {
            Write-TestResult "Protected Route Access (With Token)" $false "Data mismatch"
        }
    } catch {
        Write-TestResult "Protected Route Access (With Token)" $false $_.Exception.Message
    }
}

# Test: Access protected route without token
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/auth/me" -Method GET
    Write-TestResult "Protected Route Access (Without Token)" $false "Should have been rejected"
} catch {
    if ($_.Exception.Response.StatusCode.value__ -eq 401) {
        Write-TestResult "Protected Route Access (Without Token)" $true "Correctly rejected unauthorized access"
    } else {
        Write-TestResult "Protected Route Access (Without Token)" $false "Wrong error code"
    }
}

# ============================================================================
# TEST 4: Endpoints Management
# ============================================================================
Write-TestHeader "TEST SUITE 4: ENDPOINTS MANAGEMENT"

$createdEndpointId = $null

# Test: Create Endpoint
if ($authToken) {
    try {
        $endpointBody = @{
            name = "Test Webhook Endpoint"
            callbackUrl = "https://example.com/webhook/test"
            method = "POST"
            maxRetries = 3
            retryIntervals = @(1000, 5000, 10000)
        } | ConvertTo-Json
        
        $response = Invoke-RestMethod -Uri "$baseUrl/api/endpoints" -Method POST -Body $endpointBody -Headers $authHeaders
        
        if ($response.success -eq $true) {
            Write-TestResult "Create Endpoint" $true "Endpoint created successfully"
            $createdEndpointId = $response.data.endpoint._id
        } else {
            Write-TestResult "Create Endpoint" $false "Creation failed"
        }
        
        if ($response.data.endpoint.webhookUrl) {
            Write-TestResult "Webhook URL Generation" $true "URL: $($response.data.endpoint.webhookUrl)"
        } else {
            Write-TestResult "Webhook URL Generation" $false "No webhook URL generated"
        }
        
        if ($response.data.endpoint.secret) {
            Write-TestResult "HMAC Secret Generation" $true "Secret generated for signature verification"
        } else {
            Write-TestResult "HMAC Secret Generation" $false "No secret generated"
        }
        
    } catch {
        Write-TestResult "Create Endpoint" $false $_.Exception.Message
        Write-TestResult "Webhook URL Generation" $false "Endpoint creation failed"
        Write-TestResult "HMAC Secret Generation" $false "Endpoint creation failed"
    }
}

# Test: Get All Endpoints
if ($authToken) {
    try {
        $response = Invoke-RestMethod -Uri "$baseUrl/api/endpoints" -Method GET -Headers $authHeaders
        
        if ($response.success -eq $true) {
            Write-TestResult "Get All Endpoints" $true "Retrieved $($response.data.endpoints.Count) endpoint(s)"
        } else {
            Write-TestResult "Get All Endpoints" $false "Failed to retrieve endpoints"
        }
    } catch {
        Write-TestResult "Get All Endpoints" $false $_.Exception.Message
    }
}

# Test: Update Endpoint
if ($authToken -and $createdEndpointId) {
    try {
        $updateBody = @{
            name = "Updated Test Endpoint"
            isActive = $true
        } | ConvertTo-Json
        
        $response = Invoke-RestMethod -Uri "$baseUrl/api/endpoints/$createdEndpointId" -Method PUT -Body $updateBody -Headers $authHeaders
        
        if ($response.success -eq $true -and $response.data.endpoint.name -eq "Updated Test Endpoint") {
            Write-TestResult "Update Endpoint" $true "Endpoint updated successfully"
        } else {
            Write-TestResult "Update Endpoint" $false "Update failed or data mismatch"
        }
    } catch {
        Write-TestResult "Update Endpoint" $false $_.Exception.Message
    }
}

# Test: Delete Endpoint
if ($authToken -and $createdEndpointId) {
    try {
        $response = Invoke-RestMethod -Uri "$baseUrl/api/endpoints/$createdEndpointId" -Method DELETE -Headers $authHeaders
        
        if ($response.success -eq $true) {
            Write-TestResult "Delete Endpoint" $true "Endpoint deleted successfully"
        } else {
            Write-TestResult "Delete Endpoint" $false "Deletion failed"
        }
    } catch {
        Write-TestResult "Delete Endpoint" $false $_.Exception.Message
    }
}

# ============================================================================
# TEST 5: API Keys Management
# ============================================================================
Write-TestHeader "TEST SUITE 5: API KEYS MANAGEMENT"

$createdApiKeyId = $null

# Test: Generate API Key
if ($authToken) {
    try {
        $keyBody = @{
            name = "Test API Key"
        } | ConvertTo-Json
        
        $response = Invoke-RestMethod -Uri "$baseUrl/api/keys" -Method POST -Body $keyBody -Headers $authHeaders
        
        if ($response.success -eq $true) {
            Write-TestResult "Generate API Key" $true "API key created"
            $createdApiKeyId = $response.data.apiKey._id
        } else {
            Write-TestResult "Generate API Key" $false "Generation failed"
        }
        
        if ($response.data.apiKey.key) {
            Write-TestResult "API Key Full Value Return" $true "Full key returned on creation (one-time)"
        } else {
            Write-TestResult "API Key Full Value Return" $false "No full key in response"
        }
        
        if ($response.data.apiKey.prefix) {
            Write-TestResult "API Key Prefix Generation" $true "Prefix: $($response.data.apiKey.prefix)"
        } else {
            Write-TestResult "API Key Prefix Generation" $false "No prefix generated"
        }
        
    } catch {
        Write-TestResult "Generate API Key" $false $_.Exception.Message
        Write-TestResult "API Key Full Value Return" $false "Generation failed"
        Write-TestResult "API Key Prefix Generation" $false "Generation failed"
    }
}

# Test: Get All API Keys
if ($authToken) {
    try {
        $response = Invoke-RestMethod -Uri "$baseUrl/api/keys" -Method GET -Headers $authHeaders
        
        if ($response.success -eq $true) {
            Write-TestResult "Get All API Keys" $true "Retrieved $($response.data.apiKeys.Count) key(s)"
        } else {
            Write-TestResult "Get All API Keys" $false "Failed to retrieve keys"
        }
        
        # Verify keys are masked
        $firstKey = $response.data.apiKeys[0]
        if ($firstKey -and !$firstKey.key) {
            Write-TestResult "API Key Security (Masking)" $true "Full keys are not returned in list"
        } else {
            Write-TestResult "API Key Security (Masking)" $false "Full key exposed in list endpoint"
        }
    } catch {
        Write-TestResult "Get All API Keys" $false $_.Exception.Message
        Write-TestResult "API Key Security (Masking)" $false "Get keys failed"
    }
}

# Test: Revoke API Key
if ($authToken -and $createdApiKeyId) {
    try {
        $revokeBody = @{
            isActive = $false
        } | ConvertTo-Json
        
        $response = Invoke-RestMethod -Uri "$baseUrl/api/keys/$createdApiKeyId" -Method PUT -Body $revokeBody -Headers $authHeaders
        
        if ($response.success -eq $true -and $response.data.apiKey.isActive -eq $false) {
            Write-TestResult "Revoke API Key" $true "Key revoked successfully"
        } else {
            Write-TestResult "Revoke API Key" $false "Revocation failed"
        }
    } catch {
        Write-TestResult "Revoke API Key" $false $_.Exception.Message
    }
}

# Test: Delete API Key
if ($authToken -and $createdApiKeyId) {
    try {
        $response = Invoke-RestMethod -Uri "$baseUrl/api/keys/$createdApiKeyId" -Method DELETE -Headers $authHeaders
        
        if ($response.success -eq $true) {
            Write-TestResult "Delete API Key" $true "Key deleted successfully"
        } else {
            Write-TestResult "Delete API Key" $false "Deletion failed"
        }
    } catch {
        Write-TestResult "Delete API Key" $false $_.Exception.Message
    }
}

# ============================================================================
# TEST 6: Analytics & Stats
# ============================================================================
Write-TestHeader "TEST SUITE 6: ANALYTICS & STATISTICS"

if ($authToken) {
    try {
        $response = Invoke-RestMethod -Uri "$baseUrl/api/analytics/stats" -Method GET -Headers $authHeaders
        
        if ($response.success -eq $true) {
            Write-TestResult "Get Analytics Stats" $true "Stats retrieved successfully"
        } else {
            Write-TestResult "Get Analytics Stats" $false "Failed to get stats"
        }
        
        $stats = $response.data
        if ($null -ne $stats.totalWebhooks) {
            Write-TestResult "Total Webhooks Count" $true "Count: $($stats.totalWebhooks)"
        } else {
            Write-TestResult "Total Webhooks Count" $false "No webhook count in response"
        }
        
        if ($null -ne $stats.successRate) {
            Write-TestResult "Success Rate Calculation" $true "Success rate: $($stats.successRate)%"
        } else {
            Write-TestResult "Success Rate Calculation" $false "No success rate in response"
        }
        
        if ($null -ne $stats.activeEndpoints) {
            Write-TestResult "Active Endpoints Count" $true "Active: $($stats.activeEndpoints)"
        } else {
            Write-TestResult "Active Endpoints Count" $false "No active endpoints count"
        }
        
        if ($null -ne $stats.quotaLimit) {
            Write-TestResult "Quota Information" $true "Limit: $($stats.quotaLimit), Used: $($stats.quotaUsed)"
        } else {
            Write-TestResult "Quota Information" $false "No quota info in response"
        }
        
    } catch {
        Write-TestResult "Get Analytics Stats" $false $_.Exception.Message
        Write-TestResult "Total Webhooks Count" $false "Stats endpoint failed"
        Write-TestResult "Success Rate Calculation" $false "Stats endpoint failed"
        Write-TestResult "Active Endpoints Count" $false "Stats endpoint failed"
        Write-TestResult "Quota Information" $false "Stats endpoint failed"
    }
}

# ============================================================================
# TEST 7: Webhook Logs
# ============================================================================
Write-TestHeader "TEST SUITE 7: WEBHOOK LOGS"

if ($authToken) {
    try {
        $response = Invoke-RestMethod -Uri "$baseUrl/api/webhooks?page=1&limit=20" -Method GET -Headers $authHeaders
        
        if ($response.success -eq $true) {
            Write-TestResult "Get Webhook Logs" $true "Retrieved logs (Total: $($response.data.total))"
        } else {
            Write-TestResult "Get Webhook Logs" $false "Failed to get logs"
        }
        
        if ($null -ne $response.data.pagination) {
            Write-TestResult "Pagination Support" $true "Page: $($response.data.pagination.page), Total Pages: $($response.data.pagination.pages)"
        } else {
            Write-TestResult "Pagination Support" $false "No pagination data"
        }
        
    } catch {
        Write-TestResult "Get Webhook Logs" $false $_.Exception.Message
        Write-TestResult "Pagination Support" $false "Logs endpoint failed"
    }
}

# ============================================================================
# TEST 8: Profile Management
# ============================================================================
Write-TestHeader "TEST SUITE 8: PROFILE MANAGEMENT"

if ($authToken) {
    try {
        $updateProfileBody = @{
            fullName = "Updated Test User"
            company = "Test Corp"
            phone = "+1234567890"
        } | ConvertTo-Json
        
        $response = Invoke-RestMethod -Uri "$baseUrl/api/auth/me" -Method PUT -Body $updateProfileBody -Headers $authHeaders
        
        if ($response.success -eq $true -and $response.data.user.fullName -eq "Updated Test User") {
            Write-TestResult "Update Profile" $true "Profile updated successfully"
        } else {
            Write-TestResult "Update Profile" $false "Update failed or data mismatch"
        }
        
        if ($response.data.user.company -eq "Test Corp") {
            Write-TestResult "Optional Fields Update" $true "Company and phone updated"
        } else {
            Write-TestResult "Optional Fields Update" $false "Optional fields not updated"
        }
    } catch {
        Write-TestResult "Update Profile" $false $_.Exception.Message
        Write-TestResult "Optional Fields Update" $false "Profile update failed"
    }
}

# Test: Change Password
if ($authToken) {
    try {
        $passwordBody = @{
            currentPassword = $testUser.password
            newPassword = "NewAutoTest@789"
        } | ConvertTo-Json
        
        $response = Invoke-RestMethod -Uri "$baseUrl/api/auth/change-password" -Method PUT -Body $passwordBody -Headers $authHeaders
        
        if ($response.success -eq $true) {
            Write-TestResult "Change Password" $true "Password changed successfully"
            
            # Test login with new password
            $loginNewBody = @{
                email = $testUser.email
                password = "NewAutoTest@789"
            } | ConvertTo-Json
            
            $loginResponse = Invoke-RestMethod -Uri "$baseUrl/api/auth/login" -Method POST -Body $loginNewBody -Headers $headers
            
            if ($loginResponse.success -eq $true) {
                Write-TestResult "Login with New Password" $true "New password works"
                $authToken = $loginResponse.data.token
            } else {
                Write-TestResult "Login with New Password" $false "New password doesn't work"
            }
        } else {
            Write-TestResult "Change Password" $false "Password change failed"
            Write-TestResult "Login with New Password" $false "Password change failed"
        }
    } catch {
        Write-TestResult "Change Password" $false $_.Exception.Message
        Write-TestResult "Login with New Password" $false "Password change failed"
    }
}

# ============================================================================
# FINAL SUMMARY
# ============================================================================

Write-Host "`n"
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "   TEST EXECUTION SUMMARY" -ForegroundColor Yellow
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "Total Tests Run: $testNumber" -ForegroundColor White
Write-Host "Tests Passed:    " -NoNewline -ForegroundColor White
Write-Host "$testsPassed" -ForegroundColor Green
Write-Host "Tests Failed:    " -NoNewline -ForegroundColor White
Write-Host "$testsFailed" -ForegroundColor Red
Write-Host ""

$passRate = [math]::Round(($testsPassed / $testNumber) * 100, 2)
Write-Host "Pass Rate:       " -NoNewline -ForegroundColor White
if ($passRate -ge 90) {
    Write-Host "$passRate%" -ForegroundColor Green
} elseif ($passRate -ge 70) {
    Write-Host "$passRate%" -ForegroundColor Yellow
} else {
    Write-Host "$passRate%" -ForegroundColor Red
}

Write-Host ""
Write-Host "Test Completed: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor White
Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan

if ($testsFailed -eq 0) {
    Write-Host "`nALL TESTS PASSED! Application is working correctly!" -ForegroundColor Green
} else {
    Write-Host "`nSome tests failed. Review the results above." -ForegroundColor Yellow
}

Write-Host ""
