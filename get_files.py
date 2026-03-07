# get_files.py
import os
import shutil
from pathlib import Path

def should_exclude(path, exclude_patterns):
    """Check if path should be excluded"""
    path_str = str(path)
    
    for pattern in exclude_patterns:
        if pattern in path_str:
            return True
    return False

def collect_files(source_dir, output_dir, exclude_patterns):
    """Collect all files from source directory excluding specified patterns"""
    source_path = Path(source_dir)
    output_path = Path(output_dir)
    
    # Create output directory if it doesn't exist
    output_path.mkdir(parents=True, exist_ok=True)
    
    collected_files = []
    
    # Walk through all files
    for file_path in source_path.rglob('*'):
        # Skip directories
        if file_path.is_dir():
            continue
            
        # Skip excluded patterns
        if should_exclude(file_path, exclude_patterns):
            continue
        
        # Get relative path from source
        relative_path = file_path.relative_to(source_path)
        
        # Create destination path (flat structure with directory names in filename)
        # Replace / with _ to create flat structure
        flat_name = str(relative_path).replace('/', '_').replace('\\', '_')
        dest_path = output_path / flat_name
        
        # Copy file
        try:
            shutil.copy2(file_path, dest_path)
            collected_files.append({
                'original': str(relative_path),
                'copied': flat_name
            })
            print(f"✓ Copied: {relative_path}")
        except Exception as e:
            print(f"✗ Error copying {relative_path}: {e}")
    
    return collected_files

def main():
    # Get current directory (where script is run from)
    project_root = os.getcwd()
    
    # Output submission folder
    submission_folder = os.path.join(project_root, "submission")
    
    # Patterns to exclude
    exclude_patterns = [
        'node_modules',
        '.git',
        'package-lock.json',
        '.DS_Store',
        '__pycache__',
        '.env',  # Exclude actual .env but keep .env.example
        'submission',  # Don't copy submission folder into itself
        '.vscode',
        '.idea',
        'dist',
        'build',
        '.cache'
    ]
    
    print("=" * 60)
    print("HIGH STREET GYM - FILE COLLECTION SCRIPT")
    print("=" * 60)
    print(f"Working directory: {project_root}")
    print()
    
    # Clean submission folder if exists
    if os.path.exists(submission_folder):
        print(f"Cleaning existing submission folder...")
        shutil.rmtree(submission_folder)
    
    print(f"Creating submission folder: {submission_folder}")
    print()
    
    backend_files = []
    frontend_files = []
    
    # Collect backend files
    print("📁 COLLECTING BACKEND FILES...")
    print("-" * 60)
    backend_dir = os.path.join(project_root, "backend")
    backend_output = os.path.join(submission_folder, "backend")
    
    if os.path.exists(backend_dir):
        backend_files = collect_files(backend_dir, backend_output, exclude_patterns)
        print(f"\n✓ Collected {len(backend_files)} backend files\n")
    else:
        print(f"✗ Backend directory not found: {backend_dir}\n")
    
    # Collect frontend files
    print("📁 COLLECTING FRONTEND FILES...")
    print("-" * 60)
    frontend_dir = os.path.join(project_root, "html-version")
    frontend_output = os.path.join(submission_folder, "frontend")
    
    if os.path.exists(frontend_dir):
        frontend_files = collect_files(frontend_dir, frontend_output, exclude_patterns)
        print(f"\n✓ Collected {len(frontend_files)} frontend files\n")
    else:
        print(f"✗ Frontend directory not found: {frontend_dir}\n")
    
    # Create file list documentation
    print("📄 CREATING FILE LIST...")
    print("-" * 60)
    
    # Ensure submission folder exists
    os.makedirs(submission_folder, exist_ok=True)
    
    file_list_path = os.path.join(submission_folder, "FILE_LIST.txt")
    with open(file_list_path, 'w') as f:
        f.write("HIGH STREET GYM - SUBMISSION FILES\n")
        f.write("=" * 60 + "\n\n")
        
        f.write("BACKEND FILES:\n")
        f.write("-" * 60 + "\n")
        for item in backend_files:
            f.write(f"{item['original']}\n")
        
        f.write(f"\nTotal Backend Files: {len(backend_files)}\n\n")
        
        f.write("FRONTEND FILES:\n")
        f.write("-" * 60 + "\n")
        for item in frontend_files:
            f.write(f"{item['original']}\n")
        
        f.write(f"\nTotal Frontend Files: {len(frontend_files)}\n\n")
        f.write(f"TOTAL FILES: {len(backend_files) + len(frontend_files)}\n")
    
    print(f"✓ File list created: {file_list_path}\n")
    
    # Summary
    print("=" * 60)
    print("SUMMARY")
    print("=" * 60)
    print(f"Backend files collected: {len(backend_files)}")
    print(f"Frontend files collected: {len(frontend_files)}")
    print(f"Total files: {len(backend_files) + len(frontend_files)}")
    print(f"\nSubmission folder: {submission_folder}")
    print("=" * 60)

if __name__ == "__main__":
    main()
