"""Evolution Safety Layer - Validates generated skills before deployment.

Phase-4: Ensures generated skills are syntactically correct, have safe imports,
and pass basic tests before being registered in the skill registry.
"""

from __future__ import annotations

import ast
import re
from pathlib import Path

from src.utils.logger import get_logger

logger = get_logger(__name__)


class EvolutionSafetyValidator:
    """Validates generated skills for safety and correctness."""

    # Unsafe imports that should not be allowed in generated skills
    UNSAFE_IMPORTS = {
        "os",  # File system access
        "subprocess",  # Command execution
        "sys",  # System manipulation
        "importlib",  # Dynamic imports
        "__import__",  # Dynamic imports
        "eval",  # Code evaluation
        "exec",  # Code execution
        "compile",  # Code compilation
        "open",  # File access (restricted)
        "file",  # File access (restricted)
        "input",  # User input (could hang)
    }

    @staticmethod
    def validate_syntax(code: str) -> tuple[bool, str | None]:
        """
        Validate Python syntax.
        
        Args:
            code: Python code to validate
            
        Returns:
            Tuple of (is_valid, error_message)
        """
        try:
            ast.parse(code)
            return True, None
        except SyntaxError as e:
            return False, f"Syntax error: {e.msg} at line {e.lineno}"
        except Exception as e:
            return False, f"Parse error: {str(e)}"

    @staticmethod
    def validate_imports(code: str) -> tuple[bool, list[str]]:
        """
        Validate that imports are safe.
        
        Args:
            code: Python code to check
            
        Returns:
            Tuple of (is_safe, unsafe_imports_found)
        """
        tree = ast.parse(code)
        unsafe_found = []
        
        for node in ast.walk(tree):
            if isinstance(node, ast.Import):
                for alias in node.names:
                    module_name = alias.name.split(".")[0]
                    if module_name in EvolutionSafetyValidator.UNSAFE_IMPORTS:
                        unsafe_found.append(module_name)
            elif isinstance(node, ast.ImportFrom):
                if node.module and node.module.split(".")[0] in EvolutionSafetyValidator.UNSAFE_IMPORTS:
                    unsafe_found.append(node.module)
        
        return len(unsafe_found) == 0, list(set(unsafe_found))

    @staticmethod
    def validate_function_signature(code: str) -> tuple[bool, str | None]:
        """
        Validate that skill has required function signature.
        
        Args:
            code: Python code to check
            
        Returns:
            Tuple of (is_valid, error_message)
        """
        tree = ast.parse(code)
        has_execute = False
        
        for node in ast.walk(tree):
            if isinstance(node, ast.AsyncFunctionDef) and node.name == "execute":
                has_execute = True
                # Check parameters
                if not any(arg.arg == "payload" for arg in node.args.args):
                    return False, "execute() function must have 'payload' parameter"
        
        if not has_execute:
            return False, "Skill must have async def execute(payload: dict) function"
        
        return True, None

    @staticmethod
    def validate_skill_structure(code: str) -> tuple[bool, str | None]:
        """
        Validate that skill has SKILL dictionary.
        
        Args:
            code: Python code to check
            
        Returns:
            Tuple of (is_valid, error_message)
        """
        # Check for SKILL dict using regex
        skill_pattern = r'SKILL\s*=\s*{.*}'
        if not re.search(skill_pattern, code, re.DOTALL):
            return False, "Skill must define SKILL dictionary"
        
        try:
            # Extract and evaluate SKILL dict
            match = re.search(r'SKILL\s*=\s*({.*?})', code, re.DOTALL)
            if not match:
                return False, "Could not extract SKILL dictionary"
            
            skill_dict_str = match.group(1)
            # Basic validation that it's valid Python dict literals
            ast.parse(f"x = {skill_dict_str}", mode="exec")
            
            return True, None
        except Exception as e:
            return False, f"SKILL dictionary parse error: {str(e)}"

    @staticmethod
    def validate_all(code: str) -> tuple[bool, list[str]]:
        """
        Run all validations and return comprehensive results.
        
        Args:
            code: Python code to validate
            
        Returns:
            Tuple of (is_valid, error_messages)
        """
        errors = []
        
        # Syntax validation
        valid, error = EvolutionSafetyValidator.validate_syntax(code)
        if not valid:
            errors.append(error)
            # Can't continue if syntax is invalid
            return False, errors
        
        # Import validation
        safe, unsafe_imports = EvolutionSafetyValidator.validate_imports(code)
        if not safe:
            errors.append(f"Unsafe imports detected: {', '.join(unsafe_imports)}")
        
        # Function signature validation
        valid, error = EvolutionSafetyValidator.validate_function_signature(code)
        if not valid:
            errors.append(error)
        
        # Skill structure validation
        valid, error = EvolutionSafetyValidator.validate_skill_structure(code)
        if not valid:
            errors.append(error)
        
        return len(errors) == 0, errors


class SkillVersioning:
    """Manages skill versioning to support evolution over time."""

    @staticmethod
    def get_versioned_name(base_name: str, current_skills: dict) -> str:
        """
        Get a versioned name for a skill, avoiding conflicts.
        
        Args:
            base_name: Base skill name (e.g., "markdown_parser")
            current_skills: Dict of currently loaded skills
            
        Returns:
            Versioned skill name (e.g., "markdown_parser_v2")
        """
        if base_name not in current_skills:
            return base_name
        
        # Find highest version
        version = 1
        while f"{base_name}_v{version + 1}" in current_skills:
            version += 1
        
        return f"{base_name}_v{version + 1}"

    @staticmethod
    def parse_version(skill_name: str) -> tuple[str, int]:
        """
        Parse skill name and version number.
        
        Args:
            skill_name: Skill name with optional version suffix
            
        Returns:
            Tuple of (base_name, version_number)
        """
        match = re.match(r"^(.+)_v(\d+)$", skill_name)
        if match:
            return match.group(1), int(match.group(2))
        return skill_name, 1
