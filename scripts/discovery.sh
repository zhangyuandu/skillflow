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
  local capabilities="[]"
  if command -v jq >/dev/null 2>&1; then
    local caps=$(echo "$description" | grep -oiE '\b(search|write|read|create|edit|delete|upload|download|summarize|translate|execute|analyze|fetch|send|notify|browse|orchestrat|plan)\b' 2>/dev/null | sort -u || true)
    if [ -n "$caps" ]; then
      # 安全地构建 JSON 数组
      capabilities=$(echo "$caps" | awk 'BEGIN{printf "["} NR>1{printf ", "} {printf "\"%s\"", $0} END{printf "]"}')
      # 验证 JSON
      if ! echo "$capabilities" | jq empty 2>/dev/null; then
        capabilities="[]"
      fi
    fi
  fi
  
  # Build JSON object - 使用简单的字符串拼接避免 jq 解析问题
  local skill_path=$(dirname "$skill_md")
  
  # 使用 printf 和 jq 确保正确的 JSON 转义
  printf '%s' "$(jq -n \
    --arg name "$name" \
    --arg description "$description" \
    --argjson capabilities "$capabilities" \
    --arg path "$skill_path" \
    '{name: $name, description: $description, capabilities: $capabilities, path: $path}'
  )"
}

# Scan all skill directories
scan_skills() {
  local skills_json="[]"
  local found_count=0
  
  for dir in "${SKILL_DIRS[@]}"; do
    if [ ! -d "$dir" ]; then
      continue
    fi
    
    log_info "扫描: $dir"
    
    for skill_dir in "$dir"/*/; do
      if [ ! -d "$skill_dir" ]; then
        continue
      fi
      
      local skill_md="$skill_dir/SKILL.md"
      
      if [ -f "$skill_md" ]; then
        local metadata=$(extract_skill_metadata "$skill_md")
        
        if [ $? -eq 0 ] && [ -n "$metadata" ]; then
          # 验证 metadata 是有效的 JSON
          if echo "$metadata" | jq empty 2>/dev/null; then
            skills_json=$(echo "$skills_json" | jq --argjson skill "$metadata" '. + [$skill]' 2>/dev/null || echo "$skills_json")
            found_count=$((found_count + 1))
            
            local skill_name=$(echo "$metadata" | jq -r '.name' 2>/dev/null || echo "unknown")
            log_info "  发现: $skill_name"
          fi
        fi
      fi
    done
  done
  
  log_info "共发现 $found_count 个技能"
  echo "$skills_json"
}

# Build capability index
build_capability_index() {
  local skills_json="$1"
  
  # 安全地构建能力索引
  echo "$skills_json" | jq '
    reduce .[] as $skill (
      {};
      . + reduce ($skill.capabilities[]?) as $cap (
        .;
        .[$cap] = ((.[$cap] // []) + [$skill.name])
      )
    )
  ' 2>/dev/null || echo "{}"
}

# Main
main() {
  log_info "SkillFlow 技能发现"
  echo "--------------------------------"
  
  # Check cache
  if is_cache_valid && [ "${1:-}" != "--force" ]; then
    local cache_age=$(($(date +%s) - $(stat -c %Y "$CACHE_FILE" 2>/dev/null || stat -f %m "$CACHE_FILE")))
    log_info "使用缓存 (已缓存 ${cache_age}s)"
    cat "$CACHE_FILE"
    exit 0
  fi
  
  # Scan skills
  local skills=$(scan_skills)
  local skill_count=$(echo "$skills" | jq 'length' 2>/dev/null || echo "0")
  
  # Build capability index
  log_info "构建能力索引..."
  local cap_index=$(build_capability_index "$skills")
  
# Create final registry
  local registry=$(jq -n \
    --argjson skills "$skills" \
    --argjson capabilities "$cap_index" \
    --arg updated "$(date -Iseconds)" \
    '{
      skills: $skills,
      capabilities_index: $capabilities,
      last_updated: $updated
    }' 2>/dev/null)
  
  if [ -z "$registry" ] || ! echo "$registry" | jq empty 2>/dev/null; then
    log_error "构建注册表失败"
    exit 1
  fi
  
  # Save to cache
  mkdir -p "$(dirname "$CACHE_FILE")"
  echo "$registry" > "$CACHE_FILE"
  
  log_info "注册表已保存: $CACHE_FILE"
  echo ""
  
  # Output
  echo "$registry"
}

# Run
main "$@"
