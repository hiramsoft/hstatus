#!/usr/bin/env bash
# Download the AWS CLI from http://aws.amazon.com/cli/
aws s3 sync ./dist/ s3://[your-bucket-goes-here]
