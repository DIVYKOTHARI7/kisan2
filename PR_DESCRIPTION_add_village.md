## Summary

Add `village` (city) support to user profiles so frontend can persist selected location.

## What I changed

- backend/app/models/user.py
  - Added `village = Column(String)` to `User` model.
- backend/app/api/v1/endpoints/auth.py
  - Added `PUT /auth/profile` endpoint to update allowed profile fields (includes `village`).
  - `GET /auth/profile` unchanged but now frontend can rely on `village` when present in DB.
- backend/alembic/versions/20260428_add_village_column.py
  - Alembic migration to add `village` column to `users` table (upgrade/downgrade included).

## Database migration

Run from backend workspace (ensure proper DB URL):

```bash
alembic upgrade head
```

(Or run the specific revision: `alembic upgrade 20260428_add_village_column`)

## Notes / Testing

- The new `PUT /auth/profile` expects a JSON payload with any of these keys: `name`, `village`, `district`, `state`, `pincode`, `land_acres`, `soil_type`, `primary_crops` (array), `preferred_language`.
- After migration, the frontend `updateProfile` call will be able to persist `village`.
- Manual test:
  1. Run backend and apply migration.
  2. Log in (or create a user via OTP flow) and call `PUT /auth/profile` with `{"village":"Palwal"}` and valid `Authorization: Bearer <token>`.
  3. Call `GET /auth/profile` to confirm `profile.village` contains the value.

## Potential follow-ups

- Add input validation and Pydantic schemas for profile payloads.
- Add API unit tests for profile update endpoint.
- Add migration to set default `village` values for existing users if desired.

## Reviewer checklist

- [ ] Migration reviewed and `down_revision` correct for the project's migration history.
- [ ] Endpoint security/authorization reviewed.
- [ ] Frontend `updateProfile` integration tested.
