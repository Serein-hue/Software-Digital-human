"""Stub for Oculus Lip Sync - returns empty viseme data.
TODO: Replace with real lip sync implementation.
"""
import os


class LipSyncGenerator:
    """Stub LipSyncGenerator that returns empty viseme data."""

    def generate_visemes(self, audio_path: str):
        """Return empty viseme list (stub).

        Real implementation should analyze audio and return
        (viseme_id, start_time, end_time) tuples.
        """
        if not os.path.exists(audio_path):
            print(f"[LipSync] Audio file not found: {audio_path}")
        return []

    def consolidate_visemes(self, visemes: list, min_duration: float = 0.05):
        """Return consolidated visemes (passthrough for stub)."""
        return visemes
