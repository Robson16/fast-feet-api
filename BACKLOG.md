# FastFeet API Backlog

## Current Implementation Snapshot

- The only HTTP endpoint currently registered is `POST /accounts`.
- Application use cases already exist for user registration, authentication, editing, deletion, and password updates; destination creation, lookup by ID, editing, and deletion; and parcel creation, lookup, deletion, status transitions, and selected parcel queries.
- JWT authentication infrastructure and a global authentication guard are already configured. Role-based authorization is not implemented.
- Prisma persistence is currently wired only for users. Packet and destination repository abstractions have in-memory test implementations but no Prisma adapters registered for runtime use.
- The Prisma schema includes a `Notification` model, but there are no notification use cases, repositories, or routes. Parcel photo storage is not modeled.

## Epic 1: Secure Authentication and User Management

### Story 1.1: Prevent privilege escalation during public registration (P0)

As a system owner, I want public account registration to assign only a safe default role so that anonymous users cannot create administrator or recipient accounts. 

- [x] Ignore or reject `role` in public registration requests and always assign `DELIVERER`.
- [x] Provide a separate, authenticated administrator workflow for assigning elevated roles.
- [x] Add tests proving an anonymous request cannot create an `ADMIN` or `RECIPIENT` account.

### Story 1.2: Add a secure administrator provisioning path (P1)

As an operator, I want a secure way to create the first administrator so that role restrictions do not leave the system without an administrator.

- [x] Provide a documented seed, CLI command, or deployment-time provisioning mechanism.
- [x] Never expose initial administrator creation through the public registration endpoint.
- [x] Verify that credentials are hashed and provisioning is safe to repeat or fails clearly when an administrator already exists.

### Story 1.3: Expose user authentication (P1)

As a user, I want to sign in with my CPF and password so that I can receive an access token and use protected endpoints.

- [ ] Add a public session/login endpoint backed by `AuthenticateUserUseCase`.
- [ ] Return a JWT signed with the existing RS256 configuration and a documented response shape.
- [ ] Return consistent unauthorized responses for invalid credentials and add E2E coverage.

### Story 1.4: Add role-based authorization (P1)

As a system owner, I want routes to enforce the user's role so that users can only perform operations permitted to their role.

- [ ] Add route metadata and a guard for role policies; authentication alone is not sufficient.
- [ ] Restrict user and destination administration to administrators, and parcel administration to administrators and deliverers.
- [ ] Ensure recipients can access only their own account, destination, parcels, and notifications; deliverers can access only parcels assigned to them where applicable.
- [ ] Add tests for unauthenticated, forbidden-role, and cross-user access attempts.

### Story 1.5: Expose user management and password operations (P1)

As an administrator or account owner, I want the existing user operations available through HTTP so that user accounts can be managed safely.

- [ ] Add authenticated endpoints for editing and deleting users, backed by the existing use cases.
- [ ] Add user lookup/listing support for the required read operations; the current repository has no list method or list use case.
- [ ] Add a password-change endpoint backed by `UpdateUserPasswordUseCase`, scoped to the authenticated account unless an administrator is acting.
- [ ] Validate request payloads, prevent password hashes from appearing in responses, document routes, and test authorization and error cases.

### Story 1.6: List a user's parcels (P1)

As a recipient or deliverer, I want to see parcels associated with my account so that I can track only the deliveries relevant to me.

- [ ] Add the missing user-parcel query/use case and repository support.
- [ ] Expose a protected endpoint that derives the user identity from the JWT rather than trusting an arbitrary user ID in the request.
- [ ] Add tests proving users cannot retrieve another user's parcels.

## Epic 2: Persist and Expose Destinations

### Story 2.1: Add Prisma repositories for destinations and packets (P1)

As an API operator, I want destination and packet operations backed by PostgreSQL so that the existing application use cases work outside tests.

- [ ] Implement Prisma adapters and mappers for `DestinationsRepository` and `PacketsRepository`.
- [ ] Support relations and query behavior required by the interfaces, including packet details, status queries, filters, nearby queries, pagination, save, and delete.
- [ ] Register and export both repositories from the database module.
- [ ] Add repository integration tests against the configured test database.

### Story 2.2: Expose destination CRUD routes (P1)

As an administrator, I want to create, read, update, and delete destinations so that recipient addresses can be managed through the API.

- [ ] Add create, get-by-ID, update, and delete endpoints backed by the existing destination use cases.
- [ ] Add a paginated destination listing operation; the current repository and use cases support lookup by ID only.
- [ ] Validate recipient IDs, address fields, and coordinates, and enforce administrator-only access.
- [ ] Document routes in Swagger and cover success, validation, not-found, and forbidden responses with E2E tests.

## Epic 3: Expose and Complete Parcel Management

### Story 3.1: Expose parcel creation, lookup, and deletion (P1)

As an administrator, I want to create, inspect, and delete parcels through HTTP so that the core parcel lifecycle is available to API clients.

- [ ] Add create, get-by-ID, and delete endpoints backed by the existing parcel use cases.
- [ ] Enforce administrator-only creation and deletion and the appropriate access policy for parcel details.
- [ ] Validate destination references and map domain errors to consistent HTTP responses.
- [ ] Add Swagger documentation and E2E tests.

### Story 3.2: Expose parcel status transitions (P1)

As an authorized user, I want to perform valid parcel status transitions so that pickup, return, and delivery progress can be tracked.

- [ ] Add endpoints for awaiting pickup, withdrawal, return, and delivery backed by the existing transition use cases.
- [ ] Enforce the existing rule that only the deliverer who withdrew a parcel can mark it as delivered.
- [ ] Enforce role and ownership policies at the HTTP boundary and prevent invalid or repeated transitions.
- [ ] Add tests for every transition, including missing parcels, unavailable parcels, wrong deliverers, and invalid states.

### Story 3.3: Complete parcel search and listing (P1)

As an administrator or deliverer, I want to list parcels by status, owner, neighborhood, and proximity so that I can find the parcels relevant to my work.

- [ ] Expose the existing awaiting, delivered-by-deliverer, withdrawn-by-deliverer, and nearby-by-deliverer queries.
- [ ] Add a returned-parcels query and any missing generic status query required by the documented filters.
- [ ] Support pagination and documented neighborhood, city/state, deliverer, status, and geographic filters without allowing cross-deliverer data access.
- [ ] Add tests for filters, pagination boundaries, empty results, and access isolation.

### Story 3.4: Require a delivery photo (P1)

As a recipient, I want proof of delivery attached to a completed parcel so that delivery completion can be verified.

- [ ] Decide on an image storage mechanism and persist a photo reference with the parcel or delivery record.
- [ ] Accept and validate a photo or secure photo reference when marking a parcel as delivered.
- [ ] Reject delivery completion when the required photo is missing or invalid.
- [ ] Add tests for valid uploads/references, invalid content, and missing photos.

## Epic 4: Notify Recipients

### Story 4.1: Create notifications for parcel status changes (P1)

As a recipient, I want a notification whenever my parcel changes status so that I stay informed about its progress.

- [ ] Add notification domain entities/use cases and a repository implementation using the existing `Notification` table.
- [ ] Create a notification for the parcel recipient after each successful status transition.
- [ ] Ensure notification creation is reliable and does not produce duplicates when a transition fails or is retried.
- [ ] Test notification creation for all status transitions.

### Story 4.2: Expose recipient notification management (P2)

As a recipient, I want to list my notifications and mark them as read so that I can manage delivery updates.

- [ ] Add protected list and mark-as-read endpoints using the authenticated recipient identity.
- [ ] Prevent recipients from reading or changing another recipient's notifications.
- [ ] Support pagination and test ownership, unread/read state, and not-found behavior.

## Epic 5: Complete API Documentation and Verification

### Story 5.1: Document all public API routes in Swagger (P1)

As an API consumer, I want accurate OpenAPI documentation so that I can integrate with the available endpoints.

- [ ] Add request, response, authentication, role, and error schemas for every implemented route.
- [ ] Keep the documented status values and role options aligned with the application domain.
- [ ] Verify the Swagger UI at `/api` and the generated OpenAPI document in an automated test or smoke check.

### Story 5.2: Add end-to-end coverage for the complete API (P1)

As a maintainer, I want E2E coverage for all routes so that regressions in validation, persistence, authentication, and authorization are caught.

- [ ] Add E2E suites for authentication, user management, destinations, parcels, and notifications.
- [ ] Cover success paths, validation errors, not-found responses, conflicts, unauthorized access, and forbidden access.
- [ ] Ensure test data and database cleanup are isolated and deterministic.

## Epic 6: Align Developer Documentation

### Story 6.1: Correct setup instructions and document API entry points (P2)

As a developer, I want accurate local setup instructions so that I can run and explore the API without guessing.

- [ ] Update the README clone URL to the current repository URL.
- [ ] Replace the documented `npm run start:dev` command with the available development script, `npm run dev`.
- [ ] Correct the documented application port to `3333` and add the Swagger UI URL at `/api`.
- [ ] Keep setup, migration, test, and environment-variable instructions aligned with the current scripts and configuration.
