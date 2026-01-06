# Incident Report: [Brief Title]

<!-- Post-incident report template -->
<!-- Save to: docs/incidents/YYYY-MM-DD_incident-name.md -->

**Incident ID**: INC-[NUMBER]
**Date**: YYYY-MM-DD
**Duration**: [Start time] - [End time] ([X] hours/minutes)
**Severity**: P1 (Critical) | P2 (High) | P3 (Medium) | P4 (Low)
**Status**: Investigating | Identified | Monitoring | Resolved | Postmortem Complete

---

## Executive Summary

<!-- 2-3 sentence summary for leadership -->

[REQUIRED: Brief overview of what happened, impact, and resolution]

---

## Timeline

<!-- Chronological sequence of events (all times in UTC) -->

| Time (UTC) | Event                             |
| ---------- | --------------------------------- |
| HH:MM      | [First indication of problem]     |
| HH:MM      | [Alert triggered / User reported] |
| HH:MM      | [Investigation started]           |
| HH:MM      | [Root cause identified]           |
| HH:MM      | [Mitigation applied]              |
| HH:MM      | [Service restored]                |
| HH:MM      | [Incident closed]                 |

---

## Impact

### User Impact

<!-- What did users experience? -->

- **Affected Users**: [Number/percentage]
- **Affected Services**: [List of services]
- **User Experience**: [What users saw/couldn't do]
- **Geographic Scope**: [All regions / Specific regions]

### Business Impact

<!-- Business consequences -->

- **Revenue Impact**: [If measurable]
- **SLA Breach**: [Yes/No, details]
- **Reputation Impact**: [Description]
- **Data Impact**: [Any data loss or corruption]

### Metrics

| Metric        | Before | During | After |
| ------------- | ------ | ------ | ----- |
| Error Rate    | X%     | Y%     | X%    |
| Response Time | Xms    | Yms    | Xms   |
| Availability  | X%     | Y%     | X%    |

---

## Root Cause

<!-- What caused the incident? -->

### Primary Cause

[REQUIRED: The fundamental reason the incident occurred]

### Contributing Factors

- [Factor 1]
- [Factor 2]
- [Factor 3]

### Detection Gap

<!-- Why wasn't this caught sooner? -->

[How this escaped existing monitoring/testing]

---

## Resolution

### Immediate Actions Taken

<!-- What was done to stop the bleeding? -->

1. [Action 1]
2. [Action 2]
3. [Action 3]

### Permanent Fix

<!-- What was done to fully resolve? -->

[Description of permanent fix]

### Verification

<!-- How did we confirm resolution? -->

- [ ] [Verification step 1]
- [ ] [Verification step 2]

---

## Lessons Learned

### What Went Well

<!-- Things that helped during the incident -->

- [Positive 1]
- [Positive 2]

### What Went Poorly

<!-- Things that made the incident worse or response harder -->

- [Negative 1]
- [Negative 2]

### Where We Got Lucky

<!-- Things that could have made it worse -->

- [Lucky break 1]
- [Lucky break 2]

---

## Action Items

<!-- Concrete steps to prevent recurrence -->

### Immediate (This Week)

| Action     | Owner  | Due Date   | Status |
| ---------- | ------ | ---------- | ------ |
| [Action 1] | [Name] | YYYY-MM-DD | [ ]    |
| [Action 2] | [Name] | YYYY-MM-DD | [ ]    |

### Short-term (This Month)

| Action     | Owner  | Due Date   | Status |
| ---------- | ------ | ---------- | ------ |
| [Action 1] | [Name] | YYYY-MM-DD | [ ]    |
| [Action 2] | [Name] | YYYY-MM-DD | [ ]    |

### Long-term (This Quarter)

| Action     | Owner  | Due Date   | Status |
| ---------- | ------ | ---------- | ------ |
| [Action 1] | [Name] | YYYY-MM-DD | [ ]    |
| [Action 2] | [Name] | YYYY-MM-DD | [ ]    |

---

## Prevention

### How to Prevent Recurrence

<!-- Systemic changes to prevent similar incidents -->

1. [Prevention measure 1]
2. [Prevention measure 2]
3. [Prevention measure 3]

### Improved Detection

<!-- How to catch this sooner next time -->

- [ ] Add alert for [condition]
- [ ] Add monitoring for [metric]
- [ ] Add test for [scenario]

### Improved Response

<!-- How to respond faster next time -->

- [ ] Update runbook for [scenario]
- [ ] Create automated remediation for [action]

---

## Communication

### Internal Communication

| Time  | Channel       | Message              |
| ----- | ------------- | -------------------- |
| HH:MM | [Slack/Email] | [Summary of message] |

### External Communication

| Time  | Channel             | Message              |
| ----- | ------------------- | -------------------- |
| HH:MM | [Status page/Email] | [Summary of message] |

### Communication Review

<!-- What went well/poorly in communication? -->

[Assessment of communication effectiveness]

---

## Technical Details

### System Diagram

<!-- If helpful, include architecture diagram -->

```
[ASCII diagram or link to image]
```

### Relevant Logs

```
[Key log entries]
```

### Relevant Metrics

<!-- Screenshots or links to dashboards -->

[Dashboard links or embedded images]

---

## Participants

| Role                  | Name   |
| --------------------- | ------ |
| Incident Commander    | [Name] |
| Technical Lead        | [Name] |
| Communications        | [Name] |
| Subject Matter Expert | [Name] |

---

## Related

- Related Incidents: [INC-XXX]
- Related Issues: #[number]
- Related PRs: #[number]
- Runbook: [link]

---

## Review

### Postmortem Meeting

**Date**: YYYY-MM-DD
**Attendees**: [List]

### Meeting Notes

[Key discussion points and decisions]

### Sign-off

- [ ] Engineering Lead
- [ ] Product Manager
- [ ] Operations Lead

---

_Report Author_: [Name]
_Last Updated_: YYYY-MM-DD
