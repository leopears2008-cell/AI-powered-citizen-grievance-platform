"""initial schema

Revision ID: 0001
Revises: 
"""
from alembic import op
import sqlalchemy as sa


revision = '0001'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table('departments',
    sa.Column('id', sa.String(length=64), nullable=False),
    sa.Column('name', sa.String(length=160), nullable=False),
    sa.Column('name_ta', sa.String(length=160), nullable=True),
    sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('name')
    )
    op.create_table('revoked_tokens',
    sa.Column('jti', sa.String(length=64), nullable=False),
    sa.Column('expires_at', sa.DateTime(timezone=True), nullable=False),
    sa.PrimaryKeyConstraint('jti')
    )
    op.create_table('users',
    sa.Column('id', sa.Uuid(), nullable=False),
    sa.Column('email', sa.String(length=254), nullable=False),
    sa.Column('password_hash', sa.String(length=255), nullable=False),
    sa.Column('full_name', sa.String(length=120), nullable=False),
    sa.Column('role', sa.Enum('CITIZEN', 'OFFICER', 'ADMIN', name='role', native_enum=False, length=16), nullable=False),
    sa.Column('department_id', sa.String(length=64), nullable=True),
    sa.Column('is_active', sa.Boolean(), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
    sa.ForeignKeyConstraint(['department_id'], ['departments.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_users_email'), 'users', ['email'], unique=True)
    op.create_table('audit_logs',
    sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
    sa.Column('actor_id', sa.Uuid(), nullable=True),
    sa.Column('action', sa.String(length=80), nullable=False),
    sa.Column('entity', sa.String(length=80), nullable=True),
    sa.Column('entity_id', sa.String(length=64), nullable=True),
    sa.Column('detail', sa.JSON(), nullable=True),
    sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    sa.ForeignKeyConstraint(['actor_id'], ['users.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_audit_logs_action'), 'audit_logs', ['action'], unique=False)
    op.create_index(op.f('ix_audit_logs_created_at'), 'audit_logs', ['created_at'], unique=False)
    op.create_table('complaints',
    sa.Column('id', sa.Uuid(), nullable=False),
    sa.Column('reference_number', sa.String(length=20), nullable=False),
    sa.Column('citizen_id', sa.Uuid(), nullable=False),
    sa.Column('title', sa.String(length=200), nullable=False),
    sa.Column('description', sa.Text(), nullable=False),
    sa.Column('location', sa.String(length=300), nullable=True),
    sa.Column('district', sa.String(length=80), nullable=True),
    sa.Column('language', sa.String(length=8), nullable=False),
    sa.Column('status', sa.Enum('SUBMITTED', 'UNDER_REVIEW', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'REJECTED', 'REOPENED', name='status', native_enum=False, length=16), nullable=False),
    sa.Column('department_id', sa.String(length=64), nullable=True),
    sa.Column('assigned_officer_id', sa.Uuid(), nullable=True),
    sa.Column('severity', sa.String(length=10), nullable=False),
    sa.Column('sla_due_at', sa.DateTime(timezone=True), nullable=True),
    sa.Column('ai_suggestion', sa.JSON(), nullable=True),
    sa.Column('resolved_at', sa.DateTime(timezone=True), nullable=True),
    sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
    sa.ForeignKeyConstraint(['assigned_officer_id'], ['users.id'], ),
    sa.ForeignKeyConstraint(['citizen_id'], ['users.id'], ),
    sa.ForeignKeyConstraint(['department_id'], ['departments.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_complaints_assigned_officer_id'), 'complaints', ['assigned_officer_id'], unique=False)
    op.create_index(op.f('ix_complaints_citizen_id'), 'complaints', ['citizen_id'], unique=False)
    op.create_index(op.f('ix_complaints_department_id'), 'complaints', ['department_id'], unique=False)
    op.create_index(op.f('ix_complaints_reference_number'), 'complaints', ['reference_number'], unique=True)
    op.create_index('ix_complaints_status_dept', 'complaints', ['status', 'department_id'], unique=False)
    op.create_table('attachments',
    sa.Column('id', sa.Uuid(), nullable=False),
    sa.Column('complaint_id', sa.Uuid(), nullable=False),
    sa.Column('storage_key', sa.String(length=300), nullable=False),
    sa.Column('content_type', sa.String(length=80), nullable=False),
    sa.Column('size_bytes', sa.Integer(), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    sa.ForeignKeyConstraint(['complaint_id'], ['complaints.id'], ),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('storage_key')
    )
    op.create_index(op.f('ix_attachments_complaint_id'), 'attachments', ['complaint_id'], unique=False)
    op.create_table('complaint_feedback',
    sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
    sa.Column('complaint_id', sa.Uuid(), nullable=False),
    sa.Column('citizen_id', sa.Uuid(), nullable=False),
    sa.Column('rating', sa.Integer(), nullable=False),
    sa.Column('comment', sa.Text(), nullable=True),
    sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    sa.ForeignKeyConstraint(['citizen_id'], ['users.id'], ),
    sa.ForeignKeyConstraint(['complaint_id'], ['complaints.id'], ),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('complaint_id', name='uq_feedback_complaint')
    )
    op.create_table('complaint_status_history',
    sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
    sa.Column('complaint_id', sa.Uuid(), nullable=False),
    sa.Column('from_status', sa.Enum('SUBMITTED', 'UNDER_REVIEW', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'REJECTED', 'REOPENED', name='status', native_enum=False, length=16), nullable=True),
    sa.Column('to_status', sa.Enum('SUBMITTED', 'UNDER_REVIEW', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'REJECTED', 'REOPENED', name='status', native_enum=False, length=16), nullable=False),
    sa.Column('changed_by', sa.Uuid(), nullable=False),
    sa.Column('remarks', sa.Text(), nullable=True),
    sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    sa.ForeignKeyConstraint(['changed_by'], ['users.id'], ),
    sa.ForeignKeyConstraint(['complaint_id'], ['complaints.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_complaint_status_history_complaint_id'), 'complaint_status_history', ['complaint_id'], unique=False)
    op.create_table('notifications',
    sa.Column('id', sa.Uuid(), nullable=False),
    sa.Column('user_id', sa.Uuid(), nullable=False),
    sa.Column('complaint_id', sa.Uuid(), nullable=True),
    sa.Column('message', sa.String(length=500), nullable=False),
    sa.Column('read', sa.Boolean(), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    sa.ForeignKeyConstraint(['complaint_id'], ['complaints.id'], ),
    sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_notifications_user_id'), 'notifications', ['user_id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_notifications_user_id'), table_name='notifications')
    op.drop_table('notifications')
    op.drop_index(op.f('ix_complaint_status_history_complaint_id'), table_name='complaint_status_history')
    op.drop_table('complaint_status_history')
    op.drop_table('complaint_feedback')
    op.drop_index(op.f('ix_attachments_complaint_id'), table_name='attachments')
    op.drop_table('attachments')
    op.drop_index('ix_complaints_status_dept', table_name='complaints')
    op.drop_index(op.f('ix_complaints_reference_number'), table_name='complaints')
    op.drop_index(op.f('ix_complaints_department_id'), table_name='complaints')
    op.drop_index(op.f('ix_complaints_citizen_id'), table_name='complaints')
    op.drop_index(op.f('ix_complaints_assigned_officer_id'), table_name='complaints')
    op.drop_table('complaints')
    op.drop_index(op.f('ix_audit_logs_created_at'), table_name='audit_logs')
    op.drop_index(op.f('ix_audit_logs_action'), table_name='audit_logs')
    op.drop_table('audit_logs')
    op.drop_index(op.f('ix_users_email'), table_name='users')
    op.drop_table('users')
    op.drop_table('revoked_tokens')
    op.drop_table('departments')
