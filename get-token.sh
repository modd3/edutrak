#!/bin/bash

# EduTrak Token Helper Script
# Usage: source get-token.sh [email] [password]

# -----------------------------------------------------------------------------
# Configuration & Colors
# -----------------------------------------------------------------------------
API_URL="http://localhost:4000/api"
DEFAULT_EMAIL="admin@msa.com"
DEFAULT_PASSWORD="Admin1@msa"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
BOLD='\033[1m'
NC='\033[0m' 

# -----------------------------------------------------------------------------
# UI Helpers
# -----------------------------------------------------------------------------
print_status() { echo -e "${GREEN}[✓]${NC} $1"; }
print_error()  { echo -e "${RED}[✗] ERROR:${NC} $1" >&2; }
print_info()   { echo -e "${BLUE}[i]${NC} $1"; }
print_warn()   { echo -e "${YELLOW}[!] WARNING:${NC} $1"; }

# -----------------------------------------------------------------------------
# Data Extraction Logic
# -----------------------------------------------------------------------------
_get_json_val() {
    local json="$1"
    local key="$2"
    
    if command -v jq &> /dev/null; then
        echo "$json" | jq -r ".data.$key" 2>/dev/null | grep -v "null"
    else
        # Fallback to grep/sed if jq is missing
        echo "$json" | grep -o "\"$key\":\"[^\"]*\"" | cut -d'"' -f4
    fi
}

# -----------------------------------------------------------------------------
# Core Functions
# -----------------------------------------------------------------------------

# Main login function
login() {
    local email="${1:-$DEFAULT_EMAIL}"
    local password="${2:-$DEFAULT_PASSWORD}"
    
    print_info "Attempting login for: ${BOLD}$email${NC}..."
    
    # Make login request
    local response
    response=$(curl -s -X POST "$API_URL/auth/login" \
        -H "Content-Type: application/x-www-form-urlencoded" \
        -d "email=$email&password=$password")
    
    if [ $? -ne 0 ]; then
        print_error "Connection failed. Is the server running at $API_URL?"
        return 1
    fi
    
    # Extract data
    local token=$(_get_json_val "$response" "token")
    
    if [ -z "$token" ]; then
        print_error "Authentication failed. Check credentials."
        echo -e "${YELLOW}Response:${NC} $response"
        return 1
    fi
    
    # Set environment variables
    export EDU_TOKEN="$token"
    export EDU_REFRESH_TOKEN=$(_get_json_val "$response" "refreshToken")
    export EDU_USER_EMAIL="$email"
    
    # Set the helper alias
    alias edutrak="curl -s -H 'Authorization: Bearer $EDU_TOKEN'"
    
    print_status "Login successful!"
    
    # Show basic user info if jq is available
    if command -v jq &> /dev/null; then
        local user_info
        user_info=$(echo "$response" | jq -r '.data.user | "\(.firstName) \(.lastName) (\(.role))"')
        print_info "Logged in as: $user_info"
    fi
}

refresh_token() {
    if [ -z "$EDU_REFRESH_TOKEN" ]; then
        print_error "No refresh token available. Please login first."
        return 1
    fi
    
    print_info "Refreshing session..."
    local response
    response=$(curl -s -X POST "$API_URL/auth/refresh" \
        -H "Content-Type: application/json" \
        -d "{\"refreshToken\": \"$EDU_REFRESH_TOKEN\"}")
    
    local new_token=$(_get_json_val "$response" "token")
    
    if [ -n "$new_token" ]; then
        export EDU_TOKEN="$new_token"
        alias edutrak="curl -s -H 'Authorization: Bearer $EDU_TOKEN'"
        print_status "Token refreshed successfully."
    else
        print_error "Session refresh failed."
        return 1
    fi
}

token_info() {
    if [ -z "$EDU_TOKEN" ]; then
        print_error "No active token found."
        return 1
    fi
    
    echo -e "\n${BLUE}${BOLD}--- Current Session ---${NC}"
    echo -e "${BOLD}User:  ${NC} $EDU_USER_EMAIL"
    echo -e "${BOLD}Token: ${NC} ${EDU_TOKEN:0:20}..."
    
    if command -v jq &> /dev/null; then
        echo -e "\n${BLUE}${BOLD}Payload Details:${NC}"
        echo "$EDU_TOKEN" | cut -d. -f2 | base64 --decode 2>/dev/null | jq .
    else
        print_warn "Install 'jq' for detailed token inspection."
    fi
}

clear_token() {
    unset EDU_TOKEN
    unset EDU_REFRESH_TOKEN
    unset EDU_USER_EMAIL
    unalias edutrak 2>/dev/null
    print_status "Environment cleaned. You are now logged out."
}

show_help() {
    echo -e "${BLUE}${BOLD}EduTrak CLI Helper${NC}"
    echo "Usage: source get-token.sh [email] [password]"
    echo ""
    echo -e "${YELLOW}${BOLD}Available Commands:${NC}"
    echo "  login [email] [pw]  - Authenticate and set environment"
    echo "  refresh_token       - Use refresh token to get a new JWT"
    echo "  token_info          - Inspect the current JWT payload"
    echo "  edutrak [path]      - Authenticated curl (e.g. edutrak http://.../api/users)"
    echo "  clear_token         - Remove tokens from current shell"
}

# -----------------------------------------------------------------------------
# Execution Logic
# -----------------------------------------------------------------------------

# Check if script is being sourced or executed
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    # SCRIPT IS EXECUTED (./get-token.sh)
    # Output raw export commands for eval $(...) use
    EMAIL="${1:-$DEFAULT_EMAIL}"
    PASS="${2:-$DEFAULT_PASSWORD}"
    
    response=$(curl -s -X POST "$API_URL/auth/login" \
        -H "Content-Type: application/x-www-form-urlencoded" \
        -d "email=$EMAIL&password=$PASS")
    
    TOKEN=$(_get_json_val "$response" "token")
    
    if [ -n "$TOKEN" ]; then
        echo "export EDU_TOKEN=\"$TOKEN\""
        echo "export EDU_USER_EMAIL=\"$EMAIL\""
    else
        echo "echo 'Error: Login failed'" >&2
        exit 1
    fi
else
    # SCRIPT IS SOURCED (source get-token.sh)
    # Don't run login automatically if help is requested
    if [[ "$1" == "--help" || "$1" == "-h" ]]; then
        show_help
    else
        login "$@"
    fi
fi