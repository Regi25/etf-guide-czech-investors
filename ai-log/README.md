# AI session logs

- `*.txt`: genuine Claude Code session exports, created with the `/export` command. Never written or reconstructed by hand. They are unedited except for **one documented redaction** (below).
- `DECISIONS.md`: a written summary of decisions, mistakes and corrections, drafted with Claude and reviewed by the owner. It is not an export.

Exports are **cumulative within a session**. `/export` writes the whole conversation from its first prompt, so a later export of the same session repeats an earlier one and adds what came after:

- `2026-10-11-research-and-mvp.txt`: session start through the MVP summary.
- `2026-10-11-m1-to-m5.txt`: session start through M5 and the Meta ad copy. It overlaps the first file completely; its name refers to the part it adds.
- `2026-10-16-final.txt`: a **separate, later session** (not cumulative with the two above): activating GoatCounter on the live site, the privacy-page and README updates, and the check of GoatCounter's operator location. Tool calls appear collapsed, as `/export` writes them.

Files are kept as exported; a new export always gets a new filename.

## Redaction

| File | Change | SHA-256 |
|---|---|---|
| `2026-10-11-research-and-mvp.txt` | none | `f601cb280071d07dcbed7c412cf2bd5e84ab8c6526c9298f0a34f31e7ddadd21` |
| `2026-10-11-m1-to-m5.txt` | **line 2899 only:** the author's personal e-mail address replaced with `[e-mail redacted]` (2026-10-14, before publication) | published `cf470977cc26b9baaa071ec1414fd423ef5a87cf43a971e9c887df00bd3b2c30`; original `3e2da4118634dda743f03ad25eba6660ef61ae345ef1036c03105923eb835406` |
| `2026-10-16-final.txt` | none (checked 2026-10-16: no personal e-mail address, tokens or other secrets) | `f15334711826f4566c4055dd2d02293209bec3fe9e48661e9e2aae92b83248bd` |

The original, unredacted file is kept privately by the owner and is not part of this repository.

## Commit hashes in the exports

Before the first push, the Git history was rewritten once to replace the author's personal e-mail address with a GitHub noreply address in the commit metadata, which changed every commit hash. The exports still cite the **old** hashes. [`../docs/commit-hash-map.md`](../docs/commit-hash-map.md) maps each old hash to the new one.

Naming: `YYYY-MM-DD-<topic>.txt` (e.g. `2026-10-11-research-and-mvp.txt`).
