"""Helpers for representing confidence and warnings from vision pipeline."""

def warning_dict(message: str, level: str = 'warning'):
    return {'message': message, 'level': level}
