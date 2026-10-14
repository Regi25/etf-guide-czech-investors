# AI session logs

- `*.txt`: genuine Claude Code session exports, created with the `/export` command and saved unedited. Never written or reconstructed by hand.
- `DECISIONS.md`: a written summary of decisions, mistakes and corrections, drafted with Claude and reviewed by the owner. It is not an export.

Exports are **cumulative**. `/export` writes the whole conversation from its first prompt, so a later export repeats an earlier one and adds what came after:

- `2026-10-11-research-and-mvp.txt`: session start through the MVP summary.
- `2026-10-11-m1-to-m5.txt`: session start through M5 and the Meta ad copy. It overlaps the first file completely; its name refers to the part it adds.

Files are kept exactly as exported; a new export always gets a new filename.

Naming: `YYYY-MM-DD-<topic>.txt` (e.g. `2026-10-11-research-and-mvp.txt`).
