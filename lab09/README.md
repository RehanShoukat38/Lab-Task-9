# Lab 09: Security, Middleware, Guards and Pipes

Department of Computer Science  
CS-301L: Full Stack Web Development (Lab)  
Air University, Islamabad  

---

## Project Overview
This project implements enterprise-grade security and request-lifecycle patterns in NestJS:
- **Task 1**: Secure application bootstrap with **Helmet**, restricted **CORS** (`http://localhost:5173`), and global **ValidationPipe** (`whitelist`, `forbidNonWhitelisted`, `transform`).
- **Task 2**: DTO validation with `@nestjs/mapped-types`, `CreateNoteDto` (with tags validation), `UpdateNoteDto` using `PartialType`, and `PATCH /notes/:id` with ownership/admin checks.
- **Task 3**: Custom `RequestIdMiddleware` generating unique UUIDs via `crypto.randomUUID()`, attaching `X-Request-Id` response header, and formatting logs in `LoggerMiddleware` as `[<id>] METHOD URL -> STATUS (ms)`.
- **Task 4**: Custom `SortOrderPipe` handling `asc` and `desc` case-insensitively, defaulting missing values to `asc`, and throwing 400 for invalid values in `GET /notes?order=...`.
- **Task 5**: `POST /auth/change-password` endpoint protected by `AuthGuard`, verifying current password with bcrypt, enforcing password complexity, preventing reuse of the current password, and hashing the new password.
- **Task 6**: `GET /users` admin endpoint protected by `AuthGuard` and `RolesGuard` with `@Roles('admin')`, returning safe user profiles (`id`, `name`, `email`, `role`) without `passwordHash`.

---

## Reflection Questions & Answers

### 1. What is the difference between a 401 and a 403 response? Give one example from your project for each.
- **401 Unauthorized**: Indicates that the request lacks valid authentication credentials. The client's identity is unknown or could not be verified.  
  *Project Example*: Accessing `GET /notes` or `POST /auth/change-password` without an `Authorization: Bearer <token>` header, or providing an expired/tampered JWT token.
- **403 Forbidden**: Indicates that the client is authenticated and their identity is verified, but they do not possess sufficient authorization/permissions to access the requested resource.  
  *Project Example*: A regular user (`role: 'user'`) attempting to access `GET /users` (restricted to admins) or trying to update another user's note via `PATCH /notes/1`.

### 2. Why must validation happen on the server even when the front end already validates the form?
Client-side validation improves user experience by providing immediate feedback in the browser, but it offers zero security because it can be trivially bypassed using HTTP clients (like Postman or curl), browser dev tools, or malicious scripts. Server-side validation is mandatory as the authoritative boundary to enforce schema rules, strip/forbid unwanted properties (`forbidNonWhitelisted`), ensure data integrity, and protect the backend database and business logic from malformed payloads and injection attacks.

### 3. A JWT payload is readable by anyone. Why is the token still safe to use for authentication?
A JWT is encoded in Base64Url, meaning anyone can decode and read its payload, but it is cryptographically signed using a server-side secret key (or private key). If an attacker alters any claims in the payload (for instance, changing their `sub` ID or escalating their `role` from `'user'` to `'admin'`), the cryptographic signature will not match when verified by the server with `jwtService.verify()`, immediately invalidating the token. Thus, authenticity and integrity are mathematically guaranteed. Sensitive information (such as raw passwords) should never be stored in the payload.

### 4. Why does the login endpoint return the same error message for an unknown email and a wrong password?
Returning distinct error messages (e.g., "Email not found" versus "Wrong password") enables **user enumeration** attacks. An attacker could automate requests to discover which email addresses are registered on the platform and subsequently execute targeted credential stuffing or brute-force attacks against existing accounts. Returning a uniform message like `"Invalid email or password"` prevents attackers from verifying the existence of accounts.

### 5. In what order do middleware, guards and pipes run? Why must AuthGuard come before RolesGuard?
- **Execution Order**:
  1. **Middleware**: Executes first on the raw incoming request (e.g., `RequestIdMiddleware`, `LoggerMiddleware`).
  2. **Guards**: Execute next to enforce authentication and authorization policies (e.g., `AuthGuard`, `RolesGuard`).
  3. **Interceptors (Pre-handler)**: Bind extra logic before handler execution.
  4. **Pipes**: Execute immediately before the controller method, transforming and validating route parameters and body payloads (e.g., `ValidationPipe`, `PositiveIntPipe`, `SortOrderPipe`).
  5. **Route Handler**: Executes business logic.
  6. **Interceptors (Post-handler) & Exception Filters**: Format the response or handle exceptions.
- **Why AuthGuard must come before RolesGuard**:  
  `RolesGuard` verifies permissions by checking the authenticated user's role on `request.user`. `AuthGuard` is responsible for extracting the JWT token, validating it, and attaching `request.user = payload`. If `RolesGuard` were executed first, `request.user` would be `undefined`, making role verification impossible.
