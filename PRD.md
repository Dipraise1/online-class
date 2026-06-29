Product Requirements Document (PRD)
Online Class & Lecture Delivery Platform (OCLD) / UniAbuja Virtual Classroom
University of Abuja

1. Document Information
    •    Product Name: Online Class & Lecture Delivery Platform (OCLD) for University of Abuja
    •    Version: 1.0 (Draft)
    •    Author: Divine Evna Olong (Matric No: [redacted])
    •    Date: June 2026
    •    Status: Draft – Open for Stakeholder Review

2. Overview & Vision
The University of Abuja (UniAbuja / Yakubu Gowon University) currently delivers lectures primarily through physical, in-person classes. Students who miss lectures — due to long commutes, power outages, illness, overcrowded halls, or strikes — have no reliable way to recover what was taught. There is no consistent digital layer that records, stores, and re-delivers lectures and materials in a way that works within real Nigerian constraints: expensive mobile data, unstable electricity, and uneven internet bandwidth.

Vision: Build a secure, data-light, offline-capable online class platform that gives every physical lecture a digital counterpart students can access, review, and complete on their own schedule — without being defeated by data costs or power cuts.

Mission: Extend the physical classroom into a reliable digital one, eliminate the "I missed class and there's no record" problem, and improve learning outcomes through affordable, accessible, asynchronous-first class delivery.

3. Objectives & Success Metrics
Business Goals:
    •    Ensure ≥90% of physical lectures have a published digital counterpart within the first academic session.
    •    Reduce the data cost of consuming a class by ≥70% versus standard live video (via audio-first + adaptive delivery).
    •    Enable students who miss a physical class to fully catch up online (recording + slides + assessment).
    •    Increase student access to course material outside lecture hours.

Key Performance Indicators (KPIs):
    •    Lecture digitization rate (>90% of physical classes published online).
    •    Weekly active students accessing ≥1 class (>70%).
    •    Median data consumed per class (trending down — proves data-light works).
    •    Catch-up rate: students who missed physical class but completed it online.
    •    User satisfaction score (survey/NPS ≥75).

4. Stakeholders & User Personas
Key Stakeholders:
    •    University Management (Vice-Chancellor, DVCs, Registrar)
    •    Academic Departments & Faculties (Computing/Sciences, Engineering, Arts, Law, Management Sciences, Social Sciences, Education, College of Health Sciences, etc.)
    •    Lecturers & Course Coordinators
    •    Administrative Offices (ICT/Directorate of ICT, Examinations & Records, Student Affairs)
    •    Students
    •    Regulatory/quality bodies (NUC)

User Personas:
    •    Lecturer: Uploads or records lectures, attaches slides/notes, posts assignments, sees who engaged.
    •    Student: Streams or downloads classes (low data), switches to audio-only, views schedule, submits assignments, tracks progress.
    •    Department/Faculty Admin: Creates courses, enrolls students (CSV import), assigns lecturers, views engagement reports.
    •    ICT Administrator: Manages accounts, roles, storage, and system health.

5. Scope
In Scope (Phase 1)
    •    Recorded lecture delivery with adaptive video quality and an audio-only mode.
    •    Offline download of classes for viewing without an active connection (PWA + service worker).
    •    Resumable playback that survives dropped connections and power cuts.
    •    Course → module → class structure with attached slides, notes, and transcripts.
    •    Class schedule/calendar with email and Telegram/WhatsApp notifications.
    •    Lightweight assessment: assignment upload and auto-graded MCQ quizzes.
    •    Accounts and Role-Based Access Control (student, lecturer, admin); CSV student enrollment.
    •    Optional live sessions, always auto-recorded for asynchronous students.

Out of Scope (Phase 1)
    •    Full Student Information System / records repository (admissions, finance, transcripts).
    •    Native iOS/Android apps (web-first responsive PWA instead).
    •    Payment/fee integration.
    •    Live proctored exams and plagiarism detection.
    •    Discussion forums / social features.
    •    Advanced AI analytics.

6. Functional Requirements
Core Features
    1    Class Delivery (core)
    ◦    Recorded lectures uploaded or recorded in-app.
    ◦    Adaptive playback that down-shifts quality on weak connections.
    ◦    Audio-only mode (audio + synced slides) for major data savings.
    ◦    Offline download and resumable, position-remembering playback.
    2    Course & Materials Management
    ◦    Course → module → class hierarchy.
    ◦    Attach slides (PDF), notes, links, and a text transcript per class (lowest-data path).
    3    Data-Light Delivery
    ◦    Default preference order: text → audio → SD video → HD video.
    ◦    Show estimated data size before any stream/download.
    ◦    Global "Lite mode" toggle that strips video everywhere.
    4    Scheduling & Notifications
    ◦    Calendar of upcoming live sessions and recording drops.
    ◦    Email + Telegram/WhatsApp notifications (not dependent on app push).
    5    Assessment
    ◦    Assignment upload (file or text) with deadlines and submission status.
    ◦    Auto-graded multiple-choice quizzes.
    6    Accounts & Access
    ◦    Login via matriculation number / email with role-based access.
    ◦    Admin CSV import to enroll students into courses.
    7    Live Sessions (optional layer)
    ◦    Scheduled, low-bitrate live classes, auto-recorded so async students aren't penalized.
    8    Basic Reporting
    ◦    Engagement counts per class/course and catch-up tracking.

7. Non-Functional Requirements
    •    Security & Compliance: NDPR-aligned, encryption at rest and in transit, role-based access, audit logs of access and changes.
    •    Performance & Data Efficiency: Page load <2 seconds on 3G; audio-first delivery to minimize data; CDN with African edge.
    •    Availability: 99.5% uptime; offline-first so brief outages don't block learning.
    •    Scalability: Support growth across departments and rising concurrent streams.
    •    Usability: Intuitive interface for non-technical lecturers and students; mobile-responsive PWA.
    •    Technology: Next.js (React) PWA frontend; Node.js/NestJS or Django backend; PostgreSQL; HLS adaptive streaming; S3-compatible storage with zero-egress object storage (e.g., Cloudflare R2) to control bandwidth cost.
    •    Integrations: Future-ready REST/GraphQL APIs.

8. Assumptions & Risks
Assumptions:
    •    University provides buy-in, lecturers will record/upload classes, and basic infrastructure (recording or upload capability) is available.
    •    Students have intermittent smartphone/internet access and value low-data options.

Risks & Mitigations:
    •    High bandwidth/storage cost → Audio-first delivery + zero-egress storage (R2) + adaptive quality.
    •    Lecturer non-adoption (no uploads) → <5-minute publishing flow, training, and start with one willing department.
    •    Unstable power/internet for students → Offline download and resumable playback.
    •    Data privacy concerns → RBAC, encryption, audit logs, NDPR alignment.

9. Roadmap & Phases
    •    Phase 1 (MVP): Single department/course pilot — recorded class delivery, audio-only + offline, resume playback, one assignment + one auto-graded quiz, CSV enrollment, basic RBAC.
    •    Phase 2: Schedule + notifications, live optional sessions, expanded assessment, engagement reporting.
    •    Phase 3: Roll out across faculties, deeper analytics, and possible integration with university systems.

10. Appendix
    •    Data Dictionary (sample fields: matric number, name, course, module, class, role, submission, quiz score)
    •    Wireframe sketches (to be added)
    •    Sample User Stories (to be added)
