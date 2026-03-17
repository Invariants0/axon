"""Add trace_id and timing fields for Phase-4 observability.

Revision ID: phase4_observability_001
Revises: 
Create Date: 2026-03-17 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'phase4_observability_001'
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    """Add trace_id to Task and timing fields to AgentExecution."""
    # Add trace_id to tasks table
    op.add_column('tasks', sa.Column('trace_id', sa.String(36), nullable=False, server_default=sa.func.uuid()))
    op.create_index('ix_tasks_trace_id', 'tasks', ['trace_id'])
    
    # Add timing fields to agent_executions table
    op.add_column('agent_executions', sa.Column('start_time', sa.DateTime(timezone=True), nullable=True))
    op.add_column('agent_executions', sa.Column('end_time', sa.DateTime(timezone=True), nullable=True))
    op.add_column('agent_executions', sa.Column('duration_ms', sa.Integer(), nullable=True))
    op.add_column('agent_executions', sa.Column('error_message', sa.Text(), nullable=True))


def downgrade():
    """Remove phase-4 observability fields."""
    op.drop_column('agent_executions', 'error_message')
    op.drop_column('agent_executions', 'duration_ms')
    op.drop_column('agent_executions', 'end_time')
    op.drop_column('agent_executions', 'start_time')
    op.drop_index('ix_tasks_trace_id', table_name='tasks')
    op.drop_column('tasks', 'trace_id')
