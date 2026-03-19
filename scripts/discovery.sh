#!/bin/bash
# Skill Discovery Script for SkillFlow
# Scans installed skills and builds registry

set -e

# Configuration
SKILL_DIRS=(
  "$HOME/.openclaw/skills"
  "$HOME/.openclaw/workspace/skills"
  "/usr/local/share/openclaw/skills"
)

CACHE_FILE="$HOME/.openclaw/cache/skillflow-registry.json"
CACHE_DURATION="${ORCHESTRATOR_CACHE_TTL:-3600}"  # 1 hour default

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_info() {
  echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
  echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
  echo -e "${RED}[ERROR]${NC} $1"
}

# Check if cache is valid
is_cache_valid() {
  if [ ! -f "$CACHE_FILE" ]; then
    return 1
  fi
  
  local cache_age=$(($(date +%s) - $(stat -c %Y "$CACHE_FILE" 2>/dev/null || stat -f %m "$CACHE_FILE")))
  
  if [ "$cache_age" -lt "$CACHE_DURATION" ]; then
    return 0
  fi
  
  return 1
}

# Extract skill metadata from SKILL.md
extract_skill_metadata() {
  local skill_md="$1"
  
  if [ ! -f "$skill_md" ]; then
    return 1
  fi
  
  # Extract YAML frontmatter
  local frontmatter=$(sed -n '/^---$/,/^---$/p' "$skill_md" | sed '1d;$d')
  
  # Parse name and description
  local name=$(echo "$frontmatter" | grep -E '^name:' | sed 's/name: *//' | tr -d '"' | tr -d "'")
  local description=$(echo "$frontmatter" | grep -E '^description:' | sed 's/description: *//' | tr -d '"' | tr -d "'")
  
  if [ -z "$name" ]; then
    return 1
  fi
  
  # Extract capabilities from description
  # Look for keywords like "use when", "supports", "triggers"
  local capabilities=$(echo "$description" | grep -oiE '\b(search|write|read|create|edit|delete|upload|download|summarize|translate|execute|analyze|fetch|send|notify)\b' | sort -u | jq -R . | jq -s .)
  
  # Build JSON object
  jq -n \
    --arg name "$name" \
    --arg description "$description" \
    --argjson capabilities "$capabilities" \
    --arg path "$(dirname "$skill_md")" \
    '{
      name: $name,
      description: $description,
      capabilities: $capabilities,
      path: $path
    }'
}

# Scan all skill directories
scan_skills() {
  local skills_json="[]"
  
  for dir in "${SKILL_DIRS[@]}"; do
    if [ ! -d "$dir" ]; then
      log_warn "Skill directory not found: $dir"
      continue
    fi
    
    log_info "Scanning: $dir"
    
    for skill_dir in "$dir"/*/; do
      if [ ! -d "$skill_dir" ]; then
        continue
      fi
      
      local skill_md="$skill_dir/SKILL.md"
      
      if [ -f "$skill_md" ]; then
        local metadata=$(extract_skill_metadata "$skill_md")
        
        if [ $? -eq 0 ] && [ -n "$metadata" ]; then
          skills_json=$(echo "$skills_json" | jq --argjson skill "$metadata" '. + [$skill]')
          log_info "  Found: $(echo "$metadata" | jq -r '.name')"
        fi
      fi
    done
  done
  
  echo "$skills_json"
}

# Build capability index
build_capability_index() {
  local skills_json="$1"
  
  echo "$skills_json" | jq -r '
    .[].capabilities[]? | 
    . as $cap | 
    input | 
    group_by($cap) | 
    map({(.[0].capabilities[]): [.[].name]}) | 
    add
  ' <<< "$skills_json"
}

# Main
main() {
  log_info "Orchestrator Skill Discovery"
  echo "--------------------------------"
  
  # Check cache
  if is_cache_valid && [ "${1:-}" != "--force" ]; then
    log_info "Using cached registry (age: $(($(date +%s) - $(stat -c %Y "$CACHE_FILE" 2>/dev/null || stat -f %m "$CACHE_FILE")))s)"
    cat "$CACHE_FILE"
    exit 0
  fi
  
  log_info "Scanning for skills..."
  
  # Scan skills
  local skills=$(scan_skills)
  local skill_count=$(echo "$skills" | jq 'length')
  
  log_info "Found $skill_count skills"
  
  # Build capability index
  log_info "Building capability index..."
  local cap_index=$(echo "$skills" | jq '
    reduce .[] as $skill (
      {};
      . + reduce ($skill.capabilities[]?) as $cap (
        .;
        .[$cap] = ((.[$cap] // []) + [$skill.name])
      )
    )
  ')
  
  # Create final registry
  local registry=$(jq -n \
    --argjson skills "$skills" \
    --argjson capabilities "$cap_index" \
    --arg updated "$(date -Iseconds)" \
    '{
      skills: ($skills | map({key: .name, value: .}) | from_entries),
      capabilities_index: $capabilities,
      last_updated: $updated
    }')
  
  # Save to cache
  mkdir -p "$(dirname "$CACHE_FILE")"
  echo "$registry" > "$CACHE_FILE"
  
  log_info "Registry saved to: $CACHE_FILE"
  echo ""
  
  # Output
  echo "$registry"
}

# Run
main "$@"
