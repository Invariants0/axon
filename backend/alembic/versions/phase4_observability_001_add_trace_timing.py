"""Add trace_id and timing fields for Phase-4 observability.

Revision ID: phase4_observability_001
Revises: 0001_initial
Create Date: 2026-03-17 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect


# revision identifiers, used by Alembic.
revision = 'phase4_observability_001'
down_revision = '0001_initial'
branch_labels = None
depends_on = None


def upgrade():
    """Add trace_id to Task and timing fields to AgentExecution."""
    bind = op.get_bind()
    inspector = inspect(bind)

    task_columns = {column['name'] for column in inspector.get_columns('tasks')}
    task_indexes = {index['name'] for index in inspector.get_indexes('tasks')}

    if 'trace_id' not in task_columns:
        op.add_column(
            'tasks',
            sa.Column(
                'trace_id',
                sa.String(36),
                nullable=False,
                server_default=sa.text('gen_random_uuid()::text'),
            ),
        )

    if 'ix_tasks_trace_id' not in task_indexes:
        op.create_index('ix_tasks_trace_id', 'tasks', ['trace_id'])

    agent_columns = {column['name'] for column in inspector.get_columns('agent_executions')}

    if 'start_time' not in agent_columns:
        op.add_column('agent_executions', sa.Column('start_time', sa.DateTime(timezone=True), nullable=True))
    if 'end_time' not in agent_columns:
        op.add_column('agent_executions', sa.Column('end_time', sa.DateTime(timezone=True), nullable=True))
    if 'duration_ms' not in agent_columns:
        op.add_column('agent_executions', sa.Column('duration_ms', sa.Integer(), nullable=True))
    if 'error_message' not in agent_columns:
        op.add_column('agent_executions', sa.Column('error_message', sa.Text(), nullable=True))


def downgrade():
    """Remove phase-4 observability fields."""
    bind = op.get_bind()
    inspector = inspect(bind)

    agent_columns = {column['name'] for column in inspector.get_columns('agent_executions')}
    if 'error_message' in agent_columns:
        op.drop_column('agent_executions', 'error_message')
    if 'duration_ms' in agent_columns:
        op.drop_column('agent_executions', 'duration_ms')
    if 'end_time' in agent_columns:
        op.drop_column('agent_executions', 'end_time')
    if 'start_time' in agent_columns:
        op.drop_column('agent_executions', 'start_time')

    task_indexes = {index['name'] for index in inspector.get_indexes('tasks')}
    if 'ix_tasks_trace_id' in task_indexes:
        op.drop_index('ix_tasks_trace_id', table_name='tasks')

    task_columns = {column['name'] for column in inspector.get_columns('tasks')}
    if 'trace_id' in task_columns:
        op.drop_column('tasks', 'trace_id')
