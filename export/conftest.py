"""Configuración de pytest: agrega la raíz del repositorio a sys.path."""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
