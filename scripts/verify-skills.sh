#!/usr/bin/env bash
#
# Verify that `prospec init` + `prospec agent sync` produce skill / system-md
# output that conforms to the skill-alignment contract:
#   - agent-specific skill reference paths (no .prospec/skills/)
#   - self-contained knowledge skills (no References line / no refs dir)
#   - archive + ff carry their own reference files (no dangling, no sibling paths)
#   - every references/ link in every SKILL.md resolves on disk
#   - canonical convention docs generated and referenced
#   - base_dir-relative spec paths (no root-anchored /specs/)
#   - Copilot inlines references
#
# Usage:
#   scripts/verify-skills.sh [repo-root]
#
# Exits non-zero if any check fails (CI-friendly).
set -u

REPO="${1:-$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)}"
CLI="$REPO/dist/cli/index.js"

if [ ! -f "$CLI" ]; then
  echo "dist/ not found — building ($REPO)…"
  (cd "$REPO" && npx tsc) || { echo "build failed"; exit 1; }
fi

TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
cd "$TMP"
echo '{"name":"demo"}' > package.json

node "$CLI" init --name demo --agents claude,gemini,codex,copilot >/dev/null 2>&1 \
  || { echo "prospec init failed"; exit 1; }
node "$CLI" agent sync >/dev/null 2>&1 \
  || { echo "prospec agent sync failed"; exit 1; }

ok=0; bad=0
chk(){ if eval "$2"; then echo "  ✓ $1"; ok=$((ok+1)); else echo "  ✗ $1"; bad=$((bad+1)); fi; }

echo "[A] system md: agent-specific skill paths, no .prospec/skills/"
chk "no .prospec/skills/ anywhere"      '! grep -rq ".prospec/skills/" CLAUDE.md GEMINI.md AGENTS.md .github/copilot-instructions.md'
chk "CLAUDE.md -> .claude/skills"        'grep -q ".claude/skills/prospec-archive/references/" CLAUDE.md'
chk "GEMINI.md -> .gemini/skills"        'grep -q ".gemini/skills/prospec-archive/references/" GEMINI.md'
chk "AGENTS.md -> .codex/skills"         'grep -q ".codex/skills/prospec-archive/references/" AGENTS.md'

echo "[B] self-contained knowledge skills: no References line / no refs dir"
chk "no kg References line in CLAUDE.md" '! grep -q "prospec-knowledge-generate/references" CLAUDE.md'
chk "no ku References line in CLAUDE.md" '! grep -q "prospec-knowledge-update/references" CLAUDE.md'
chk "no kg references/ dir"              '! test -d .claude/skills/prospec-knowledge-generate/references'
chk "no ku references/ dir"              '! test -d .claude/skills/prospec-knowledge-update/references'

echo "[C] references actually generated"
chk "archive has 3 refs"  '[ $(ls .claude/skills/prospec-archive/references/ | wc -l) -eq 3 ]'
chk "ff has 4 refs"       '[ $(ls .claude/skills/prospec-ff/references/ | wc -l) -eq 4 ]'
chk "ff no sibling paths" '! grep -qE "prospec-(new-story|plan|tasks)/references/" .claude/skills/prospec-ff/SKILL.md'

echo "[D] every references/ link in every SKILL.md resolves on disk"
miss=""
for s in .claude/skills/*/SKILL.md; do d=$(dirname "$s")
  for r in $(grep -oE "references/[a-z-]+\.md" "$s" | sort -u); do
    [ -f "$d/$r" ] || miss="$miss $d/$r"; done; done
chk "no dangling references/ links" '[ -z "$miss" ]'; [ -n "$miss" ] && echo "      dangling:$miss"

echo "[E] convention files generated + referenced links resolve"
for f in _status-lifecycle _module-readme-conventions _diagram-conventions; do
  chk "prospec/ai-knowledge/$f.md exists" "test -f prospec/ai-knowledge/$f.md"; done
chk "status-lifecycle referenced by 6 skills" '[ $(grep -l "_status-lifecycle.md" .claude/skills/*/SKILL.md | wc -l) -eq 6 ]'

echo "[F] base_dir paths render (no root-anchored /specs/)"
chk "no root /specs/ in skills"  '! grep -rqE "[^a-z/]/specs/" .claude/skills/*/SKILL.md .claude/skills/*/references/*.md'
chk "uses prospec/specs/"        'grep -q "prospec/specs/" .claude/skills/prospec-verify/SKILL.md'

echo "[G] copilot inlines references"
chk "ff.instructions inlines 4 formats" '[ $(grep -c "## Reference:" .github/instructions/prospec-ff.instructions.md) -eq 4 ]'
chk "no copilot references/ dir"        '! test -d .github/instructions/references'

echo
echo "RESULT: $ok passed, $bad failed"
[ "$bad" -eq 0 ]
