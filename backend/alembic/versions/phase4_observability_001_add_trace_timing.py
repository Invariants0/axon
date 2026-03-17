"""Add trace_id and timing fields for Phase-4 observability.

Revision ID: phase4_observability_001
Revises: 0001_initial
Create Date: 2026-03-17 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'phase4_observability_001'
down_revision = '0001_initial'
branch_labels = None
depends_on = None


def upgrade():
    """Phase-4 observability fields are already included in 0001_initial consolidated schema.
    This migration is a no-op for fresh installations but preserves the migration chain."""
    pass


def downgrade():
    """No-op: fields are managed by 0001_initial."""
    pass
