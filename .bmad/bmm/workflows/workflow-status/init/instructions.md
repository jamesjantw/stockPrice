# Workflow Init Instructions

## Purpose
The workflow-init process initializes a new BMM project by:
1. Determining project level (greenfield/brownfield) and type
2. Creating workflow path structure
3. Setting up configuration files
4. Initializing workflow status tracking

## Process

### Step 1: Project Assessment
- Review existing project documentation
- Determine project type (web-app, saas, enterprise-app, etc.)
- Identify project level (greenfield = new, brownfield = existing)

### Step 2: Configuration Setup
- Create `.bmad/bmm/config.yaml` with project settings
- Set user preferences and language settings
- Configure output folders

### Step 3: Workflow Status Initialization
- Create workflow status file based on template
- Populate with existing artifacts and current state
- Set initial phase and focus

### Step 4: Directory Structure
- Create required directories for workflow management
- Set up ephemeral storage location
- Prepare path definitions

## Usage

After initialization, use `*workflow-status` to check current workflow state and determine next steps.

## Files Created

- `.bmad/bmm/config.yaml` - Project configuration
- `docs/bmm-workflow-status.yaml` - Workflow status tracking
- `.bmad/bmm/workflows/workflow-status/` - Workflow management files
