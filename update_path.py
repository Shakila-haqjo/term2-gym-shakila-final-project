# update_path.py

import os
import sys

def get_comment_syntax(file_extension):
    """Return the appropriate comment syntax for different file types."""
    comment_map = {
        '.js': '//',
        '.jsx': '//',
        '.ts': '//',
        '.tsx': '//',
        '.css': '/*',
        '.html': '<!--',
        '.py': '#',
        '.sql': '--',
        '.md': '<!--',
        '.json': '',  # JSON doesn't support comments
        '.env': '#',
        '.sh': '#',
    }
    
    closing_map = {
        '.css': ' */',
        '.html': ' -->',
        '.md': ' -->',
    }
    
    comment_start = comment_map.get(file_extension, '#')
    comment_end = closing_map.get(file_extension, '')
    
    return comment_start, comment_end

def add_path_to_file(file_path, root_dir):
    """Add the file path as a comment at the top of the file."""
    
    # Get file extension
    _, ext = os.path.splitext(file_path)
    
    # Skip if JSON (doesn't support comments)
    if ext == '.json':
        print(f"Skipped (JSON): {file_path}")
        return
    
    # Get relative path from root directory
    relative_path = os.path.relpath(file_path, root_dir)
    
    # Get comment syntax
    comment_start, comment_end = get_comment_syntax(ext)
    
    # Create the path comment
    path_comment = f"{comment_start} {relative_path}{comment_end}\n"
    
    try:
        # Read the existing content
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Check if path comment already exists at the top
        first_line = content.split('\n')[0] if content else ''
        
        # If the file already has the path comment, skip it
        if relative_path in first_line:
            print(f"Already has path: {relative_path}")
            return
        
        # Add path comment at the top
        new_content = path_comment + content
        
        # Write back to file
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(new_content)
        
        print(f"✅ Updated: {relative_path}")
        
    except Exception as e:
        print(f"❌ Error processing {file_path}: {e}")

def process_directory(root_dir):
    """Process all files in the directory and subdirectories."""
    
    # Files and directories to skip
    skip_dirs = {'node_modules', '.git', '__pycache__', 'venv', 'env', '.venv', 'dist', 'build'}
    skip_files = {'.DS_Store', '.gitignore', 'package-lock.json', 'yarn.lock'}
    
    file_count = 0
    
    for dirpath, dirnames, filenames in os.walk(root_dir):
        # Remove skip directories from dirnames to prevent walking into them
        dirnames[:] = [d for d in dirnames if d not in skip_dirs]
        
        for filename in filenames:
            # Skip certain files
            if filename in skip_files:
                continue
            
            file_path = os.path.join(dirpath, filename)
            
            # Process only text files (with known extensions)
            _, ext = os.path.splitext(filename)
            if ext in ['.js', '.jsx', '.ts', '.tsx', '.css', '.html', '.py', '.sql', '.md', '.env', '.sh', '.txt']:
                add_path_to_file(file_path, root_dir)
                file_count += 1
    
    print(f"\n{'='*50}")
    print(f"✅ Processed {file_count} files")
    print(f"{'='*50}")

if __name__ == "__main__":
    # Get the directory to process
    if len(sys.argv) > 1:
        target_dir = sys.argv[1]
    else:
        target_dir = os.getcwd()
    
    if not os.path.isdir(target_dir):
        print(f"Error: {target_dir} is not a valid directory")
        sys.exit(1)
    
    print(f"Processing directory: {target_dir}")
    print(f"{'='*50}\n")
    
    process_directory(target_dir)