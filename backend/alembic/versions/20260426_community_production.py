"""community production hardening

Revision ID: 20260426_community_prod
Revises:
Create Date: 2026-04-26 13:35:00
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision = "20260426_community_prod"
down_revision = None
branch_labels = None
depends_on = None


def _table_exists(bind, table_name: str) -> bool:
    inspector = sa.inspect(bind)
    return table_name in inspector.get_table_names()


def _column_exists(bind, table_name: str, column_name: str) -> bool:
    inspector = sa.inspect(bind)
    columns = {column["name"] for column in inspector.get_columns(table_name)}
    return column_name in columns


def upgrade() -> None:
    bind = op.get_bind()

    if not _table_exists(bind, "community_posts"):
        op.create_table(
            "community_posts",
            sa.Column("id", sa.Integer(), primary_key=True),
            sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=True),
            sa.Column("post_type", sa.String(), nullable=True),
            sa.Column("title", sa.String(), nullable=True),
            sa.Column("content", sa.String(), nullable=True),
            sa.Column("image_urls", postgresql.ARRAY(sa.String()), nullable=True),
            sa.Column("tags", postgresql.ARRAY(sa.String()), nullable=True),
            sa.Column("crop_tags", postgresql.ARRAY(sa.String()), nullable=True),
            sa.Column("lat", sa.Float(), nullable=True),
            sa.Column("lon", sa.Float(), nullable=True),
            sa.Column("moderation_status", sa.String(), nullable=True, server_default="pending"),
            sa.Column("likes_count", sa.Integer(), nullable=True, server_default="0"),
            sa.Column("comments_count", sa.Integer(), nullable=True, server_default="0"),
            sa.Column("views_count", sa.Integer(), nullable=True, server_default="0"),
            sa.Column("is_pinned", sa.Boolean(), nullable=True, server_default=sa.text("false")),
            sa.Column("is_deleted", sa.Boolean(), nullable=True, server_default=sa.text("false")),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP")),
            sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        )
        op.create_index("ix_community_posts_id", "community_posts", ["id"])
    else:
        if not _column_exists(bind, "community_posts", "is_deleted"):
            op.add_column("community_posts", sa.Column("is_deleted", sa.Boolean(), nullable=True, server_default=sa.text("false")))
        if not _column_exists(bind, "community_posts", "updated_at"):
            op.add_column("community_posts", sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True))

    if not _table_exists(bind, "community_comments"):
        op.create_table(
            "community_comments",
            sa.Column("id", sa.Integer(), primary_key=True),
            sa.Column("post_id", sa.Integer(), sa.ForeignKey("community_posts.id"), nullable=False),
            sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=True),
            sa.Column("author_name", sa.String(), nullable=True),
            sa.Column("content", sa.Text(), nullable=False),
            sa.Column("is_deleted", sa.Boolean(), nullable=True, server_default=sa.text("false")),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP")),
            sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        )
        op.create_index("ix_community_comments_id", "community_comments", ["id"])
        op.create_index("ix_community_comments_post_id", "community_comments", ["post_id"])
        op.create_index("ix_community_comments_user_id", "community_comments", ["user_id"])

    if not _table_exists(bind, "community_likes"):
        op.create_table(
            "community_likes",
            sa.Column("id", sa.Integer(), primary_key=True),
            sa.Column("post_id", sa.Integer(), sa.ForeignKey("community_posts.id"), nullable=False),
            sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP")),
            sa.UniqueConstraint("post_id", "user_id", name="uq_community_likes_post_user"),
        )
        op.create_index("ix_community_likes_id", "community_likes", ["id"])
        op.create_index("ix_community_likes_post_id", "community_likes", ["post_id"])
        op.create_index("ix_community_likes_user_id", "community_likes", ["user_id"])

    if not _table_exists(bind, "community_reports"):
        op.create_table(
            "community_reports",
            sa.Column("id", sa.Integer(), primary_key=True),
            sa.Column("post_id", sa.Integer(), sa.ForeignKey("community_posts.id"), nullable=False),
            sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
            sa.Column("reason", sa.String(), nullable=False),
            sa.Column("details", sa.Text(), nullable=True),
            sa.Column("status", sa.String(), nullable=True, server_default="open"),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP")),
        )
        op.create_index("ix_community_reports_id", "community_reports", ["id"])
        op.create_index("ix_community_reports_post_id", "community_reports", ["post_id"])
        op.create_index("ix_community_reports_user_id", "community_reports", ["user_id"])


def downgrade() -> None:
    op.drop_table("community_reports")
    op.drop_table("community_likes")
    op.drop_table("community_comments")
    op.drop_table("community_posts")
