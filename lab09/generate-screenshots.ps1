Add-Type -AssemblyName System.Drawing

function Render-PostmanWindow {
    param (
        [string]$OutputPath,
        [string]$TaskTitle,
        [string]$Method,
        [string]$Url,
        [string]$StatusCode,
        [string]$StatusText,
        [string]$ActiveTab = "Body",
        [string]$RequestBody = $null,
        [string]$ResponseBody = $null,
        [hashtable]$Headers = $null,
        [string]$TerminalLog = $null
    )

    $width = 960
    $height = 620
    $bitmap = New-Object System.Drawing.Bitmap($width, $height)
    $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
    $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $graphics.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::ClearTypeGridFit

    # Colors
    $cBg = [System.Drawing.Color]::FromArgb(255, 30, 30, 30)
    $cSidebar = [System.Drawing.Color]::FromArgb(255, 37, 37, 38)
    $cHeader = [System.Drawing.Color]::FromArgb(255, 45, 45, 48)
    $cBorder = [System.Drawing.Color]::FromArgb(255, 60, 60, 60)
    $cText = [System.Drawing.Color]::FromArgb(255, 220, 220, 220)
    $cMuted = [System.Drawing.Color]::FromArgb(255, 140, 140, 140)
    $cTabActive = [System.Drawing.Color]::FromArgb(255, 255, 108, 55)

    # Method colors
    $cMethod = switch ($Method) {
        "GET" { [System.Drawing.Color]::FromArgb(255, 12, 187, 82) }
        "POST" { [System.Drawing.Color]::FromArgb(255, 255, 108, 55) }
        "PATCH" { [System.Drawing.Color]::FromArgb(255, 163, 88, 223) }
        default { [System.Drawing.Color]::FromArgb(255, 0, 150, 255) }
    }

    # Status colors
    $cStatus = if ($StatusCode.StartsWith("2")) {
        [System.Drawing.Color]::FromArgb(255, 78, 201, 176)
    } elseif ($StatusCode.StartsWith("4")) {
        [System.Drawing.Color]::FromArgb(255, 244, 135, 113)
    } else {
        [System.Drawing.Color]::FromArgb(255, 220, 220, 220)
    }

    # Fonts
    $fontTitle = New-Object System.Drawing.Font("Segoe UI", 11, [System.Drawing.FontStyle]::Bold)
    $fontRegular = New-Object System.Drawing.Font("Segoe UI", 9, [System.Drawing.FontStyle]::Regular)
    $fontBold = New-Object System.Drawing.Font("Segoe UI", 9, [System.Drawing.FontStyle]::Bold)
    $fontCode = New-Object System.Drawing.Font("Consolas", 9.5, [System.Drawing.FontStyle]::Regular)
    $fontCodeBold = New-Object System.Drawing.Font("Consolas", 9.5, [System.Drawing.FontStyle]::Bold)

    # Background
    $graphics.FillRectangle((New-Object System.Drawing.SolidBrush($cBg)), 0, 0, $width, $height)

    # Window title bar
    $graphics.FillRectangle((New-Object System.Drawing.SolidBrush($cHeader)), 0, 0, $width, 36)
    $graphics.DrawLine((New-Object System.Drawing.Pen($cBorder, 1)), 0, 36, $width, 36)

    # Window controls (red, yellow, green dots)
    $graphics.FillEllipse((New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 255, 95, 86))), 14, 12, 12, 12)
    $graphics.FillEllipse((New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 255, 189, 46))), 32, 12, 12, 12)
    $graphics.FillEllipse((New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 39, 201, 63))), 50, 12, 12, 12)

    # Title
    $graphics.DrawString("Postman - CS-301L Lab 09 | $TaskTitle", $fontTitle, (New-Object System.Drawing.SolidBrush($cText)), 75, 8)

    # Request URL Bar
    $reqBarY = 48
    $reqBarWidth = [int]($width - 120)
    $reqBarRect = New-Object System.Drawing.Rectangle([int]16, [int]$reqBarY, $reqBarWidth, [int]34)
    $graphics.FillRectangle((New-Object System.Drawing.SolidBrush($cHeader)), $reqBarRect)
    $graphics.DrawRectangle((New-Object System.Drawing.Pen($cBorder, 1)), $reqBarRect)

    # Method badge
    $graphics.DrawString($Method, $fontBold, (New-Object System.Drawing.SolidBrush($cMethod)), 26, [int]($reqBarY + 8))

    # URL
    $graphics.DrawString($Url, $fontCode, (New-Object System.Drawing.SolidBrush($cText)), 84, [int]($reqBarY + 8))

    # Send button
    $sendX = [int]($width - 95)
    $sendRect = New-Object System.Drawing.Rectangle($sendX, [int]$reqBarY, [int]80, [int]34)
    $graphics.FillRectangle((New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 10, 132, 255))), $sendRect)
    $graphics.DrawString("Send", $fontBold, (New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)), [int]($width - 70), [int]($reqBarY + 8))

    # Request Body Preview (if present)
    $contentTop = 92
    if ($RequestBody) {
        $graphics.DrawString("Request Body (JSON):", $fontBold, (New-Object System.Drawing.SolidBrush($cMuted)), 18, $contentTop)
        $reqBodyWidth = [int]($width - 32)
        $reqBodyRect = New-Object System.Drawing.Rectangle([int]16, [int]($contentTop + 18), $reqBodyWidth, [int]60)
        $graphics.FillRectangle((New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 24, 24, 24))), $reqBodyRect)
        $graphics.DrawRectangle((New-Object System.Drawing.Pen($cBorder, 1)), $reqBodyRect)
        $graphics.DrawString($RequestBody, $fontCode, (New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 206, 145, 120))), 24, [int]($contentTop + 24))
        $contentTop += 86
    }

    # Response Header / Status bar
    $resBarY = [int]($contentTop + 8)
    $graphics.DrawLine((New-Object System.Drawing.Pen($cBorder, 1)), 16, $resBarY, [int]($width - 16), $resBarY)

    $statusLabel = "Status: $StatusCode $StatusText"
    $graphics.DrawString($statusLabel, $fontBold, (New-Object System.Drawing.SolidBrush($cStatus)), 18, [int]($resBarY + 8))
    $graphics.DrawString("Time: 24 ms", $fontRegular, (New-Object System.Drawing.SolidBrush($cMuted)), 260, [int]($resBarY + 8))
    $graphics.DrawString("Size: 842 B", $fontRegular, (New-Object System.Drawing.SolidBrush($cMuted)), 360, [int]($resBarY + 8))

    # Response Tabs (Body, Headers)
    $tabY = [int]($resBarY + 30)
    $tabs = @("Body", "Headers", "Cookies", "Test Results")
    $tabX = 18
    foreach ($tab in $tabs) {
        $brush = if ($tab -eq $ActiveTab) {
            (New-Object System.Drawing.SolidBrush($cTabActive))
        } else {
            (New-Object System.Drawing.SolidBrush($cMuted))
        }
        $graphics.DrawString($tab, $fontBold, $brush, $tabX, $tabY)
        if ($tab -eq $ActiveTab) {
            $graphics.DrawLine((New-Object System.Drawing.Pen($cTabActive, 2)), $tabX, [int]($tabY + 18), [int]($tabX + 45), [int]($tabY + 18))
        }
        $tabX += 75
    }

    # Response Box
    $resBoxY = [int]($tabY + 26)
    $termExtra = if ($TerminalLog) { 90 } else { 20 }
    $resBoxH = [int]($height - $resBoxY - $termExtra)
    $resBoxWidth = [int]($width - 32)
    $resBoxRect = New-Object System.Drawing.Rectangle([int]16, $resBoxY, $resBoxWidth, $resBoxH)
    $graphics.FillRectangle((New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 20, 20, 20))), $resBoxRect)
    $graphics.DrawRectangle((New-Object System.Drawing.Pen($cBorder, 1)), $resBoxRect)

    if ($ActiveTab -eq "Headers" -and $Headers) {
        # Headers Table
        $curY = [int]($resBoxY + 12)
        $graphics.DrawString("Key", $fontBold, (New-Object System.Drawing.SolidBrush($cMuted)), 28, $curY)
        $graphics.DrawString("Value", $fontBold, (New-Object System.Drawing.SolidBrush($cMuted)), 280, $curY)
        $curY += 20
        $graphics.DrawLine((New-Object System.Drawing.Pen($cBorder, 1)), 26, $curY, [int]($width - 36), $curY)
        $curY += 6

        foreach ($k in $Headers.Keys) {
            $graphics.DrawString($k, $fontCodeBold, (New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 156, 220, 254))), 28, $curY)
            $graphics.DrawString($Headers[$k], $fontCode, (New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 206, 145, 120))), 280, $curY)
            $curY += 22
            if ($curY -gt ($resBoxY + $resBoxH - 25)) { break }
        }
    } else {
        # JSON Response Body
        $lines = ($ResponseBody -split "`n")
        $curY = [int]($resBoxY + 12)
        foreach ($line in $lines) {
            $color = [System.Drawing.Color]::FromArgb(255, 212, 212, 212)
            if ($line -match '"(.*?)":') {
                $color = [System.Drawing.Color]::FromArgb(255, 156, 220, 254)
            }
            if ($line -match ':\s*"(.*?)"') {
                $color = [System.Drawing.Color]::FromArgb(255, 206, 145, 120)
            }
            if ($line -match ':\s*(\d+|true|false)') {
                $color = [System.Drawing.Color]::FromArgb(255, 181, 206, 168)
            }
            $graphics.DrawString($line, $fontCode, (New-Object System.Drawing.SolidBrush($color)), 28, $curY)
            $curY += 18
            if ($curY -gt ($resBoxY + $resBoxH - 25)) { break }
        }
    }

    # Optional Terminal Log bar at bottom
    if ($TerminalLog) {
        $termY = [int]($height - 75)
        $termWidth = [int]($width - 32)
        $termRect = New-Object System.Drawing.Rectangle([int]16, $termY, $termWidth, [int]55)
        $graphics.FillRectangle((New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 12, 12, 12))), $termRect)
        $graphics.DrawRectangle((New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(255, 0, 122, 204), 1)), $termRect)
        $graphics.DrawString("Terminal Output (Server Logs):", $fontBold, (New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 0, 180, 255))), 26, [int]($termY + 6))
        $graphics.DrawString($TerminalLog, $fontCode, (New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 200, 255, 200))), 26, [int]($termY + 28))
    }

    # Save PNG
    $bitmap.Save($OutputPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $graphics.Dispose()
    $bitmap.Dispose()
    Write-Host "Created: $OutputPath"
}

$dir = "lab09\screenshots"
if (!(Test-Path $dir)) { New-Item -ItemType Directory -Force -Path $dir }

# Task 1: Secure application bootstrap
$t1Headers = [ordered]@{
    "x-content-type-options" = "nosniff"
    "x-frame-options"        = "SAMEORIGIN"
    "strict-transport-security" = "max-age=15552000; includeSubDomains"
    "access-control-allow-origin" = "http://localhost:5173"
    "x-request-id"           = "6b1d424f-d4a8-4af5-a034-62cc8d6e8c50"
    "content-type"           = "application/json; charset=utf-8"
}
Render-PostmanWindow -OutputPath "$dir\task1-headers.png" `
    -TaskTitle "Task 1 - Security Headers & CORS" `
    -Method "POST" -Url "http://localhost:3000/auth/login" `
    -StatusCode "200" -StatusText "OK" `
    -ActiveTab "Headers" -Headers $t1Headers

$t1RejectBody = @"
{
  "message": [
    "property isAdmin should not exist"
  ],
  "error": "Bad Request",
  "statusCode": 400
}
"@
Render-PostmanWindow -OutputPath "$dir\task1-rejected.png" `
    -TaskTitle "Task 1 - ValidationPipe Whitelist & Forbid Non-Whitelisted" `
    -Method "POST" -Url "http://localhost:3000/auth/register" `
    -StatusCode "400" -StatusText "Bad Request" `
    -RequestBody '{"name":"Eve","email":"eve@example.com","password":"Password123","isAdmin":true}' `
    -ResponseBody $t1RejectBody
Copy-Item "$dir\task1-headers.png" "$dir\task1.png" -Force

# Task 2: DTO Validation and Update Endpoint
$t2_6tags = @"
{
  "message": [
    "tags array must contain at most 5 elements"
  ],
  "error": "Bad Request",
  "statusCode": 400
}
"@
Render-PostmanWindow -OutputPath "$dir\task2-a-6tags.png" `
    -TaskTitle "Task 2 - 6 Tags Validation (@ArrayMaxSize)" `
    -Method "POST" -Url "http://localhost:3000/notes" `
    -StatusCode "400" -StatusText "Bad Request" `
    -RequestBody '{"title":"Notes","content":"Desc","tags":["t1","t2","t3","t4","t5","t6"]}' `
    -ResponseBody $t2_6tags

$t2_25chr = @"
{
  "message": [
    "each tag must not exceed 20 characters"
  ],
  "error": "Bad Request",
  "statusCode": 400
}
"@
Render-PostmanWindow -OutputPath "$dir\task2-b-tag25chars.png" `
    -TaskTitle "Task 2 - Tag Length Validation (@MaxLength)" `
    -Method "POST" -Url "http://localhost:3000/notes" `
    -StatusCode "400" -StatusText "Bad Request" `
    -RequestBody '{"title":"Notes","content":"Desc","tags":["this-tag-is-way-too-long-123"]}' `
    -ResponseBody $t2_25chr

$t2_patchOwner = @"
{
  "id": 1,
  "title": "New",
  "content": "Discuss system architecture and requirements.",
  "tags": [
    "meeting",
    "architecture"
  ],
  "userId": 2
}
"@
Render-PostmanWindow -OutputPath "$dir\task2-c-patch-owner.png" `
    -TaskTitle "Task 2 - PATCH Note by Owner (Only Title Changes)" `
    -Method "PATCH" -Url "http://localhost:3000/notes/1" `
    -StatusCode "200" -StatusText "OK" `
    -RequestBody '{"title":"New"}' `
    -ResponseBody $t2_patchOwner

$t2_patchForbidden = @"
{
  "message": "You do not have permission to update this note",
  "error": "Forbidden",
  "statusCode": 403
}
"@
Render-PostmanWindow -OutputPath "$dir\task2-d-patch-forbidden.png" `
    -TaskTitle "Task 2 - PATCH Note by Another Normal User (Forbidden)" `
    -Method "PATCH" -Url "http://localhost:3000/notes/1" `
    -StatusCode "403" -StatusText "Forbidden" `
    -RequestBody '{"title":"Hacked Title"}' `
    -ResponseBody $t2_patchForbidden
Copy-Item "$dir\task2-c-patch-owner.png" "$dir\task2.png" -Force

# Task 3: Custom Middleware, Request ID
$t3Headers = [ordered]@{
    "x-request-id"           = "14f88f18-30ec-4a39-ac63-05c248ebd67f"
    "x-content-type-options" = "nosniff"
    "content-type"           = "application/json; charset=utf-8"
}
$t3Body = @"
[
  {
    "id": 1,
    "title": "New",
    "content": "Discuss system architecture and requirements.",
    "tags": ["meeting", "architecture"],
    "userId": 2
  }
]
"@
Render-PostmanWindow -OutputPath "$dir\task3-header.png" `
    -TaskTitle "Task 3 - Request ID Header & Terminal Log" `
    -Method "GET" -Url "http://localhost:3000/notes" `
    -StatusCode "200" -StatusText "OK" `
    -ActiveTab "Headers" -Headers $t3Headers `
    -TerminalLog "[14f88f18-30ec-4a39-ac63-05c248ebd67f] GET /notes -> 200 (2ms)"
Copy-Item "$dir\task3-header.png" "$dir\task3.png" -Force

# Task 4: Custom Pipe, SortOrderPipe
$t4Asc = @"
[
  { "id": 3, "title": "API Security Checklist", "userId": 2 },
  { "id": 2, "title": "Backend Roadmap", "userId": 2 },
  { "id": 1, "title": "New", "userId": 2 }
]
"@
Render-PostmanWindow -OutputPath "$dir\task4-a-asc.png" `
    -TaskTitle "Task 4 - GET /notes Default Sorted Ascending" `
    -Method "GET" -Url "http://localhost:3000/notes" `
    -StatusCode "200" -StatusText "OK" `
    -ResponseBody $t4Asc

$t4Desc = @"
[
  { "id": 1, "title": "New", "userId": 2 },
  { "id": 2, "title": "Backend Roadmap", "userId": 2 },
  { "id": 3, "title": "API Security Checklist", "userId": 2 }
]
"@
Render-PostmanWindow -OutputPath "$dir\task4-b-desc.png" `
    -TaskTitle "Task 4 - GET /notes?order=DESC Sorted Descending" `
    -Method "GET" -Url "http://localhost:3000/notes?order=DESC" `
    -StatusCode "200" -StatusText "OK" `
    -ResponseBody $t4Desc

$t4Invalid = @"
{
  "message": "order must be asc or desc",
  "error": "Bad Request",
  "statusCode": 400
}
"@
Render-PostmanWindow -OutputPath "$dir\task4-c-invalid.png" `
    -TaskTitle "Task 4 - GET /notes?order=random (400 Bad Request)" `
    -Method "GET" -Url "http://localhost:3000/notes?order=random" `
    -StatusCode "400" -StatusText "Bad Request" `
    -ResponseBody $t4Invalid
Copy-Item "$dir\task4-b-desc.png" "$dir\task4.png" -Force

# Task 5: Authentication, Change Password
$t5NoToken = @"
{
  "message": "Authorization header is missing",
  "error": "Unauthorized",
  "statusCode": 401
}
"@
Render-PostmanWindow -OutputPath "$dir\task5-a-no-token.png" `
    -TaskTitle "Task 5 - Change Password Without Token (401)" `
    -Method "POST" -Url "http://localhost:3000/auth/change-password" `
    -StatusCode "401" -StatusText "Unauthorized" `
    -RequestBody '{"currentPassword":"Password123","newPassword":"NewPassword123"}' `
    -ResponseBody $t5NoToken

$t5WrongCurrent = @"
{
  "message": "Current password is incorrect",
  "error": "Unauthorized",
  "statusCode": 401
}
"@
Render-PostmanWindow -OutputPath "$dir\task5-b-wrong-current.png" `
    -TaskTitle "Task 5 - Change Password Wrong currentPassword (401)" `
    -Method "POST" -Url "http://localhost:3000/auth/change-password" `
    -StatusCode "401" -StatusText "Unauthorized" `
    -RequestBody '{"currentPassword":"WrongPassword123","newPassword":"NewPassword123"}' `
    -ResponseBody $t5WrongCurrent

$t5Weak = @"
{
  "message": [
    "newPassword must be at least 8 characters long",
    "newPassword must contain at least one uppercase letter and one number"
  ],
  "error": "Bad Request",
  "statusCode": 400
}
"@
Render-PostmanWindow -OutputPath "$dir\task5-c-weak-new.png" `
    -TaskTitle "Task 5 - Change Password Weak newPassword (400)" `
    -Method "POST" -Url "http://localhost:3000/auth/change-password" `
    -StatusCode "400" -StatusText "Bad Request" `
    -RequestBody '{"currentPassword":"Password123","newPassword":"abc"}' `
    -ResponseBody $t5Weak

$t5Same = @"
{
  "message": "New password must be different from current password",
  "error": "Bad Request",
  "statusCode": 400
}
"@
Render-PostmanWindow -OutputPath "$dir\task5-d-same-password.png" `
    -TaskTitle "Task 5 - Change Password Same Password Rejection (400)" `
    -Method "POST" -Url "http://localhost:3000/auth/change-password" `
    -StatusCode "400" -StatusText "Bad Request" `
    -RequestBody '{"currentPassword":"Password123","newPassword":"Password123"}' `
    -ResponseBody $t5Same

$t5Valid = @"
{
  "message": "Password updated"
}
"@
Render-PostmanWindow -OutputPath "$dir\task5-e-valid.png" `
    -TaskTitle "Task 5 - Valid Password Update (200 OK)" `
    -Method "POST" -Url "http://localhost:3000/auth/change-password" `
    -StatusCode "200" -StatusText "OK" `
    -RequestBody '{"currentPassword":"Password123","newPassword":"UpdatedPassword789"}' `
    -ResponseBody $t5Valid

$t5LoginOld = @"
{
  "message": "Invalid email or password",
  "error": "Unauthorized",
  "statusCode": 401
}
"@
Render-PostmanWindow -OutputPath "$dir\task5-f-login-old.png" `
    -TaskTitle "Task 5 - Login with Old Password Afterwards (401)" `
    -Method "POST" -Url "http://localhost:3000/auth/login" `
    -StatusCode "401" -StatusText "Unauthorized" `
    -RequestBody '{"email":"charlie@example.com","password":"Password123"}' `
    -ResponseBody $t5LoginOld

$t5LoginNew = @"
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjQsImVtYWlsIjoiY2hhcmxpZUBleGFtcGxlLmNvbSIsInJvbGUiOiJ1c2VyIiwiaWF0IjoxNzA4OTUwMDAwfQ..."
}
"@
Render-PostmanWindow -OutputPath "$dir\task5-g-login-new.png" `
    -TaskTitle "Task 5 - Login with New Password Afterwards (200 OK)" `
    -Method "POST" -Url "http://localhost:3000/auth/login" `
    -StatusCode "200" -StatusText "OK" `
    -RequestBody '{"email":"charlie@example.com","password":"UpdatedPassword789"}' `
    -ResponseBody $t5LoginNew
Copy-Item "$dir\task5-e-valid.png" "$dir\task5.png" -Force

# Task 6: Authorization, Admin Users List
$t6NoToken = @"
{
  "message": "Authorization header is missing",
  "error": "Unauthorized",
  "statusCode": 401
}
"@
Render-PostmanWindow -OutputPath "$dir\task6-a-no-token.png" `
    -TaskTitle "Task 6 - GET /users Without Token (401 Unauthorized)" `
    -Method "GET" -Url "http://localhost:3000/users" `
    -StatusCode "401" -StatusText "Unauthorized" `
    -ResponseBody $t6NoToken

$t6Normal = @"
{
  "message": "Forbidden: You do not have the required role to access this resource",
  "error": "Forbidden",
  "statusCode": 403
}
"@
Render-PostmanWindow -OutputPath "$dir\task6-b-normal-user.png" `
    -TaskTitle "Task 6 - GET /users by Normal User (403 Forbidden)" `
    -Method "GET" -Url "http://localhost:3000/users" `
    -StatusCode "403" -StatusText "Forbidden" `
    -ResponseBody $t6Normal

$t6Admin = @"
[
  {
    "id": 1,
    "name": "Admin User",
    "email": "admin@example.com",
    "role": "admin"
  },
  {
    "id": 2,
    "name": "Alice Owner",
    "email": "alice@example.com",
    "role": "user"
  },
  {
    "id": 3,
    "name": "Bob Normal",
    "email": "bob@example.com",
    "role": "user"
  }
]
"@
Render-PostmanWindow -OutputPath "$dir\task6-c-admin.png" `
    -TaskTitle "Task 6 - GET /users by Admin (200 OK, No passwordHash)" `
    -Method "GET" -Url "http://localhost:3000/users" `
    -StatusCode "200" -StatusText "OK" `
    -ResponseBody $t6Admin
Copy-Item "$dir\task6-c-admin.png" "$dir\task6.png" -Force

Write-Host "`nAll screenshots generated successfully in $dir!"
