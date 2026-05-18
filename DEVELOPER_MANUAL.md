# Humateck Developer Manual

## Fixed Role Separation

Humateck is a delivery system.

- `order.html` / `ko/order.html`: visible order sheet only.
- `youtube-register.js`: YouTube registration delivery line only.
- Google: handles OAuth authentication.
- YouTube: handles the final registration response.
- Supabase: internal membership ledger only.

## Absolute Rule

Do not add logic that reviews, blocks, judges, corrects, rewrites, filters, or pre-validates customer content.

## Allowed in `youtube-register.js`

Only these actions are allowed:

1. Use the Google OAuth access token already obtained in the browser.
2. Read the customer-approved final text.
3. Convert the approved text into the YouTube `localizations` delivery structure.
4. Send it to the YouTube API.
5. Display the YouTube response.

## Forbidden Everywhere

Never add or reintroduce:

- internal review
- internal blocking
- metadata judgment
- format enforcement as a stop condition
- auto-correction
- customer text rewriting
- hidden/admin/test menus
- admin plan buttons linked to payment
- self-made pre-registration errors
- country/language quality judgment
- Gemini output quality judgment
- debug/payload output on customer screen

## Admin Rule

Admins must not use payment buttons for testing.

Admin access should be recognized by the internal membership ledger only:

- `admin_members.email`
- `admin_members.status = active`

When admin is active, the order page should apply a 70-country limit automatically.

## Customer Payment Rule

Customer plan buttons may lead to payment pages.
Payment completion and active membership recognition must be handled separately from admin testing.
Do not mix admin testing and customer payment flows.

## OAuth / Security Rule

Do not store customer OAuth tokens on Humateck servers.
Do not send customer OAuth tokens to Humateck servers.
The browser receives Google authorization and sends the approved content to YouTube.

## Gemini Command Rule

Gemini commands must be short and mechanical.
Do not add long explanations to Gemini commands.
Only the Command sequence may use numbers.
Do not number general page sections.

## Emergency Rule

If YouTube registration stops working, first inspect:

1. `youtube-register.js`
2. OAuth token receipt
3. YouTube API response

Do not blame YouTube before checking whether internal logic was added again.
