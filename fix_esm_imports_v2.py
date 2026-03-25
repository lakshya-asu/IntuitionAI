import os
import re

def fix_imports(dir_path):
    for root, dirs, files in os.walk(dir_path):
        for file in files:
            if file.endswith(".ts") or file.endswith(".tsx"):
                path = os.path.join(root, file)
                with open(path, "r") as f:
                    content = f.read()
                
                # 1. Fix relative imports missing .js
                new_content = re.sub(
                    r"(from|import)\s+(['\"])((\.\.?\/)+[^'\".]+)(['\"])",
                    r"\1 \2\3.js\5",
                    content
                )
                
                # 2. Fix @shared alias for server files
                # If we are in 'server' or 'api', @shared/ is ../shared/
                if "server" in root or "api" in root:
                    # Determine nesting level to calculate correct relative path to shared
                    rel_to_root = os.path.relpath(root, ".")
                    depth = len(rel_to_root.split(os.sep))
                    prefix = "../" * depth
                    
                    new_content = re.sub(
                        r"(from|import)\s+(['\"])@shared/([^'\".]+)(['\"])",
                        rf"\1 \2{prefix}shared/\3.js\5",
                        new_content
                    )
                
                if new_content != content:
                    with open(path, "w") as f:
                        f.write(new_content)
                    print(f"Fixed imports in {path}")

fix_imports("server")
fix_imports("api")
fix_imports("shared")
