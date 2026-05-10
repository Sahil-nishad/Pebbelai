"""add followups table

Revision ID: 20260508_000002
Revises: 20260508_000001
Create Date: 2026-05-08
"""

from alembic import op
import sqlalchemy as sa


revision = "20260508_000002"
down_revision = "20260508_000001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "followups",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column("user_id", sa.String(length=255), nullable=False),
        sa.Column(
            "application_id",
            sa.String(length=36),
            sa.ForeignKey("applications.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("subject", sa.String(length=255), nullable=False),
        sa.Column("body", sa.Text(), nullable=False),
        sa.Column("sent_status", sa.String(length=50), nullable=False, server_default="pending"),
        sa.Column("gmail_message_id", sa.String(length=255), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
    )
    op.create_index("ix_followups_user_id", "followups", ["user_id"])
    op.create_index("ix_followups_application_id", "followups", ["application_id"])


def downgrade() -> None:
    op.drop_index("ix_followups_application_id", table_name="followups")
    op.drop_index("ix_followups_user_id", table_name="followups")
    op.drop_table("followups")
