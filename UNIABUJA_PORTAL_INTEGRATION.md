# Student verification via the University of Abuja portal — what to request

There is **no public API** on the UniAbuja student portal, and scraping it / logging in on
students' behalf is brittle, against the portal's terms, and a security risk (it would mean
handling students' portal passwords). The proper path is an **official integration** granted by
**UniAbuja ICT / the Registrar**. Use the request below.

## What to ask ICT for (any ONE of these is enough)

1. **A read-only verification API** (best): an endpoint we can call with a matric number that
   returns `{ valid: true, fullName, department, level, status }`. Secured with an API key /
   OAuth client credential issued to this project.
2. **A periodic data export** (simplest for them): a signed CSV/JSON of currently-enrolled
   students (matric, name, department, level, status), refreshed each semester. We verify
   sign‑ups against it. No live connection needed.
3. **SSO / OAuth** (best UX): let students "Sign in with their UniAbuja account" so identity is
   proven by the portal itself (OpenID Connect / SAML).

## Details to include in the request

- **Project:** "Online Class" — a lecture‑delivery platform for UniAbuja (live classes,
  materials, attendance). Built by Divine Evna Olong.
- **Purpose:** confirm that a person signing up is a genuine, currently‑enrolled student.
- **Data needed:** matric number + name + department/level + enrolment status. **No grades,
  no financials, no passwords.**
- **Security:** HTTPS only; API key/OAuth secret stored server‑side; data used only for
  verification; compliant with the **NDPR**.
- **Contact:** the project email + this repository.

## Fallbacks until ICT responds (we can build these now)

- **Matric allowlist** — ICT/registrar gives a CSV of valid matric numbers; we check sign‑ups
  against it. (Effectively option 2 above, manual.)
- **University email** — require an `@uniabuja.edu.ng` address + email confirmation link.
- **Lecturer approval** — a lecturer approves each student's enrolment request.

> Recommended sequence: send the request to ICT for option 1 or 3; meanwhile turn on the
> **matric allowlist** fallback so verification works immediately.
