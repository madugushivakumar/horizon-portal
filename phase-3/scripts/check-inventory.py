import os, time

files = [
    # Previous Stage (Corporate Stakeholder Review & Evidence Collection) Deliverables:
    'docs/DAY11-CORPORATE-STAKEHOLDER-REVIEW-MATRIX.md',
    'docs/DAY11-CORPORATE-DECISION-REVIEW-PACKAGE.md',
    'docs/DAY11-EXTERNAL-EVIDENCE-COLLECTION-TRACKER.md',
    'docs/DAY11-EXTERNAL-EVIDENCE-VERIFICATION-PROCEDURES.md',
    'docs/DAY11-STAKEHOLDER-RESPONSE-TEMPLATES.md',
    'docs/DAY11-GATE1-PREREQUISITE-TRACKING-PLAN.md',
    'docs/DAY11-CORPORATE-STAKEHOLDER-TRANSMISSION-PACKAGE.md',
    'docs/DAY11-CORPORATE-STAKEHOLDER-REVIEW-AND-EVIDENCE-COLLECTION-REPORT.md',
    # Current Stage (Stakeholder Response & Evidence Intake) Deliverables:
    'docs/DAY11-STAKEHOLDER-RESPONSE-INTAKE-REGISTER.md',
    'docs/DAY11-EXTERNAL-EVIDENCE-INTAKE-REGISTER.md',
    'docs/DAY11-EXTERNAL-EVIDENCE-VERIFICATION-RESULTS.md',
    'docs/DAY11-GOVERNANCE-DECISION-UPDATE-REGISTER.md',
    'docs/DAY11-GATE1-PREREQUISITE-IMPACT-ASSESSMENT.md',
    'docs/DAY11-GATE1-EXCEPTION-AND-DISCREPANCY-REGISTER.md',
    'docs/DAY11-STAKEHOLDER-RESPONSE-AND-EVIDENCE-INTAKE-REPORT.md'
]

print(f"{'File':<68} {'Exists':<8} {'Size':<12} {'Modified Time'}")
print("-" * 115)
for f in files:
    if os.path.exists(f):
        stat = os.stat(f)
        mtime = time.strftime('%Y-%m-%d %H:%M:%S', time.localtime(stat.st_mtime))
        print(f"{f:<68} {'YES':<8} {stat.st_size:<12} {mtime}")
    else:
        print(f"{f:<68} {'NO':<8} {'N/A':<12} {'N/A'}")

