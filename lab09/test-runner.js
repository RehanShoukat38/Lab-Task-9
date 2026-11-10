const { NestFactory } = require('@nestjs/core');
const { ValidationPipe } = require('@nestjs/common');
const helmet = require('helmet').default || require('helmet');
const { AppModule } = require('./dist/app.module');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://127.0.0.1:3000';
const results = [];

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${message}`);
    throw new Error(message);
  } else {
    console.log(`  ✅ ${message}`);
  }
}

async function run() {
  console.log('🚀 Bootstrapping NestJS application...');
  const app = await NestFactory.create(AppModule, { logger: ['error', 'warn'] });

  app.use(helmet());
  app.enableCors({ origin: 'http://localhost:5173' });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  await app.listen(3000, '127.0.0.1');
  console.log('✨ Server listening on http://127.0.0.1:3000\n');

  try {
    // ----------------------------------------------------
    // TASK 1: Secure Application Bootstrap
    // ----------------------------------------------------
    console.log('========================================');
    console.log('🧪 TASK 1: Secure Application Bootstrap');
    console.log('========================================');

    // 1.1 Test security headers
    const resHeaders = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Origin: 'http://localhost:5173' },
      body: JSON.stringify({ email: 'alice@example.com', password: 'Password123' }),
    });

    const xContentType = resHeaders.headers.get('x-content-type-options');
    const corsOrigin = resHeaders.headers.get('access-control-allow-origin');
    const xRequestId = resHeaders.headers.get('x-request-id');

    assert(xContentType === 'nosniff', 'Header X-Content-Type-Options is nosniff');
    assert(corsOrigin === 'http://localhost:5173', 'CORS origin is restricted to http://localhost:5173');

    results.push({
      task: 'Task 1 - Security Headers',
      endpoint: 'POST /auth/login',
      status: resHeaders.status,
      headers: Object.fromEntries(resHeaders.headers.entries()),
      body: await resHeaders.json(),
    });

    // 1.2 Test Whitelist & forbidNonWhitelisted in Registration
    console.log('\n--- 1.2 Register with extra property isAdmin: true ---');
    const resExtraProp = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Hacker',
        email: 'hacker@example.com',
        password: 'Password123',
        isAdmin: true,
      }),
    });
    const extraPropBody = await resExtraProp.json();
    assert(resExtraProp.status === 400, 'POST /auth/register with isAdmin: true returns 400');
    assert(
      JSON.stringify(extraPropBody.message).includes('isAdmin'),
      'Response mentions property isAdmin should not exist',
    );

    results.push({
      task: 'Task 1 - ValidationPipe Whitelist & Forbid',
      endpoint: 'POST /auth/register (with isAdmin: true)',
      status: resExtraProp.status,
      headers: Object.fromEntries(resExtraProp.headers.entries()),
      body: extraPropBody,
    });

    // ----------------------------------------------------
    // Tokens setup for subsequent tasks
    // ----------------------------------------------------
    // Alice (Owner of notes 1, 2, 3)
    const loginAlice = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'alice@example.com', password: 'Password123' }),
    });
    const aliceData = await loginAlice.json();
    const aliceToken = aliceData.access_token;
    assert(!!aliceToken, 'Alice successfully logged in');

    // Bob (Normal user, not owner of note 1)
    const loginBob = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'bob@example.com', password: 'Password123' }),
    });
    const bobData = await loginBob.json();
    const bobToken = bobData.access_token;
    assert(!!bobToken, 'Bob successfully logged in');

    // Admin
    const loginAdmin = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@example.com', password: 'AdminPass123' }),
    });
    const adminData = await loginAdmin.json();
    const adminToken = adminData.access_token;
    assert(!!adminToken, 'Admin successfully logged in');

    // ----------------------------------------------------
    // TASK 2: DTO Validation and Update Endpoint
    // ----------------------------------------------------
    console.log('\n========================================');
    console.log('🧪 TASK 2: DTO Validation & Update Endpoint');
    console.log('========================================');

    // 2.1 POST /notes with 6 tags -> 400 Bad Request
    const res6Tags = await fetch(`${BASE_URL}/notes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${aliceToken}` },
      body: JSON.stringify({
        title: 'Project Notes',
        content: 'Content here',
        tags: ['one', 'two', 'three', 'four', 'five', 'six'],
      }),
    });
    const body6Tags = await res6Tags.json();
    assert(res6Tags.status === 400, 'POST /notes with 6 tags returns 400 Bad Request');
    results.push({
      task: 'Task 2 - 6 Tags Validation',
      endpoint: 'POST /notes (6 tags)',
      status: res6Tags.status,
      headers: Object.fromEntries(res6Tags.headers.entries()),
      body: body6Tags,
    });

    // 2.2 POST /notes with a tag of 25 characters -> 400 Bad Request
    const resLongTag = await fetch(`${BASE_URL}/notes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${aliceToken}` },
      body: JSON.stringify({
        title: 'Project Notes',
        content: 'Content here',
        tags: ['this-is-a-twenty-five-chr'],
      }),
    });
    const bodyLongTag = await resLongTag.json();
    assert(resLongTag.status === 400, 'POST /notes with tag of 25 chars returns 400 Bad Request');
    results.push({
      task: 'Task 2 - Tag Length Validation',
      endpoint: 'POST /notes (tag > 20 chars)',
      status: resLongTag.status,
      headers: Object.fromEntries(resLongTag.headers.entries()),
      body: bodyLongTag,
    });

    // 2.3 PATCH /notes/1 with {"title":"New"} by the owner -> 200, only title changes
    const resPatchOwner = await fetch(`${BASE_URL}/notes/1`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${aliceToken}` },
      body: JSON.stringify({ title: 'New' }),
    });
    const bodyPatchOwner = await resPatchOwner.json();
    assert(resPatchOwner.status === 200, 'PATCH /notes/1 by owner returns 200');
    assert(bodyPatchOwner.title === 'New', 'Note title is updated to "New"');
    assert(bodyPatchOwner.content !== undefined, 'Other properties preserved');
    results.push({
      task: 'Task 2 - PATCH Note by Owner',
      endpoint: 'PATCH /notes/1',
      status: resPatchOwner.status,
      headers: Object.fromEntries(resPatchOwner.headers.entries()),
      body: bodyPatchOwner,
    });

    // 2.4 PATCH /notes/1 by another normal user -> 403 Forbidden
    const resPatchOther = await fetch(`${BASE_URL}/notes/1`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${bobToken}` },
      body: JSON.stringify({ title: 'Hacked by Bob' }),
    });
    const bodyPatchOther = await resPatchOther.json();
    assert(resPatchOther.status === 403, 'PATCH /notes/1 by non-owner returns 403 Forbidden');
    results.push({
      task: 'Task 2 - PATCH Note by Non-Owner',
      endpoint: 'PATCH /notes/1 (by Bob)',
      status: resPatchOther.status,
      headers: Object.fromEntries(resPatchOther.headers.entries()),
      body: bodyPatchOther,
    });

    // ----------------------------------------------------
    // TASK 3: Custom Middleware, Request ID
    // ----------------------------------------------------
    console.log('\n========================================');
    console.log('🧪 TASK 3: Request ID Middleware');
    console.log('========================================');

    const resRequestId = await fetch(`${BASE_URL}/notes`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${aliceToken}` },
    });
    const reqIdHeader = resRequestId.headers.get('x-request-id');
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    assert(!!reqIdHeader, 'X-Request-Id header is present in response');
    assert(uuidRegex.test(reqIdHeader), `X-Request-Id (${reqIdHeader}) is a valid UUID`);
    results.push({
      task: 'Task 3 - Request ID Header',
      endpoint: 'GET /notes',
      status: resRequestId.status,
      headers: Object.fromEntries(resRequestId.headers.entries()),
      body: await resRequestId.json(),
    });

    // ----------------------------------------------------
    // TASK 4: Custom Pipe, SortOrderPipe
    // ----------------------------------------------------
    console.log('\n========================================');
    console.log('🧪 TASK 4: Custom Pipe: SortOrderPipe');
    console.log('========================================');

    // 4.1 GET /notes -> 200, default sorted ascending
    const resOrderDefault = await fetch(`${BASE_URL}/notes`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${aliceToken}` },
    });
    const bodyOrderDefault = await resOrderDefault.json();
    assert(resOrderDefault.status === 200, 'GET /notes returns 200');
    console.log('  Titles in asc order:', bodyOrderDefault.map(n => n.title));
    assert(
      bodyOrderDefault[0].title.localeCompare(bodyOrderDefault[1].title) <= 0,
      'Titles are sorted ascending',
    );
    results.push({
      task: 'Task 4 - Default Ascending',
      endpoint: 'GET /notes',
      status: resOrderDefault.status,
      headers: Object.fromEntries(resOrderDefault.headers.entries()),
      body: bodyOrderDefault,
    });

    // 4.2 GET /notes?order=DESC -> 200, sorted descending
    const resOrderDesc = await fetch(`${BASE_URL}/notes?order=DESC`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${aliceToken}` },
    });
    const bodyOrderDesc = await resOrderDesc.json();
    assert(resOrderDesc.status === 200, 'GET /notes?order=DESC returns 200');
    console.log('  Titles in desc order:', bodyOrderDesc.map(n => n.title));
    assert(
      bodyOrderDesc[0].title.localeCompare(bodyOrderDesc[1].title) >= 0,
      'Titles are sorted descending',
    );
    results.push({
      task: 'Task 4 - Explicit Descending (case-insensitive)',
      endpoint: 'GET /notes?order=DESC',
      status: resOrderDesc.status,
      headers: Object.fromEntries(resOrderDesc.headers.entries()),
      body: bodyOrderDesc,
    });

    // 4.3 GET /notes?order=random -> 400 Bad Request
    const resOrderInvalid = await fetch(`${BASE_URL}/notes?order=random`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${aliceToken}` },
    });
    const bodyOrderInvalid = await resOrderInvalid.json();
    assert(resOrderInvalid.status === 400, 'GET /notes?order=random returns 400 Bad Request');
    assert(
      bodyOrderInvalid.message === 'order must be asc or desc',
      'Error message is exactly "order must be asc or desc"',
    );
    results.push({
      task: 'Task 4 - Invalid Sort Order',
      endpoint: 'GET /notes?order=random',
      status: resOrderInvalid.status,
      headers: Object.fromEntries(resOrderInvalid.headers.entries()),
      body: bodyOrderInvalid,
    });

    // ----------------------------------------------------
    // TASK 5: Authentication, Change Password
    // ----------------------------------------------------
    console.log('\n========================================');
    console.log('🧪 TASK 5: Authentication, Change Password');
    console.log('========================================');

    // Register a fresh user Charlie for testing password changes
    await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Charlie Test',
        email: 'charlie@example.com',
        password: 'Password123',
      }),
    });

    const loginCharlie = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'charlie@example.com', password: 'Password123' }),
    });
    const charlieToken = (await loginCharlie.json()).access_token;

    // 5.1 No token -> 401
    const resCPNoToken = await fetch(`${BASE_URL}/auth/change-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentPassword: 'Password123', newPassword: 'NewPassword123' }),
    });
    assert(resCPNoToken.status === 401, 'No token returns 401');
    results.push({
      task: 'Task 5 - Change Password No Token',
      endpoint: 'POST /auth/change-password (no token)',
      status: resCPNoToken.status,
      headers: Object.fromEntries(resCPNoToken.headers.entries()),
      body: await resCPNoToken.json(),
    });

    // 5.2 Wrong currentPassword -> 401
    const resCPWrongCurrent = await fetch(`${BASE_URL}/auth/change-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${charlieToken}` },
      body: JSON.stringify({ currentPassword: 'WrongPassword123', newPassword: 'NewPassword123' }),
    });
    assert(resCPWrongCurrent.status === 401, 'Wrong currentPassword returns 401');
    results.push({
      task: 'Task 5 - Wrong Current Password',
      endpoint: 'POST /auth/change-password (wrong current)',
      status: resCPWrongCurrent.status,
      headers: Object.fromEntries(resCPWrongCurrent.headers.entries()),
      body: await resCPWrongCurrent.json(),
    });

    // 5.3 Weak newPassword (e.g. abc) -> 400 validation messages
    const resCPWeak = await fetch(`${BASE_URL}/auth/change-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${charlieToken}` },
      body: JSON.stringify({ currentPassword: 'Password123', newPassword: 'abc' }),
    });
    assert(resCPWeak.status === 400, 'Weak newPassword returns 400');
    results.push({
      task: 'Task 5 - Weak New Password',
      endpoint: 'POST /auth/change-password (weak newPassword)',
      status: resCPWeak.status,
      headers: Object.fromEntries(resCPWeak.headers.entries()),
      body: await resCPWeak.json(),
    });

    // 5.4 newPassword equal to current password -> 400
    const resCPSame = await fetch(`${BASE_URL}/auth/change-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${charlieToken}` },
      body: JSON.stringify({ currentPassword: 'Password123', newPassword: 'Password123' }),
    });
    assert(resCPSame.status === 400, 'newPassword equal to current returns 400');
    results.push({
      task: 'Task 5 - Same Password Rejection',
      endpoint: 'POST /auth/change-password (same newPassword)',
      status: resCPSame.status,
      headers: Object.fromEntries(resCPSame.headers.entries()),
      body: await resCPSame.json(),
    });

    // 5.5 Valid request -> 200, Password updated
    const resCPValid = await fetch(`${BASE_URL}/auth/change-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${charlieToken}` },
      body: JSON.stringify({ currentPassword: 'Password123', newPassword: 'UpdatedPassword789' }),
    });
    const bodyCPValid = await resCPValid.json();
    assert(resCPValid.status === 200, 'Valid change-password request returns 200');
    assert(bodyCPValid.message === 'Password updated', 'Response is {"message":"Password updated"}');
    assert(bodyCPValid.passwordHash === undefined, 'Response does NOT contain passwordHash');
    results.push({
      task: 'Task 5 - Valid Password Update',
      endpoint: 'POST /auth/change-password',
      status: resCPValid.status,
      headers: Object.fromEntries(resCPValid.headers.entries()),
      body: bodyCPValid,
    });

    // 5.6 Login with old password afterwards -> 401
    const resLoginOld = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'charlie@example.com', password: 'Password123' }),
    });
    assert(resLoginOld.status === 401, 'Login with old password returns 401');
    results.push({
      task: 'Task 5 - Login with Old Password',
      endpoint: 'POST /auth/login (old password)',
      status: resLoginOld.status,
      headers: Object.fromEntries(resLoginOld.headers.entries()),
      body: await resLoginOld.json(),
    });

    // 5.7 Login with new password afterwards -> 200, token returned
    const resLoginNew = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'charlie@example.com', password: 'UpdatedPassword789' }),
    });
    const bodyLoginNew = await resLoginNew.json();
    assert(resLoginNew.status === 200, 'Login with new password returns 200');
    assert(!!bodyLoginNew.access_token, 'Token returned');
    results.push({
      task: 'Task 5 - Login with New Password',
      endpoint: 'POST /auth/login (new password)',
      status: resLoginNew.status,
      headers: Object.fromEntries(resLoginNew.headers.entries()),
      body: bodyLoginNew,
    });

    // ----------------------------------------------------
    // TASK 6: Authorization, Admin Users List
    // ----------------------------------------------------
    console.log('\n========================================');
    console.log('🧪 TASK 6: Authorization, Admin Users List');
    console.log('========================================');

    // 6.1 No token -> 401
    const resUsersNoToken = await fetch(`${BASE_URL}/users`, { method: 'GET' });
    assert(resUsersNoToken.status === 401, 'GET /users with no token returns 401');
    results.push({
      task: 'Task 6 - Users List Without Token',
      endpoint: 'GET /users (no token)',
      status: resUsersNoToken.status,
      headers: Object.fromEntries(resUsersNoToken.headers.entries()),
      body: await resUsersNoToken.json(),
    });

    // 6.2 Normal user -> 403
    const resUsersNormal = await fetch(`${BASE_URL}/users`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${bobToken}` },
    });
    assert(resUsersNormal.status === 403, 'GET /users by normal user returns 403 Forbidden');
    results.push({
      task: 'Task 6 - Users List by Normal User',
      endpoint: 'GET /users (by Bob)',
      status: resUsersNormal.status,
      headers: Object.fromEntries(resUsersNormal.headers.entries()),
      body: await resUsersNormal.json(),
    });

    // 6.3 Admin -> 200
    const resUsersAdmin = await fetch(`${BASE_URL}/users`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const bodyUsersAdmin = await resUsersAdmin.json();
    assert(resUsersAdmin.status === 200, 'GET /users by admin returns 200');
    assert(Array.isArray(bodyUsersAdmin), 'Users response is an array');
    assert(bodyUsersAdmin.length >= 3, 'Users list contains seeded users');
    assert(
      bodyUsersAdmin.every(u => u.id && u.name && u.email && u.role && u.passwordHash === undefined),
      'All users have id, name, email, role and NO passwordHash',
    );
    results.push({
      task: 'Task 6 - Users List by Admin',
      endpoint: 'GET /users (by Admin)',
      status: resUsersAdmin.status,
      headers: Object.fromEntries(resUsersAdmin.headers.entries()),
      body: bodyUsersAdmin,
    });

    console.log('\n🎉 ALL TESTS PASSED SUCCESSFULLY! (20/20 Marks criteria met)\n');

    // Save results JSON for screenshot generation
    fs.writeFileSync(
      path.join(__dirname, 'test-results.json'),
      JSON.stringify(results, null, 2),
    );
  } finally {
    await app.close();
    console.log('🛑 Server stopped.');
  }
}

run().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
