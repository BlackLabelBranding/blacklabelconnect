# Black Label Connect messaging implementation plan

## Verified baseline (2026-11-06)
- Mobile Inbox and threads are read-only and use `mobile_employee_inbox_v2` / `mobile_employee_inbox_thread`.
- Hub Communications invokes the production Supabase Edge Function `send-twilio-message` with `to`, `body`, `display_name`, `purpose`, `sender_user_id`, `sender_name`, `sender_type`, `media_urls`, and `media_type`.
- Production function `send-twilio-message` currently reports `verify_jwt=false`. Source inspection through the Supabase connector failed. **Do not expose this endpoint to Connect until server-side authorization is verified and hardened.**
- Hub stores SMS in `hub_conversations` and `hub_messages`; existing group marketing tables are not proof of group SMS transport.

## Phase 1 — Authorized one-to-one SMS replies
1. Audit deployed `send-twilio-message` implementation and its auth/fallback behavior. Require a verified user identity and server-side Communications capability; never trust `sender_user_id`, `sender_name`, or phone ownership from client payloads.
2. Build a narrow authenticated send endpoint, or harden/reuse the Hub endpoint, with conversation ID, body, and idempotency key. Resolve destination number from the authorized conversation server-side. Enforce recipient validation, rate limits, audit records, and delivery status.
3. Add mobile composer, disabled-while-sending state, error/retry feedback, and refresh after successful send. Do not mark 'delivered' merely because the provider accepted a request.
4. Test denied unauthenticated/non-communications roles, permitted employee, invalid/archived conversation, duplicate request, provider failure, and designated test number before release.

## Phase 2 — Internal employee groups
- Distinct authenticated in-app conversations; no SMS required.
- Tables: internal_rooms, internal_room_members, internal_room_messages, internal_message_reads (names provisional).
- Membership-based RLS, invitation/member management, per-room permissions, and unread counts.
- Staff-only groups (e.g. Operations, Events, Sales); no automatic access to all rooms for every employee.

## Phase 3 — External group messaging
- **Broadcast**: separate one-to-one SMS per recipient, private replies routed to each individual Hub thread. Consent/opt-out enforcement, suppression list, quiet hours, rate limits, cost estimates, campaign audit, and A2P registration checks.
- **Managed group conversation**: one shared thread in Connect, with server-side per-recipient delivery and participant-visible replies only where participants explicitly consent to shared visibility. Standard Twilio SMS does not natively provide iMessage-style multi-party group MMS.
- Separate group membership and campaign records from Hub one-to-one conversations. Never reuse internal room membership for external recipients.
- Explicit send confirmation for multi-recipient actions and limits to avoid accidental mass sends.

## Release gates
- No production SMS sends during implementation without an approved test number and authorized employee session.
- No database changes or sending behavior in this planning PR.
- Production migration, frontend changes, and server authorization changes should be separately reviewable and tested.
