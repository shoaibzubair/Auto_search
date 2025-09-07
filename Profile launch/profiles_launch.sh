#!/bin/bash

# Edge Profile Automation Script for Microsoft Rewards
# Usage: ./edge_automation.sh

# Configuration
PROFILES=("Profile 1" "Profile 2" "Profile 3" "Default")  # Adjust profile names as needed
EXTENSION_WAIT_TIME=300  # Time to wait for extension to complete (5 minutes)
PROFILE_SWITCH_DELAY=5   # Delay between closing one profile and opening next
LOG_FILE="edge_automation.log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to log messages
log_message() {
    local message="$1"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo -e "${BLUE}[$timestamp]${NC} $message"
    echo "[$timestamp] $message" >> "$LOG_FILE"
}

# Function to check if Edge is running
is_edge_running() {
    pgrep -f "microsoft-edge" > /dev/null
    return $?
}

# Function to kill all Edge processes
kill_edge_processes() {
    log_message "${YELLOW}Killing all Edge processes...${NC}"
    pkill -f "microsoft-edge"
    sleep 2
    # Force kill if still running
    if is_edge_running; then
        pkill -9 -f "microsoft-edge"
        sleep 2
    fi
}

# Function to wait for Edge to fully start
wait_for_edge_start() {
    local max_wait=30
    local wait_count=0
    
    log_message "Waiting for Edge to start..."
    while [ $wait_count -lt $max_wait ]; do
        if is_edge_running; then
            log_message "${GREEN}Edge started successfully${NC}"
            return 0
        fi
        sleep 1
        ((wait_count++))
    done
    
    log_message "${RED}Edge failed to start within $max_wait seconds${NC}"
    return 1
}

# Function to run extension automation
run_extension_automation() {
    local profile_name="$1"
    
    log_message "Running extension automation for $profile_name..."
    
    # Method 1: Try to trigger extension via JavaScript injection
    # This assumes your extension listens for a specific event or has a trigger function
    # You may need to adjust this based on your extension's implementation
    
    # Option A: If your extension can be triggered via a specific URL or bookmark
    # microsoft-edge --profile-directory="$profile_name" "javascript:your_extension_trigger_function();" &
    
    # Option B: If your extension has a popup that can be automated
    # You could use xdotool to simulate clicks on the extension icon
    
    # Option C: Wait for manual intervention or extension auto-run
    log_message "Waiting ${EXTENSION_WAIT_TIME} seconds for extension to complete..."
    
    # Show a countdown
    for ((i=EXTENSION_WAIT_TIME; i>0; i--)); do
        printf "\rTime remaining: %02d:%02d" $((i/60)) $((i%60))
        sleep 1
    done
    echo ""
    
    log_message "${GREEN}Extension automation completed for $profile_name${NC}"
}

# Function to run extension via keyboard automation (alternative method)
run_extension_via_keyboard() {
    local profile_name="$1"
    
    log_message "Attempting to trigger extension via keyboard shortcut for $profile_name..."
    
    # Wait for browser to fully load
    sleep 10
    
    # Try to trigger extension (adjust based on your extension's shortcut)
    # Common extension shortcuts: Ctrl+Shift+Y, Alt+Shift+E, etc.
    if command -v xdotool >/dev/null 2>&1; then
        # Find the Edge window
        local edge_window=$(xdotool search --name "Microsoft Edge" | head -1)
        if [ -n "$edge_window" ]; then
            xdotool windowactivate "$edge_window"
            sleep 1
            
            # Send keyboard shortcut (adjust as needed for your extension)
            # Example: Ctrl+Shift+Y
            xdotool key ctrl+shift+y
            log_message "Sent keyboard shortcut to trigger extension"
            
            # Wait for extension to complete
            run_extension_automation "$profile_name"
        else
            log_message "${YELLOW}Could not find Edge window for keyboard automation${NC}"
            run_extension_automation "$profile_name"
        fi
    else
        log_message "${YELLOW}xdotool not found. Install with: sudo apt install xdotool${NC}"
        run_extension_automation "$profile_name"
    fi
}

# Function to process a single profile
process_profile() {
    local profile_name="$1"
    local profile_number="$2"
    
    log_message "${GREEN}=== Processing Profile $profile_number: $profile_name ===${NC}"
    
    # Ensure no Edge processes are running
    if is_edge_running; then
        kill_edge_processes
    fi
    
    # Start Edge with the specific profile
    log_message "Starting Edge with profile: $profile_name"
    microsoft-edge --profile-directory="$profile_name" &
    local edge_pid=$!
    
    # Wait for Edge to start
    if wait_for_edge_start; then
        # Run the extension automation
        run_extension_via_keyboard "$profile_name"
        
        # Close Edge
        log_message "Closing Edge for profile: $profile_name"
        kill_edge_processes
        
        # Wait before starting next profile
        if [ $profile_number -lt ${#PROFILES[@]} ]; then
            log_message "Waiting $PROFILE_SWITCH_DELAY seconds before next profile..."
            sleep $PROFILE_SWITCH_DELAY
        fi
    else
        log_message "${RED}Failed to start Edge for profile: $profile_name${NC}"
        kill_edge_processes
    fi
}

# Function to show usage
show_usage() {
    echo "Edge Profile Automation Script"
    echo "Usage: $0 [options]"
    echo ""
    echo "Options:"
    echo "  -h, --help              Show this help message"
    echo "  -p, --profiles LIST     Comma-separated list of profile names"
    echo "  -w, --wait TIME         Wait time for extension (seconds, default: 300)"
    echo "  -d, --delay TIME        Delay between profiles (seconds, default: 5)"
    echo ""
    echo "Examples:"
    echo "  $0"
    echo "  $0 -p 'Profile 1,Profile 2,Custom Profile' -w 180"
    echo "  $0 --profiles 'Default,Profile 1' --wait 240 --delay 10"
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            show_usage
            exit 0
            ;;
        -p|--profiles)
            IFS=',' read -ra PROFILES <<< "$2"
            shift 2
            ;;
        -w|--wait)
            EXTENSION_WAIT_TIME="$2"
            shift 2
            ;;
        -d|--delay)
            PROFILE_SWITCH_DELAY="$2"
            shift 2
            ;;
        *)
            echo "Unknown option: $1"
            show_usage
            exit 1
            ;;
    esac
done

# Main execution
main() {
    log_message "${GREEN}=== Starting Edge Profile Automation ===${NC}"
    log_message "Profiles to process: ${PROFILES[*]}"
    log_message "Extension wait time: ${EXTENSION_WAIT_TIME} seconds"
    log_message "Profile switch delay: ${PROFILE_SWITCH_DELAY} seconds"
    echo ""
    
    # Check if xdotool is available (helpful for better process management)
    if ! command -v xdotool >/dev/null 2>&1; then
        log_message "${YELLOW}Note: xdotool not found. Browser closing may be less graceful.${NC}"
        log_message "${YELLOW}Install with: sudo apt install xdotool (optional)${NC}"
        echo ""
    fi
    
    # Process each profile
    local profile_count=1
    for profile in "${PROFILES[@]}"; do
        process_profile "$profile" $profile_count
        ((profile_count++))
        echo ""
    done
    
    log_message "${GREEN}=== All profiles processed successfully! ===${NC}"
}

# Check if script is being run directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi