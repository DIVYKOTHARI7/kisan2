"""add village column to users

Revision ID: 20260428_add_village_column
Revises: 
Create Date: 2026-04-28 00:00:00.000000
"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '20260428_add_village_column'
down_revision = '20260426_community_prod'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('users', sa.Column('village', sa.String(), nullable=True))


def downgrade():
    op.drop_column('users', 'village')
