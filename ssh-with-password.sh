#!/bin/bash

# Function to run SSH command with password
ssh_with_password() {
    expect << EOF
spawn ssh -o StrictHostKeyChecking=no root@217.154.43.87 "$1"
expect "password:"
send "M6z67Wiq\r"
expect eof
EOF
}

# Function to run SCP command with password
scp_with_password() {
    expect << EOF
spawn scp -o StrictHostKeyChecking=no $1 root@217.154.43.87:$2
expect "password:"
send "M6z67Wiq\r"
expect eof
EOF
}

# Check if expect is installed
if ! command -v expect &> /dev/null; then
    echo "Installing expect..."
    brew install expect
fi

# Run the command passed as argument
if [ "$1" = "ssh" ]; then
    shift
    ssh_with_password "$*"
elif [ "$1" = "scp" ]; then
    shift
    scp_with_password "$*"
else
    echo "Usage: $0 ssh 'command' or $0 scp 'source' 'destination'"
fi 