#!/usr/bin/env python3
"""
Project Exporter - Luanti Learning Universe
Exportiert alle Projekt-Dateien in eine einzige Text-Datei für KI-Analyse
"""

import os
from pathlib import Path
from datetime import datetime

# Dateien die NICHT exportiert werden sollen
IGNORE_PATTERNS = [
    '.git',
    '__pycache__',
    'node_modules',
    '.venv',
    'venv',
    '.env',  # Secrets!
    '.DS_Store',
    'Thumbs.db',
    '*.pyc',
    '*.log',
    'uploads',  # User Data
    'logs',
    'acme.json',  # SSL Certs
    '.pytest_cache',
    '*.sqlite',
    '*.db',
]

# Datei-Extensions die exportiert werden
INCLUDE_EXTENSIONS = [
    '.yml', '.yaml',
    '.sh', '.bash',
    '.py',
    '.js', '.ts',
    '.json',
    '.md', '.txt',
    '.conf',
    '.lua',
    '.dockerfile', 'Dockerfile',
    '.gitignore',
    '.env.example',
]

def should_ignore(path: Path) -> bool:
    """Prüft ob Pfad ignoriert werden soll"""
    path_str = str(path)
    
    # Prüfe Ignore Patterns
    for pattern in IGNORE_PATTERNS:
        if pattern in path_str:
            return True
    
    return False

def should_include(path: Path) -> bool:
    """Prüft ob Datei inkludiert werden soll"""
    # Spezielle Dateien ohne Extension
    special_files = ['Dockerfile', '.gitignore', '.dockerignore']
    if path.name in special_files:
        return True
    
    # Extension Check
    suffix = path.suffix.lower()
    if suffix in INCLUDE_EXTENSIONS:
        return True
    
    # .env.example explizit inkludieren
    if path.name == '.env.example':
        return True
    
    return False

def get_relative_path(path: Path, root: Path) -> str:
    """Gibt relativen Pfad zurück"""
    try:
        return str(path.relative_to(root))
    except ValueError:
        return str(path)

def export_project(root_dir: str = '.', output_file: str = None):
    """Exportiert Projekt in Text-Datei"""
    
    root = Path(root_dir).resolve()
    
    # Output Dateiname
    if output_file is None:
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        output_file = f'project_export_{timestamp}.txt'
    
    print(f"🔍 Scanne Projekt in: {root}")
    print(f"📝 Exportiere nach: {output_file}")
    print()
    
    files_found = []
    
    # Sammle alle Dateien
    for path in root.rglob('*'):
        if path.is_file() and not should_ignore(path) and should_include(path):
            files_found.append(path)
    
    print(f"✅ {len(files_found)} Dateien gefunden")
    print()
    
    # Sortiere nach Pfad
    files_found.sort()
    
    # Exportiere
    with open(output_file, 'w', encoding='utf-8') as f:
        # Header
        f.write("=" * 80 + "\n")
        f.write("LUANTI LEARNING UNIVERSE - PROJECT EXPORT\n")
        f.write("=" * 80 + "\n")
        f.write(f"Export Date: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
        f.write(f"Root Directory: {root}\n")
        f.write(f"Total Files: {len(files_found)}\n")
        f.write("=" * 80 + "\n\n")
        
        # Datei-Liste (Index)
        f.write("FILE INDEX:\n")
        f.write("-" * 80 + "\n")
        for i, path in enumerate(files_found, 1):
            rel_path = get_relative_path(path, root)
            f.write(f"{i:3d}. {rel_path}\n")
        f.write("\n" + "=" * 80 + "\n\n")
        
        # Datei-Inhalte
        for i, path in enumerate(files_found, 1):
            rel_path = get_relative_path(path, root)
            
            print(f"[{i}/{len(files_found)}] {rel_path}")
            
            f.write("\n" + "=" * 80 + "\n")
            f.write(f"FILE: {rel_path}\n")
            f.write("=" * 80 + "\n\n")
            
            try:
                # Lese Datei
                with open(path, 'r', encoding='utf-8') as file:
                    content = file.read()
                    f.write(content)
                    
                    # Stelle sicher, dass Datei mit Newline endet
                    if not content.endswith('\n'):
                        f.write('\n')
                        
            except UnicodeDecodeError:
                f.write("[BINARY FILE - SKIPPED]\n")
            except Exception as e:
                f.write(f"[ERROR READING FILE: {e}]\n")
            
            f.write("\n")
    
    print()
    print(f"✅ Export erfolgreich!")
    print(f"📄 Datei: {output_file}")
    
    # Zeige Dateigröße
    size_mb = os.path.getsize(output_file) / (1024 * 1024)
    print(f"📊 Größe: {size_mb:.2f} MB")
    print()
    print("🤖 Diese Datei kannst du jetzt einer KI geben!")

if __name__ == '__main__':
    import sys
    
    print("=" * 80)
    print("PROJECT EXPORTER - Luanti Learning Universe")
    print("=" * 80)
    print()
    
    # Optional: Verzeichnis als Argument
    root_dir = sys.argv[1] if len(sys.argv) > 1 else '.'
    
    # Optional: Output-Datei als Argument
    output_file = sys.argv[2] if len(sys.argv) > 2 else None
    
    try:
        export_project(root_dir, output_file)
    except KeyboardInterrupt:
        print("\n\n❌ Abgebrochen")
        sys.exit(1)
    except Exception as e:
        print(f"\n\n❌ Fehler: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)