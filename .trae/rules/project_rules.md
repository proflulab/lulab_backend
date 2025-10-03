# LuLab Backend Project Rules

## Project Overview

LuLab Backend is a NestJS-based meeting and user service backend that provides user authentication (JWT), verification codes (email/SMS), email services, meeting record management and statistics, and integrates with Tencent Meeting Webhook/Open API and Feishu Bitable synchronization. The data layer uses Prisma + PostgreSQL.

**Tech Stack:** NestJS + TypeScript + Prisma ORM + PostgreSQL + Swagger + Jest

## Code Standards & Conventions

### 1. Naming Conventions

- **Files & Directories**: kebab-case
  - Example: `user-profile.service.ts`, `auth.controller.ts`
- **Classes & Interfaces**: PascalCase
  - Example: `UserService`, `AuthGuard`, `IUserProfile`
- **Variables & Methods**: camelCase
  - Example: `getUserById()`, `isAuthenticated`, `userId`
- **Constants**: UPPER_SNAKE_CASE
  - Example: `JWT_SECRET`, `MAX_RETRY_COUNT`
- **File Suffixes**:
  - DTOs: `*.dto.ts`
  - Exceptions: `*.exception.ts`
  - Decorators: `*.decorator.ts`
  - Types: `*.types.ts`
  - Enums: `*.enum.ts`
  - Configs: `*.config.ts`

### 2. Code Formatting

- **Indentation**: 2 spaces (enforced by Prettier)
- **Quotes**: Single quotes (`'`) for strings
- **Trailing Commas**: Always use trailing commas
- **Line Length**: Keep lines under 120 characters when possible
- **Semicolons**: Always use semicolons

### 3. TypeScript Standards

- Use TypeScript strict mode
- Avoid `any` type - use specific types or `unknown`
- Use proper type annotations for function parameters and return values
- Leverage TypeScript's type inference where appropriate
- Use interfaces for object shapes, types for unions/primitives

## Project Structure

```
src/
├── auth/                    # Authentication module
│   ├── controllers/          # HTTP controllers
│   ├── services/            # Business logic (split by use case)
│   ├── repositories/        # Data access layer
│   ├── dto/                 # Data transfer objects
│   ├── enums/               # Enumerations
│   └── types/               # TypeScript type definitions
├── meeting/                 # Meeting management module
├── user/                    # User management module
├── verification/            # Verification codes module
├── mail/                    # Email service module
├── tencent-meeting/         # Tencent Meeting integration
├── lark-meeting/            # Lark/Feishu integration
├── integrations/            # Third-party API integrations
├── common/                  # Shared utilities, decorators, guards
├── configs/                 # Configuration modules
├── prisma/                  # Database layer
└── redis/                   # Redis service
```

### Module Organization Rules

1. **Each module should contain**:
   - `controllers/` - HTTP request handlers
   - `services/` - Business logic (split by use case)
   - `repositories/` - Data access layer
   - `dto/` - Request/response DTOs
   - `types/` - TypeScript type definitions
   - `enums/` - Enumeration definitions
   - `exceptions/` - Custom exceptions

2. **Service Layer Rules**:
   - Split services by use case (e.g., `register.service.ts`, `login.service.ts`)
   - Keep services focused on single responsibility
   - Use dependency injection for external dependencies
   - Place shared utilities in `utils/` subdirectory

3. **Repository Layer Rules**:
   - One repository per entity
   - Handle all database operations
   - Return typed entities, not raw database results
   - Use Prisma's type-safe queries

## Development Guidelines

### 1. API Design

- **RESTful Principles**: Follow RESTful conventions for endpoint design
- **Versioning**: Use `/api/v1/` prefix for API versioning
- **HTTP Methods**: Use appropriate HTTP methods (GET, POST, PUT, DELETE)
- **Status Codes**: Return appropriate HTTP status codes
- **Error Handling**: Use consistent error response format
- **Swagger Documentation**: Document all endpoints with Swagger decorators

### 2. Authentication & Authorization

- **JWT Tokens**: Use JWT for stateless authentication
- **Token Structure**: Include `jti` (JWT ID) for token revocation
- **Blacklisting**: Implement token blacklist for logout functionality
- **Guards**: Use NestJS guards for route protection
- **Decorators**: Create custom decorators for user data extraction

### 3. Database Practices

- **Prisma ORM**: Use Prisma for all database operations
- **Migrations**: Use migrations for schema changes in production
- **Seeding**: Use seed data for development/testing
- **Relationships**: Define proper relationships in Prisma schema
- **Indexes**: Add database indexes for frequently queried fields

### 4. Integration Patterns

- **Webhook Handling**: Implement proper webhook signature verification
- **API Rate Limiting**: Respect third-party API rate limits
- **Error Handling**: Implement proper error handling for external APIs
- **Retry Logic**: Implement exponential backoff for failed requests
- **Logging**: Log all external API interactions

## Testing Standards

### 1. Test Structure

- **Unit Tests**: `src/**/*.spec.ts`
- **Integration Tests**: `test/integration/**/*.int-spec.ts`
- **End-to-End Tests**: `test/e2e/**/*.e2e-spec.ts`
- **System Tests**: `test/system/**/*.spec.ts`

### 2. Testing Rules

- **Coverage**: Maintain minimum 80% code coverage
- **Mocking**: Mock external dependencies in unit tests
- **Test Data**: Use fixtures for consistent test data
- **Test Naming**: Use descriptive test names that explain the scenario
- **Arrange-Act-Assert**: Follow AAA pattern for test structure

### 3. Test Commands

```bash
# Run all tests
pnpm test:all

# Run specific test suites
pnpm test:unit
pnpm test:integration
pnpm test:e2e
pnpm test:system

# Run tests with coverage
pnpm test:cov

# CI mode (all tests with coverage)
pnpm test:ci
```

## Code Quality & Linting

### 1. ESLint Rules

- Use `@typescript-eslint` for TypeScript-specific rules
- Enable Prettier integration for consistent formatting
- Configure rules for NestJS best practices
- Disable `no-explicit-any` (use `unknown` instead)

### 2. Pre-commit Checks

Always run before committing:
```bash
pnpm lint          # ESLint checks and fixes
pnpm format        # Prettier formatting
pnpm test:unit     # Unit tests
```

### 3. Code Review Guidelines

- Review for security vulnerabilities
- Check for proper error handling
- Verify API documentation updates
- Ensure test coverage for new features
- Validate database schema changes

## Security Guidelines

### 1. Environment Variables

- **Never commit `.env` files**
- Use `.env.example` as template for new environments
- Document all required environment variables
- Use strong, random values for secrets
- Rotate secrets regularly in production

### 2. Authentication Security

- Use strong JWT secrets (minimum 32 characters)
- Implement proper token expiration times
- Use secure password hashing (bcrypt)
- Implement rate limiting for auth endpoints
- Log authentication failures for security monitoring

### 3. API Security

- Validate all input data using DTOs
- Implement proper CORS configuration
- Use HTTPS in production
- Implement request rate limiting
- Sanitize user inputs to prevent injection attacks

### 4. Database Security

- Use connection encryption (SSL/TLS)
- Implement proper database user permissions
- Never expose database credentials in code
- Use parameterized queries (Prisma handles this)
- Regular database backups with `pnpm db:backup`

## Integration Guidelines

### 1. Tencent Meeting Integration

- Implement proper webhook signature verification
- Handle API rate limits appropriately
- Configure server IP whitelist in Tencent console
- Implement proper error handling for API failures
- Log all webhook events for debugging

### 2. Lark/Feishu Integration

- Implement proper app authentication
- Handle webhook events appropriately
- Implement Bitable synchronization logic
- Handle API errors and retry mechanisms
- Log all integration activities

### 3. Email Service

- Use SMTP for email delivery
- Implement email template system
- Handle email delivery failures
- Implement rate limiting for email sending
- Log email sending activities

### 4. SMS Service

- Use Alibaba Cloud SMS service
- Implement template-based SMS sending
- Handle SMS delivery failures
- Implement rate limiting for SMS sending
- Log SMS sending activities

## Deployment Guidelines

### 1. Build Process

```bash
# Development
pnpm start:dev

# Production build
pnpm build
pnpm start:prod
```

### 2. Database Deployment

```bash
# Generate Prisma client
pnpm db:generate

# Run migrations (production)
pnpm db:migrate

# Push schema changes (development)
pnpm db:push
```

### 3. Environment Configuration

- Use environment-specific configuration files
- Implement proper secret management
- Use health checks for service monitoring
- Implement proper logging configuration
- Configure appropriate resource limits

## Git & Commit Standards

### 1. Commit Message Format

Use Conventional Commits specification:
```
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Test additions or modifications
- `chore`: Build process or auxiliary tool changes

Examples:
```
feat(auth): add JWT token refresh endpoint
fix(meeting): resolve timezone issue in meeting scheduling
docs(api): update Swagger documentation for user endpoints
```

### 2. Branch Naming

- Feature branches: `feature/description`
- Bug fix branches: `fix/description`
- Hotfix branches: `hotfix/description`
- Release branches: `release/version`

### 3. Pull Request Guidelines

- Provide clear description of changes
- Reference related issues
- Include API documentation updates if applicable
- Ensure all tests pass
- Include screenshots for UI changes
- Request review from relevant team members

## Documentation Standards

### 1. API Documentation

- Use Swagger/OpenAPI for API documentation
- Document all endpoints with proper descriptions
- Include request/response examples
- Document error responses
- Keep documentation synchronized with code changes

### 2. Code Documentation

- Use JSDoc comments for public methods
- Document complex business logic
- Include examples for utility functions
- Document configuration options
- Keep README files up to date

### 3. Architecture Documentation

- Document system architecture in `/docs`
- Include integration setup guides
- Document deployment procedures
- Include troubleshooting guides
- Keep architecture diagrams current

## Performance Guidelines

### 1. Database Performance

- Use appropriate database indexes
- Implement pagination for large datasets
- Optimize query performance
- Use database connection pooling
- Monitor query execution times

### 2. API Performance

- Implement response caching where appropriate
- Use compression for API responses
- Implement request rate limiting
- Optimize JSON serialization
- Monitor API response times

### 3. Memory Management

- Avoid memory leaks in long-running processes
- Implement proper cleanup in services
- Use appropriate data structures
- Monitor memory usage
- Implement proper error handling to prevent crashes

## Monitoring & Logging

### 1. Logging Standards

- Use structured logging format
- Include correlation IDs for request tracking
- Log at appropriate levels (error, warn, info, debug)
- Include context information in logs
- Avoid logging sensitive information

### 2. Error Tracking

- Implement proper error handling
- Log stack traces for debugging
- Use error tracking services
- Monitor error rates
- Implement alerting for critical errors

### 3. Performance Monitoring

- Monitor API response times
- Track database query performance
- Monitor external service integrations
- Implement health check endpoints
- Set up performance dashboards

## Troubleshooting Guidelines

### 1. Common Issues

- **Database Connection**: Check DATABASE_URL configuration
- **JWT Issues**: Verify JWT_SECRET and token expiration
- **Email Sending**: Check SMTP configuration and credentials
- **SMS Issues**: Verify Alibaba Cloud credentials and templates
- **Integration Errors**: Check API keys and webhook configurations

### 2. Debug Commands

```bash
# Check application logs
pnpm start:dev

# Run specific tests for debugging
pnpm test -- --testNamePattern="specific test"

# Validate external API configurations
pnpm validate:tencent-api

# Database debugging
pnpm db:studio
```

### 3. Support Resources

- Check existing documentation in `/docs` directory
- Review API documentation at `/api` endpoint
- Check application logs for error details
- Verify environment configuration
- Test integrations with provided validation tools

---

**Remember**: These rules are designed to maintain code quality, security, and consistency across the project. Always follow these guidelines and update them as the project evolves.